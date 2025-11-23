from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from typing import Optional
from datetime import datetime
import json
import math
from app.core.database import get_db
from app.core.deps import get_current_user, require_inventory_manager
from app.models.spare_part import SparePart
from app.models.inventory_transaction import InventoryTransaction
from app.models.spare_part_category import SparePartCategory
from app.models.user import User
from app.schemas.spare_part import (
    SparePartCreate,
    SparePartUpdate,
    SparePartResponse,
    SparePartListResponse
)

router = APIRouter()

def calculate_stock_status(current_stock: int, minimum_stock: int, maximum_stock: Optional[int]) -> str:
    """Calculate stock status based on current, minimum, and maximum stock levels."""
    if current_stock < minimum_stock:
        return "CRITICAL"
    elif current_stock < minimum_stock * 1.5:
        return "LOW"
    elif maximum_stock and current_stock > maximum_stock:
        return "EXCESS"
    else:
        return "ADEQUATE"

@router.get("", response_model=SparePartListResponse)
async def list_spare_parts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in partNumber, name, description"),
    category_id: Optional[str] = Query(None, alias="categoryId", description="Filter by category id (comma-separated)"),
    category_name: Optional[str] = Query(None, alias="categoryName", description="(Deprecated) Filter by category name"),
    stock_status: Optional[str] = Query(None, description="Filter by stock status: CRITICAL, LOW, ADEQUATE, EXCESS"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    sort_by: Optional[str] = Query("partNumber", description="Sort field: partNumber, partName, currentStock, categoryName"),
    sort_order: Optional[str] = Query("asc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager)
):
    """List spare parts with pagination and filtering"""
    query = db.query(SparePart).options(joinedload(SparePart.category)).outerjoin(SparePartCategory)
    
    # Filter by active status
    if is_active is not None:
        query = query.filter(SparePart.isActive == is_active)
    
    # Apply search filter
    if search:
        query = query.filter(
            or_(
                SparePart.partNumber.contains(search),
                SparePart.partName.contains(search),
                SparePart.description.contains(search)
            )
        )
    
    # Filter by category id (supports comma-separated values for multi-select)
    if category_id:
        category_ids = [int(cid.strip()) for cid in category_id.split(',') if cid.strip().isdigit()]
        if category_ids:
            query = query.filter(SparePart.categoryId.in_(category_ids))
    if category_name:
        category_names = [name.strip() for name in category_name.split(',') if name.strip()]
        if category_names:
            query = query.filter(SparePartCategory.name.in_(category_names))
    
    # Filter by stock status (supports comma-separated values for multi-select)
    if stock_status:
        # Support comma-separated values for multi-select
        status_list = [s.strip() for s in stock_status.split(',') if s.strip()]
        status_conditions = []
        
        for status in status_list:
            if status == "CRITICAL":
                status_conditions.append(SparePart.currentStock < SparePart.minimumStock)
            elif status == "LOW":
                status_conditions.append(
                    and_(
                        SparePart.currentStock >= SparePart.minimumStock,
                        SparePart.currentStock < SparePart.minimumStock * 1.5
                    )
                )
            elif status == "ADEQUATE":
                status_conditions.append(
                    and_(
                        SparePart.currentStock >= SparePart.minimumStock * 1.5,
                        or_(
                            SparePart.maximumStock.is_(None),
                            SparePart.currentStock <= SparePart.maximumStock
                        )
                    )
                )
            elif status == "EXCESS":
                status_conditions.append(
                    and_(
                        SparePart.maximumStock.isnot(None),
                        SparePart.currentStock > SparePart.maximumStock
                    )
                )
        
        if status_conditions:
            query = query.filter(or_(*status_conditions))
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    if sort_by == "partNumber":
        order_column = SparePart.partNumber
    elif sort_by in ("name", "partName"):
        order_column = SparePart.partName
    elif sort_by == "currentStock":
        order_column = SparePart.currentStock
    elif sort_by == "categoryName":
        order_column = SparePartCategory.name
    else:
        order_column = SparePart.partNumber
    
    if sort_order.lower() == "desc":
        order_column = order_column.desc()
    
    query = query.order_by(order_column)
    
    # Apply pagination
    offset = (page - 1) * page_size
    spare_parts = query.offset(offset).limit(page_size).all()
    
    # Get transaction counts for all spare parts in this page
    spare_part_ids = [sp.id for sp in spare_parts]
    transaction_counts = {}
    if spare_part_ids:
        counts_query = db.query(
            InventoryTransaction.sparePartId,
            func.count(InventoryTransaction.id).label('count')
        ).filter(
            InventoryTransaction.sparePartId.in_(spare_part_ids)
        ).group_by(InventoryTransaction.sparePartId)
        
        for result in counts_query.all():
            transaction_counts[result.sparePartId] = result.count
    
    # Convert to response format with transaction counts
    spare_part_responses = []
    for sp in spare_parts:
        sp_dict = SparePartResponse.model_validate(sp).model_dump()
        sp_dict['transactionCount'] = transaction_counts.get(sp.id, 0)
        spare_part_responses.append(SparePartResponse(**sp_dict))
    
    return SparePartListResponse(
        spareParts=spare_part_responses,
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=math.ceil(total / page_size) if total > 0 else 0
    )

@router.get("/available", response_model=SparePartListResponse)
async def get_available_spare_parts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=1000, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in partNumber, name, description"),
    category_id: Optional[str] = Query(None, alias="categoryId", description="Filter by category id (comma-separated)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available spare parts (active parts with stock > 0)"""
    query = db.query(SparePart).options(joinedload(SparePart.category)).outerjoin(SparePartCategory)
    
    # Filter by active status and available stock
    query = query.filter(SparePart.isActive == True)
    query = query.filter(SparePart.currentStock > 0)
    
    # Apply search filter
    if search:
        query = query.filter(
            or_(
                SparePart.partNumber.contains(search),
                SparePart.partName.contains(search),
                SparePart.description.contains(search)
            )
        )
    
    # Filter by category id
    if category_id:
        category_ids = [int(cid.strip()) for cid in category_id.split(',') if cid.strip().isdigit()]
        if category_ids:
            query = query.filter(SparePart.categoryId.in_(category_ids))
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting (default by partNumber)
    query = query.order_by(SparePart.partNumber)
    
    # Apply pagination
    offset = (page - 1) * page_size
    spare_parts = query.offset(offset).limit(page_size).all()
    
    # Get transaction counts for all spare parts in this page
    spare_part_ids = [sp.id for sp in spare_parts]
    transaction_counts = {}
    if spare_part_ids:
        counts_query = db.query(
            InventoryTransaction.sparePartId,
            func.count(InventoryTransaction.id).label('count')
        ).filter(
            InventoryTransaction.sparePartId.in_(spare_part_ids)
        ).group_by(InventoryTransaction.sparePartId)
        
        for result in counts_query.all():
            transaction_counts[result.sparePartId] = result.count
    
    # Convert to response format with transaction counts
    spare_part_responses = []
    for sp in spare_parts:
        sp_dict = SparePartResponse.model_validate(sp).model_dump()
        sp_dict['transactionCount'] = transaction_counts.get(sp.id, 0)
        spare_part_responses.append(SparePartResponse(**sp_dict))
    
    return SparePartListResponse(
        spareParts=spare_part_responses,
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=math.ceil(total / page_size) if total > 0 else 0
    )

@router.get("/low-stock", response_model=SparePartListResponse)
async def get_low_stock_parts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in partNumber, name, description"),
    category_id: Optional[str] = Query(None, alias="categoryId", description="Filter by category id (comma-separated)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager)
):
    """Get spare parts with current stock below minimum stock level"""
    query = db.query(SparePart).options(joinedload(SparePart.category)).outerjoin(SparePartCategory).filter(
        SparePart.isActive == True,
        SparePart.currentStock < SparePart.minimumStock
    )
    
    # Apply search filter
    if search:
        query = query.filter(
            or_(
                SparePart.partNumber.contains(search),
                SparePart.partName.contains(search),
                SparePart.description.contains(search)
            )
        )
    
    # Filter by category id
    if category_id:
        category_ids = [int(cid.strip()) for cid in category_id.split(',') if cid.strip().isdigit()]
        if category_ids:
            query = query.filter(SparePart.categoryId.in_(category_ids))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    spare_parts = query.order_by(SparePart.currentStock.asc()).offset(offset).limit(page_size).all()
    
    # Get transaction counts for all spare parts in this page
    spare_part_ids = [sp.id for sp in spare_parts]
    transaction_counts = {}
    if spare_part_ids:
        counts_query = db.query(
            InventoryTransaction.sparePartId,
            func.count(InventoryTransaction.id).label('count')
        ).filter(
            InventoryTransaction.sparePartId.in_(spare_part_ids)
        ).group_by(InventoryTransaction.sparePartId)
        
        for result in counts_query.all():
            transaction_counts[result.sparePartId] = result.count
    
    # Convert to response format with transaction counts
    spare_part_responses = []
    for sp in spare_parts:
        sp_dict = SparePartResponse.model_validate(sp).model_dump()
        sp_dict['transactionCount'] = transaction_counts.get(sp.id, 0)
        spare_part_responses.append(SparePartResponse(**sp_dict))
    
    return SparePartListResponse(
        spareParts=spare_part_responses,
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=math.ceil(total / page_size) if total > 0 else 0
    )

@router.get("/{part_id}", response_model=SparePartResponse)
async def get_spare_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get spare part details by ID"""
    spare_part = (
        db.query(SparePart)
        .options(joinedload(SparePart.category))
        .filter(SparePart.id == part_id)
        .first()
    )
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Get transaction count
    transaction_count = db.query(func.count(InventoryTransaction.id)).filter(
        InventoryTransaction.sparePartId == part_id
    ).scalar() or 0
    
    # Convert to response format with transaction count
    sp_dict = SparePartResponse.model_validate(spare_part).model_dump()
    sp_dict['transactionCount'] = transaction_count
    return SparePartResponse(**sp_dict)

@router.post("", response_model=SparePartResponse)
async def create_spare_part(
    spare_part_data: SparePartCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager)
):
    """Create a new spare part"""
    # Validate partNumber uniqueness
    existing_part = db.query(SparePart).filter(SparePart.partNumber == spare_part_data.partNumber).first()
    if existing_part:
        raise HTTPException(status_code=409, detail="A spare part with this part number already exists")
    
    category = None
    if spare_part_data.categoryId is not None:
        category = db.query(SparePartCategory).filter(SparePartCategory.id == spare_part_data.categoryId).first()
        if category is None or not category.isActive:
            raise HTTPException(status_code=400, detail="Spare part category not found or inactive")

    # Create spare part
    spare_part = SparePart(
        partNumber=spare_part_data.partNumber,
        partName=spare_part_data.partName,
        description=spare_part_data.description,
        categoryId=spare_part_data.categoryId,
        currentStock=spare_part_data.currentStock,
        minimumStock=spare_part_data.minimumStock,
        maximumStock=spare_part_data.maximumStock,
        unitPrice=spare_part_data.unitPrice,
        supplier=spare_part_data.supplier,
        supplierPartNumber=spare_part_data.supplierPartNumber,
        location=spare_part_data.location,
        isActive=True
    )
    
    db.add(spare_part)
    db.commit()
    db.refresh(spare_part)
    
    # Create activity log entry
    from app.services.audit_service import log_activity
    new_values = {
        "partNumber": spare_part.partNumber,
        "partName": spare_part.partName,
        "categoryId": spare_part.categoryId,
        "categoryName": spare_part.categoryName,
        "currentStock": spare_part.currentStock,
        "minimumStock": spare_part.minimumStock
    }
    log_activity(
        db=db,
        userId=current_user.id,
        action="CREATE",
        entityType="SPARE_PART",
        entityId=spare_part.id,
        description=f"Spare part '{spare_part.partNumber}' created by {current_user.fullName}",
        newValues=new_values,
        request=request
    )
    db.commit()
    
    spare_part = (
        db.query(SparePart)
        .options(joinedload(SparePart.category))
        .filter(SparePart.id == spare_part.id)
        .first()
    )
    
    return SparePartResponse.model_validate(spare_part)

@router.patch("/{part_id}", response_model=SparePartResponse)
async def update_spare_part(
    part_id: int,
    spare_part_data: SparePartUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager)
):
    """Update spare part"""
    spare_part = db.query(SparePart).filter(SparePart.id == part_id).first()
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Store old values for activity log
    old_values = {
        "partNumber": spare_part.partNumber,
        "partName": spare_part.partName,
        "categoryId": spare_part.categoryId,
        "categoryName": spare_part.categoryName,
        "currentStock": spare_part.currentStock,
        "minimumStock": spare_part.minimumStock,
        "maximumStock": spare_part.maximumStock,
        "location": spare_part.location,
        "isActive": spare_part.isActive
    }
    
    # Validate partNumber uniqueness if being changed
    update_data = spare_part_data.model_dump(exclude_unset=True)
    if 'partNumber' in update_data and update_data['partNumber'] != spare_part.partNumber:
        existing_part = db.query(SparePart).filter(
            SparePart.partNumber == update_data['partNumber'],
            SparePart.id != part_id
        ).first()
        if existing_part:
            raise HTTPException(status_code=409, detail="A spare part with this part number already exists")

    # Validate category if provided
    if 'categoryId' in update_data:
        category_id = update_data['categoryId']
        if category_id is not None:
            category = db.query(SparePartCategory).filter(SparePartCategory.id == category_id).first()
            if category is None or not category.isActive:
                raise HTTPException(status_code=400, detail="Spare part category not found or inactive")
    
    # Track stock level change separately
    stock_changed = False
    if 'currentStock' in update_data and update_data['currentStock'] != spare_part.currentStock:
        stock_changed = True
    
    # Update fields
    for field, value in update_data.items():
        setattr(spare_part, field, value)
    
    db.commit()
    db.refresh(spare_part)
    
    # Store new values for activity log
    new_values = {
        "partNumber": spare_part.partNumber,
        "partName": spare_part.partName,
        "categoryId": spare_part.categoryId,
        "categoryName": spare_part.categoryName,
        "currentStock": spare_part.currentStock,
        "minimumStock": spare_part.minimumStock,
        "maximumStock": spare_part.maximumStock,
        "location": spare_part.location,
        "isActive": spare_part.isActive
    }
    
    # Create activity log entry
    from app.services.audit_service import log_activity
    log_action = "UPDATE"  # Use UPDATE for all updates
    log_description = f"Spare part '{spare_part.partNumber}' updated by {current_user.fullName}"
    if stock_changed:
        log_description += f" - Stock changed from {old_values['currentStock']} to {spare_part.currentStock}"
    
    log_activity(
        db=db,
        userId=current_user.id,
        action=log_action,
        entityType="SPARE_PART",
        entityId=spare_part.id,
        description=log_description,
        oldValues=old_values,
        newValues=new_values,
        request=request
    )
    db.commit()
    
    spare_part = (
        db.query(SparePart)
        .options(joinedload(SparePart.category))
        .filter(SparePart.id == part_id)
        .first()
    )
    
    return SparePartResponse.model_validate(spare_part)

@router.delete("/{part_id}")
async def delete_spare_part(
    part_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager)
):
    """Delete spare part (soft delete by setting isActive=False)"""
    spare_part = db.query(SparePart).filter(SparePart.id == part_id).first()
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    if not spare_part.isActive:
        raise HTTPException(status_code=400, detail="Spare part is already inactive")
    
    # Store old values for activity log
    old_values = {
        "partNumber": spare_part.partNumber,
        "partName": spare_part.partName,
        "isActive": spare_part.isActive
    }
    
    # Soft delete - set isActive to False
    spare_part.isActive = False
    
    db.commit()
    db.refresh(spare_part)
    
    # Create activity log entry
    from app.services.audit_service import log_activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="DELETE",
        entityType="SPARE_PART",
        entityId=spare_part.id,
        description=f"Spare part '{spare_part.partNumber}' deactivated by {current_user.fullName}",
        oldValues=old_values,
        newValues={"isActive": False},
        request=request
    )
    db.commit()
    
    return {"message": "Spare part deleted successfully"}


from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import Optional
from datetime import datetime
import json
import math
from app.core.database import get_db
from app.core.deps import get_current_user, require_inventory_manager, require_management
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.models.spare_part import SparePart
from app.models.user import User
from app.schemas.inventory_transaction import (
    InventoryTransactionCreate,
    InventoryTransactionUpdate,
    InventoryTransactionResponse,
    InventoryTransactionListResponse
)

router = APIRouter()

@router.get("", response_model=InventoryTransactionListResponse)
async def list_inventory_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    transactionType: Optional[str] = Query(None, description="Filter by transaction type: IN, OUT, ADJUSTMENT, TRANSFER"),
    referenceType: Optional[str] = Query(None, description="Filter by reference type"),
    sparePartId: Optional[int] = Query(None, description="Filter by spare part ID"),
    date_from: Optional[datetime] = Query(None, description="Filter transactions from date"),
    date_to: Optional[datetime] = Query(None, description="Filter transactions to date"),
    performedBy: Optional[int] = Query(None, description="Filter by user who performed transaction"),
    search: Optional[str] = Query(None, description="Search in reference number or notes"),
    sort_by: Optional[str] = Query("transactionDate", description="Sort field: transactionDate, quantity, totalValue"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_management)
):
    """List inventory transactions with pagination and filtering"""
    query = db.query(InventoryTransaction)
    
    # Apply filters
    if transactionType:
        try:
            trans_type = TransactionType(transactionType)
            query = query.filter(InventoryTransaction.transactionType == trans_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid transactionType: {transactionType}")
    
    if referenceType:
        query = query.filter(InventoryTransaction.referenceType == referenceType)
    
    if sparePartId:
        query = query.filter(InventoryTransaction.sparePartId == sparePartId)
    
    if date_from:
        query = query.filter(InventoryTransaction.transactionDate >= date_from)
    
    if date_to:
        query = query.filter(InventoryTransaction.transactionDate <= date_to)
    
    if performedBy:
        query = query.filter(InventoryTransaction.performedById == performedBy)
    
    if search:
        query = query.filter(
            or_(
                InventoryTransaction.referenceNumber.contains(search),
                InventoryTransaction.notes.contains(search)
            )
        )
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    if sort_by == "transactionDate":
        order_column = InventoryTransaction.transactionDate
    elif sort_by == "quantity":
        order_column = InventoryTransaction.quantity
    elif sort_by == "totalValue":
        order_column = InventoryTransaction.totalValue
    else:
        order_column = InventoryTransaction.transactionDate
    
    if sort_order == "asc":
        query = query.order_by(order_column.asc())
    else:
        query = query.order_by(order_column.desc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    transactions = query.offset(offset).limit(page_size).all()
    
    # Build response with related data
    transaction_list = []
    for trans in transactions:
        transaction_list.append(InventoryTransactionResponse(
            id=trans.id,
            sparePartId=trans.sparePartId,
            sparePartNumber=trans.sparePart.partNumber if trans.sparePart else None,
            sparePartName=trans.sparePart.partName if trans.sparePart else None,
            transactionType=trans.transactionType.value,
            quantity=trans.quantity,
            unitPrice=trans.unitPrice,
            totalValue=trans.totalValue,
            referenceType=trans.referenceType,
            referenceNumber=trans.referenceNumber,
            notes=trans.notes,
            transactionDate=trans.transactionDate,
            performedById=trans.performedById,
            performedByName=trans.performedBy.fullName if trans.performedBy else None,
            createdAt=trans.createdAt,
            updatedAt=trans.updatedAt
        ))
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return InventoryTransactionListResponse(
        transactions=transaction_list,
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=total_pages
    )

@router.get("/{transaction_id}", response_model=InventoryTransactionResponse)
async def get_inventory_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_management)
):
    """Get a specific inventory transaction"""
    transaction = db.query(InventoryTransaction).filter(
        InventoryTransaction.id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Inventory transaction not found")
    
    return InventoryTransactionResponse(
        id=transaction.id,
        sparePartId=transaction.sparePartId,
        sparePartNumber=transaction.sparePart.partNumber if transaction.sparePart else None,
        sparePartName=transaction.sparePart.partName if transaction.sparePart else None,
        transactionType=transaction.transactionType.value,
        quantity=transaction.quantity,
        unitPrice=transaction.unitPrice,
        totalValue=transaction.totalValue,
        referenceType=transaction.referenceType,
        referenceNumber=transaction.referenceNumber,
        notes=transaction.notes,
        transactionDate=transaction.transactionDate,
        performedById=transaction.performedById,
        performedByName=transaction.performedBy.fullName if transaction.performedBy else None,
        createdAt=transaction.createdAt,
        updatedAt=transaction.updatedAt
    )

@router.post("", response_model=InventoryTransactionResponse)
async def create_inventory_transaction(
    transaction_data: InventoryTransactionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager)
):
    """Create a new inventory transaction with automatic quantity update"""
    
    # Validate spare part exists
    spare_part = db.query(SparePart).filter(SparePart.id == transaction_data.sparePartId).first()
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    if not spare_part.isActive:
        raise HTTPException(status_code=400, detail="Cannot create transaction for inactive spare part")
    
    # Store before quantity for activity log
    before_quantity = spare_part.currentStock
    
    # Validate stock for OUT transactions
    transaction_type = TransactionType(transaction_data.transactionType)
    if transaction_type == TransactionType.OUT:
        if spare_part.currentStock < transaction_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Current stock: {spare_part.currentStock}, Requested: {transaction_data.quantity}"
            )
    
    # Calculate total value
    total_value = None
    if transaction_data.unitPrice:
        total_value = transaction_data.unitPrice * transaction_data.quantity
    
    # Set transaction date
    transaction_date = transaction_data.transactionDate or datetime.utcnow()
    
    # Calculate new quantity based on transaction type
    if transaction_type == TransactionType.IN:
        after_quantity = spare_part.currentStock + transaction_data.quantity
    elif transaction_type == TransactionType.OUT:
        after_quantity = spare_part.currentStock - transaction_data.quantity
    elif transaction_type == TransactionType.ADJUSTMENT:
        after_quantity = transaction_data.quantity
    elif transaction_type == TransactionType.TRANSFER:
        after_quantity = spare_part.currentStock - transaction_data.quantity
        if after_quantity < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for transfer. Current stock: {spare_part.currentStock}, Requested: {transaction_data.quantity}"
            )
    else:
        after_quantity = spare_part.currentStock
    
    try:
        # Create transaction record
        transaction = InventoryTransaction(
            sparePartId=transaction_data.sparePartId,
            transactionType=transaction_type,
            quantity=transaction_data.quantity,
            unitPrice=transaction_data.unitPrice,
            totalValue=total_value,
            referenceType=transaction_data.referenceType,
            referenceNumber=transaction_data.referenceNumber,
            notes=transaction_data.notes,
            transactionDate=transaction_date,
            performedById=current_user.id
        )
        db.add(transaction)
        
        # Update spare part quantity
        spare_part.currentStock = after_quantity
        db.flush()  # Flush to get transaction ID
        
        # Create activity log
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="CREATE",
            entityType="INVENTORY_TRANSACTION",
            entityId=transaction.id,
            description=f"Transaction {transaction_type.value} of {transaction_data.quantity} units for {spare_part.partNumber} by {current_user.fullName}",
            oldValues={
                "quantity": {"before": before_quantity, "after": after_quantity}
            },
            newValues={
                "transactionType": transaction_type.value,
                "quantity": transaction_data.quantity,
                "unitPrice": transaction_data.unitPrice,
                "totalValue": total_value,
                "referenceType": transaction_data.referenceType,
                "referenceNumber": transaction_data.referenceNumber
            },
            request=request
        )
        
        db.commit()
        db.refresh(transaction)
        
        # Return response with before/after quantities
        return InventoryTransactionResponse(
            id=transaction.id,
            sparePartId=transaction.sparePartId,
            sparePartNumber=spare_part.partNumber,
            sparePartName=spare_part.partName,
            transactionType=transaction.transactionType.value,
            quantity=transaction.quantity,
            unitPrice=transaction.unitPrice,
            totalValue=transaction.totalValue,
            referenceType=transaction.referenceType,
            referenceNumber=transaction.referenceNumber,
            notes=transaction.notes,
            transactionDate=transaction.transactionDate,
            performedById=transaction.performedById,
            performedByName=current_user.fullName,
            beforeQuantity=before_quantity,
            afterQuantity=after_quantity,
            createdAt=transaction.createdAt,
            updatedAt=transaction.updatedAt
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")


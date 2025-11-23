from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import Optional
from datetime import datetime
import json
import math
from app.core.database import get_db
from app.core.deps import get_current_user, require_maintenance_tech, require_maintenance_manager, require_inventory_manager
from app.models.spare_parts_request import SparePartsRequest, SparePartsRequestStatus
from app.models.maintenance_work import MaintenanceWork, WorkStatus
from app.models.spare_part import SparePart
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.models.maintenance_request import MaintenanceRequest, RequestStatus
from app.models.user import User, UserRole
from app.schemas.spare_parts_request import (
    SparePartsRequestCreate,
    SparePartsRequestResponse,
    SparePartsRequestListResponse,
    ApproveRequest,
    RejectRequest
)

router = APIRouter()

@router.get("", response_model=SparePartsRequestListResponse)
async def list_spare_parts_requests(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status: PENDING, APPROVED, REJECTED, ISSUED"),
    maintenanceWorkId: Optional[int] = Query(None, description="Filter by maintenance work ID"),
    sparePartId: Optional[int] = Query(None, description="Filter by spare part ID"),
    requestedBy: Optional[int] = Query(None, description="Filter by requester user ID"),
    isRequestedReturn: Optional[bool] = Query(None, description="Filter by return requested flag"),
    isReturned: Optional[bool] = Query(None, description="Filter by returned flag"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List spare parts requests with pagination and filtering"""
    query = db.query(SparePartsRequest)
    
    # Apply filters
    if status:
        try:
            request_status = SparePartsRequestStatus(status)
            query = query.filter(SparePartsRequest.status == request_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    if maintenanceWorkId:
        query = query.filter(SparePartsRequest.maintenanceWorkId == maintenanceWorkId)
    
    if sparePartId:
        query = query.filter(SparePartsRequest.sparePartId == sparePartId)
    
    if requestedBy:
        query = query.filter(SparePartsRequest.requestedBy == requestedBy)
    
    if isRequestedReturn is not None:
        query = query.filter(SparePartsRequest.isRequestedReturn == isRequestedReturn)
    
    if isReturned is not None:
        query = query.filter(SparePartsRequest.isReturned == isReturned)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    skip = (page - 1) * page_size
    requests = query.order_by(SparePartsRequest.createdAt.desc()).offset(skip).limit(page_size).all()
    
    # Build response with related entity info
    request_responses = []
    for req in requests:
        # Eager load relationships
        maintenance_work = db.query(MaintenanceWork).filter(MaintenanceWork.id == req.maintenanceWorkId).first()
        spare_part = db.query(SparePart).filter(SparePart.id == req.sparePartId).first()
        requested_by_user = db.query(User).filter(User.id == req.requestedBy).first()
        approved_by_user = db.query(User).filter(User.id == req.approvedBy).first() if req.approvedBy else None
        
        request_responses.append(SparePartsRequestResponse(
            id=req.id,
            maintenanceWorkId=req.maintenanceWorkId,
            sparePartId=req.sparePartId,
            quantityRequested=req.quantityRequested,
            status=req.status.value,
            requestedBy=req.requestedBy,
            requestedByName=requested_by_user.fullName if requested_by_user else None,
            approvedBy=req.approvedBy,
            approvedByName=approved_by_user.fullName if approved_by_user else None,
            approvedAt=req.approvedAt,
            rejectionReason=req.rejectionReason,
            approvalNotes=req.approvalNotes,
            isRequestedReturn=req.isRequestedReturn,
            returnDate=req.returnDate,
            isReturned=req.isReturned,
            maintenanceWorkDescription=maintenance_work.workDescription if maintenance_work else None,
            sparePartNumber=spare_part.partNumber if spare_part else None,
            sparePartName=spare_part.partName if spare_part else None,
            currentStock=spare_part.currentStock if spare_part else None,
            createdAt=req.createdAt,
            updatedAt=req.updatedAt
        ))
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return SparePartsRequestListResponse(
        requests=request_responses,
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=total_pages
    )

@router.get("/{request_id}", response_model=SparePartsRequestResponse)
async def get_spare_parts_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single spare parts request by ID"""
    request = db.query(SparePartsRequest).filter(SparePartsRequest.id == request_id).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Spare parts request not found")
    
    # Load related entities
    maintenance_work = db.query(MaintenanceWork).filter(MaintenanceWork.id == request.maintenanceWorkId).first()
    spare_part = db.query(SparePart).filter(SparePart.id == request.sparePartId).first()
    requested_by_user = db.query(User).filter(User.id == request.requestedBy).first()
    approved_by_user = db.query(User).filter(User.id == request.approvedBy).first() if request.approvedBy else None
    
    return SparePartsRequestResponse(
        id=request.id,
        maintenanceWorkId=request.maintenanceWorkId,
        sparePartId=request.sparePartId,
        quantityRequested=request.quantityRequested,
        status=request.status.value,
        requestedBy=request.requestedBy,
        requestedByName=requested_by_user.fullName if requested_by_user else None,
        approvedBy=request.approvedBy,
        approvedByName=approved_by_user.fullName if approved_by_user else None,
        approvedAt=request.approvedAt,
        rejectionReason=request.rejectionReason,
        approvalNotes=request.approvalNotes,
        isRequestedReturn=request.isRequestedReturn,
        returnDate=request.returnDate,
        isReturned=request.isReturned,
        maintenanceWorkDescription=maintenance_work.workDescription if maintenance_work else None,
        sparePartNumber=spare_part.partNumber if spare_part else None,
        sparePartName=spare_part.partName if spare_part else None,
        currentStock=spare_part.currentStock if spare_part else None,
        createdAt=request.createdAt,
        updatedAt=request.updatedAt
    )

@router.post("", response_model=SparePartsRequestResponse)
async def create_spare_parts_request(
    request_data: SparePartsRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_maintenance_tech)
):
    """Create a new spare parts request (technicians only)"""
    
    # Validate maintenance work exists and belongs to current technician
    maintenance_work = db.query(MaintenanceWork).filter(MaintenanceWork.id == request_data.maintenanceWorkId).first()
    if not maintenance_work:
        raise HTTPException(status_code=404, detail="Maintenance work not found")
    
    # Check if maintenance work belongs to current technician (if not admin)
    if current_user.role != UserRole.ADMIN and maintenance_work.assignedToId != current_user.id:
        raise HTTPException(status_code=403, detail="You can only request parts for your assigned maintenance work")
    
    # Validate spare part exists and is active
    spare_part = db.query(SparePart).filter(SparePart.id == request_data.sparePartId).first()
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    if not spare_part.isActive:
        raise HTTPException(status_code=400, detail="Spare part is not active")
    
    try:
        # Create spare parts request
        spare_parts_request = SparePartsRequest(
            maintenanceWorkId=request_data.maintenanceWorkId,
            sparePartId=request_data.sparePartId,
            quantityRequested=request_data.quantityRequested,
            status=SparePartsRequestStatus.PENDING,
            requestedBy=current_user.id
        )
        db.add(spare_parts_request)
        db.flush()
        
        # Update maintenance request status to WAITING_PARTS if work is in progress
        if maintenance_work.status == WorkStatus.IN_PROGRESS:
            maintenance_request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == maintenance_work.requestId).first()
            if maintenance_request and maintenance_request.status == RequestStatus.IN_PROGRESS:
                maintenance_request.status = RequestStatus.WAITING_PARTS
                db.add(maintenance_request)
        
        # Create activity log
        from app.services.audit_service import log_activity
        new_values = {
            "maintenanceWorkId": request_data.maintenanceWorkId,
            "sparePartId": request_data.sparePartId,
            "quantityRequested": request_data.quantityRequested,
            "status": "PENDING"
        }
        log_activity(
            db=db,
            userId=current_user.id,
            action="CREATE",
            entityType="SPARE_PARTS_REQUEST",
            entityId=spare_parts_request.id,
            description=f"Spare parts request created: {request_data.quantityRequested} units of {spare_part.partNumber} by {current_user.fullName}",
            newValues=new_values,
            request=request
        )
        
        db.commit()
        db.refresh(spare_parts_request)
        
        # Load related entities for response
        requested_by_user = db.query(User).filter(User.id == spare_parts_request.requestedBy).first()
        
        return SparePartsRequestResponse(
            id=spare_parts_request.id,
            maintenanceWorkId=spare_parts_request.maintenanceWorkId,
            sparePartId=spare_parts_request.sparePartId,
            quantityRequested=spare_parts_request.quantityRequested,
            status=spare_parts_request.status.value,
            requestedBy=spare_parts_request.requestedBy,
            requestedByName=requested_by_user.fullName if requested_by_user else None,
            approvedBy=spare_parts_request.approvedBy,
            approvedByName=None,
            approvedAt=spare_parts_request.approvedAt,
            rejectionReason=spare_parts_request.rejectionReason,
            approvalNotes=spare_parts_request.approvalNotes,
            isRequestedReturn=spare_parts_request.isRequestedReturn,
            returnDate=spare_parts_request.returnDate,
            isReturned=spare_parts_request.isReturned,
            maintenanceWorkDescription=maintenance_work.workDescription,
            sparePartNumber=spare_part.partNumber,
            sparePartName=spare_part.partName,
            currentStock=spare_part.currentStock,
            createdAt=spare_parts_request.createdAt,
            updatedAt=spare_parts_request.updatedAt
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create request: {str(e)}")

@router.patch("/{request_id}/approve", response_model=SparePartsRequestResponse)
async def approve_request(
    request_id: int,
    approval_data: ApproveRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_maintenance_manager)
):
    """Approve a spare parts request (maintenance managers only)"""
    
    spare_parts_request = db.query(SparePartsRequest).filter(SparePartsRequest.id == request_id).first()
    if not spare_parts_request:
        raise HTTPException(status_code=404, detail="Spare parts request not found")
    
    if spare_parts_request.status != SparePartsRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot approve request with status {spare_parts_request.status.value}")
    
    try:
        old_status = spare_parts_request.status.value
        
        # Update request
        spare_parts_request.status = SparePartsRequestStatus.APPROVED
        spare_parts_request.approvedBy = current_user.id
        spare_parts_request.approvedAt = datetime.utcnow()
        spare_parts_request.approvalNotes = approval_data.approvalNotes
        db.add(spare_parts_request)
        
        # Create activity log
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="APPROVE",
            entityType="SPARE_PARTS_REQUEST",
            entityId=spare_parts_request.id,
            description=f"Spare parts request approved by {current_user.fullName}",
            oldValues={"status": old_status},
            newValues={
                "status": "APPROVED",
                "approvedBy": current_user.id,
                "approvalNotes": approval_data.approvalNotes
            },
            request=request
        )
        
        db.commit()
        db.refresh(spare_parts_request)
        
        # Load related entities for response
        maintenance_work = db.query(MaintenanceWork).filter(MaintenanceWork.id == spare_parts_request.maintenanceWorkId).first()
        spare_part = db.query(SparePart).filter(SparePart.id == spare_parts_request.sparePartId).first()
        requested_by_user = db.query(User).filter(User.id == spare_parts_request.requestedBy).first()
        approved_by_user = db.query(User).filter(User.id == spare_parts_request.approvedBy).first()
        
        return SparePartsRequestResponse(
            id=spare_parts_request.id,
            maintenanceWorkId=spare_parts_request.maintenanceWorkId,
            sparePartId=spare_parts_request.sparePartId,
            quantityRequested=spare_parts_request.quantityRequested,
            status=spare_parts_request.status.value,
            requestedBy=spare_parts_request.requestedBy,
            requestedByName=requested_by_user.fullName if requested_by_user else None,
            approvedBy=spare_parts_request.approvedBy,
            approvedByName=approved_by_user.fullName if approved_by_user else None,
            approvedAt=spare_parts_request.approvedAt,
            rejectionReason=spare_parts_request.rejectionReason,
            approvalNotes=spare_parts_request.approvalNotes,
            isRequestedReturn=spare_parts_request.isRequestedReturn,
            returnDate=spare_parts_request.returnDate,
            isReturned=spare_parts_request.isReturned,
            maintenanceWorkDescription=maintenance_work.workDescription if maintenance_work else None,
            sparePartNumber=spare_part.partNumber if spare_part else None,
            sparePartName=spare_part.partName if spare_part else None,
            currentStock=spare_part.currentStock if spare_part else None,
            createdAt=spare_parts_request.createdAt,
            updatedAt=spare_parts_request.updatedAt
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to approve request: {str(e)}")

@router.patch("/{request_id}/reject", response_model=SparePartsRequestResponse)
async def reject_request(
    request_id: int,
    rejection_data: RejectRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_maintenance_manager)
):
    """Reject a spare parts request (maintenance managers only)"""
    
    spare_parts_request = db.query(SparePartsRequest).filter(SparePartsRequest.id == request_id).first()
    if not spare_parts_request:
        raise HTTPException(status_code=404, detail="Spare parts request not found")
    
    if spare_parts_request.status != SparePartsRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot reject request with status {spare_parts_request.status.value}")
    
    try:
        old_status = spare_parts_request.status.value
        
        # Update request
        spare_parts_request.status = SparePartsRequestStatus.REJECTED
        spare_parts_request.approvedBy = current_user.id
        spare_parts_request.approvedAt = datetime.utcnow()
        spare_parts_request.rejectionReason = rejection_data.rejectionReason
        db.add(spare_parts_request)
        
        # Revert maintenance request status if it was WAITING_PARTS
        maintenance_work = db.query(MaintenanceWork).filter(MaintenanceWork.id == spare_parts_request.maintenanceWorkId).first()
        if maintenance_work and maintenance_work.status == WorkStatus.IN_PROGRESS:
            maintenance_request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == maintenance_work.requestId).first()
            if maintenance_request and maintenance_request.status == RequestStatus.WAITING_PARTS:
                maintenance_request.status = RequestStatus.IN_PROGRESS
                db.add(maintenance_request)
        
        # Create activity log
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="REJECT",
            entityType="SPARE_PARTS_REQUEST",
            entityId=spare_parts_request.id,
            description=f"Spare parts request rejected by {current_user.fullName}: {rejection_data.rejectionReason}",
            oldValues={"status": old_status},
            newValues={
                "status": "REJECTED",
                "approvedBy": current_user.id,
                "rejectionReason": rejection_data.rejectionReason
            },
            request=request
        )
        
        db.commit()
        db.refresh(spare_parts_request)
        
        # Load related entities for response
        spare_part = db.query(SparePart).filter(SparePart.id == spare_parts_request.sparePartId).first()
        requested_by_user = db.query(User).filter(User.id == spare_parts_request.requestedBy).first()
        approved_by_user = db.query(User).filter(User.id == spare_parts_request.approvedBy).first()
        
        return SparePartsRequestResponse(
            id=spare_parts_request.id,
            maintenanceWorkId=spare_parts_request.maintenanceWorkId,
            sparePartId=spare_parts_request.sparePartId,
            quantityRequested=spare_parts_request.quantityRequested,
            status=spare_parts_request.status.value,
            requestedBy=spare_parts_request.requestedBy,
            requestedByName=requested_by_user.fullName if requested_by_user else None,
            approvedBy=spare_parts_request.approvedBy,
            approvedByName=approved_by_user.fullName if approved_by_user else None,
            approvedAt=spare_parts_request.approvedAt,
            rejectionReason=spare_parts_request.rejectionReason,
            approvalNotes=spare_parts_request.approvalNotes,
            isRequestedReturn=spare_parts_request.isRequestedReturn,
            returnDate=spare_parts_request.returnDate,
            isReturned=spare_parts_request.isReturned,
            maintenanceWorkDescription=maintenance_work.workDescription if maintenance_work else None,
            sparePartNumber=spare_part.partNumber if spare_part else None,
            sparePartName=spare_part.partName if spare_part else None,
            currentStock=spare_part.currentStock if spare_part else None,
            createdAt=spare_parts_request.createdAt,
            updatedAt=spare_parts_request.updatedAt
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reject request: {str(e)}")

@router.patch("/{request_id}/issue", response_model=SparePartsRequestResponse)
async def issue_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager)
):
    """Issue approved spare parts (inventory managers only)"""
    
    spare_parts_request = db.query(SparePartsRequest).filter(SparePartsRequest.id == request_id).first()
    if not spare_parts_request:
        raise HTTPException(status_code=404, detail="Spare parts request not found")
    
    if spare_parts_request.status != SparePartsRequestStatus.APPROVED:
        raise HTTPException(status_code=400, detail=f"Cannot issue request with status {spare_parts_request.status.value}")
    
    # Load spare part
    spare_part = db.query(SparePart).filter(SparePart.id == spare_parts_request.sparePartId).first()
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Validate sufficient stock
    if spare_part.currentStock < spare_parts_request.quantityRequested:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient stock. Available: {spare_part.currentStock}, Requested: {spare_parts_request.quantityRequested}"
        )
    
    try:
        old_status = spare_parts_request.status.value
        before_quantity = spare_part.currentStock
        after_quantity = before_quantity - spare_parts_request.quantityRequested
        unit_price = spare_part.unitPrice or 0.0
        total_value = unit_price * spare_parts_request.quantityRequested
        
        # Load maintenance work for reference
        maintenance_work = db.query(MaintenanceWork).filter(MaintenanceWork.id == spare_parts_request.maintenanceWorkId).first()
        maintenance_request = None
        if maintenance_work:
            maintenance_request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == maintenance_work.requestId).first()
        
        # Update request status
        spare_parts_request.status = SparePartsRequestStatus.ISSUED
        db.add(spare_parts_request)
        db.flush()
        
        # Create inventory transaction
        transaction = InventoryTransaction(
            sparePartId=spare_parts_request.sparePartId,
            transactionType=TransactionType.OUT,
            quantity=spare_parts_request.quantityRequested,
            unitPrice=unit_price,
            totalValue=total_value,
            referenceType="MAINTENANCE",
            referenceNumber=f"SPR-{spare_parts_request.id}",
            notes=f"Issued for maintenance work {spare_parts_request.maintenanceWorkId}",
            transactionDate=datetime.utcnow(),
            performedById=current_user.id
        )
        db.add(transaction)
        db.flush()
        
        # Update spare part quantity
        spare_part.currentStock = after_quantity
        db.add(spare_part)
        
        # Update maintenance request status back to IN_PROGRESS
        if maintenance_request and maintenance_request.status == RequestStatus.WAITING_PARTS:
            maintenance_request.status = RequestStatus.IN_PROGRESS
            db.add(maintenance_request)
        
        # Create activity log
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="ISSUE",
            entityType="SPARE_PARTS_REQUEST",
            entityId=spare_parts_request.id,
            description=f"Spare parts issued: {spare_parts_request.quantityRequested} units of {spare_part.partNumber} by {current_user.fullName}",
            oldValues={
                "status": old_status,
                "stock": {"before": before_quantity, "after": after_quantity}
            },
            newValues={
                "status": "ISSUED",
                "transactionId": transaction.id,
                "quantityIssued": spare_parts_request.quantityRequested
            },
            request=request
        )
        
        db.commit()
        db.refresh(spare_parts_request)
        
        # Load related entities for response
        requested_by_user = db.query(User).filter(User.id == spare_parts_request.requestedBy).first()
        approved_by_user = db.query(User).filter(User.id == spare_parts_request.approvedBy).first() if spare_parts_request.approvedBy else None
        
        return SparePartsRequestResponse(
            id=spare_parts_request.id,
            maintenanceWorkId=spare_parts_request.maintenanceWorkId,
            sparePartId=spare_parts_request.sparePartId,
            quantityRequested=spare_parts_request.quantityRequested,
            status=spare_parts_request.status.value,
            requestedBy=spare_parts_request.requestedBy,
            requestedByName=requested_by_user.fullName if requested_by_user else None,
            approvedBy=spare_parts_request.approvedBy,
            approvedByName=approved_by_user.fullName if approved_by_user else None,
            approvedAt=spare_parts_request.approvedAt,
            rejectionReason=spare_parts_request.rejectionReason,
            approvalNotes=spare_parts_request.approvalNotes,
            isRequestedReturn=spare_parts_request.isRequestedReturn,
            returnDate=spare_parts_request.returnDate,
            isReturned=spare_parts_request.isReturned,
            maintenanceWorkDescription=maintenance_work.workDescription if maintenance_work else None,
            sparePartNumber=spare_part.partNumber,
            sparePartName=spare_part.partName,
            currentStock=spare_part.currentStock,
            createdAt=spare_parts_request.createdAt,
            updatedAt=spare_parts_request.updatedAt
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to issue request: {str(e)}")

@router.post("/{request_id}/return-request", response_model=SparePartsRequestResponse)
async def request_return(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_maintenance_tech)
):
    """Request to return issued spare parts (technicians only)"""
    
    spare_parts_request = db.query(SparePartsRequest).filter(SparePartsRequest.id == request_id).first()
    if not spare_parts_request:
        raise HTTPException(status_code=404, detail="Spare parts request not found")
    
    # Validate request status is ISSUED
    if spare_parts_request.status != SparePartsRequestStatus.ISSUED:
        raise HTTPException(status_code=400, detail=f"Cannot request return for request with status {spare_parts_request.status.value}")
    
    # Validate return flags
    if spare_parts_request.isRequestedReturn:
        raise HTTPException(status_code=400, detail="Return has already been requested for this request")
    
    if spare_parts_request.isReturned:
        raise HTTPException(status_code=400, detail="Parts have already been returned")
    
    # Check if maintenance work belongs to current technician (if not admin)
    maintenance_work = db.query(MaintenanceWork).filter(MaintenanceWork.id == spare_parts_request.maintenanceWorkId).first()
    if not maintenance_work:
        raise HTTPException(status_code=404, detail="Maintenance work not found")
    
    if current_user.role != UserRole.ADMIN and maintenance_work.assignedToId != current_user.id:
        raise HTTPException(status_code=403, detail="You can only request return for parts issued to your assigned maintenance work")
    
    try:
        # Update request - set isRequestedReturn to True
        spare_parts_request.isRequestedReturn = True
        # Status remains unchanged (stays as ISSUED)
        db.add(spare_parts_request)
        
        # Create activity log
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="RETURN_REQUEST",
            entityType="SPARE_PARTS_REQUEST",
            entityId=spare_parts_request.id,
            description=f"Return requested for spare parts request {spare_parts_request.id} by {current_user.fullName}",
            oldValues={"isRequestedReturn": False},
            newValues={"isRequestedReturn": True},
            request=request
        )
        
        db.commit()
        db.refresh(spare_parts_request)
        
        # Load related entities for response
        spare_part = db.query(SparePart).filter(SparePart.id == spare_parts_request.sparePartId).first()
        requested_by_user = db.query(User).filter(User.id == spare_parts_request.requestedBy).first()
        approved_by_user = db.query(User).filter(User.id == spare_parts_request.approvedBy).first() if spare_parts_request.approvedBy else None
        
        return SparePartsRequestResponse(
            id=spare_parts_request.id,
            maintenanceWorkId=spare_parts_request.maintenanceWorkId,
            sparePartId=spare_parts_request.sparePartId,
            quantityRequested=spare_parts_request.quantityRequested,
            status=spare_parts_request.status.value,
            requestedBy=spare_parts_request.requestedBy,
            requestedByName=requested_by_user.fullName if requested_by_user else None,
            approvedBy=spare_parts_request.approvedBy,
            approvedByName=approved_by_user.fullName if approved_by_user else None,
            approvedAt=spare_parts_request.approvedAt,
            rejectionReason=spare_parts_request.rejectionReason,
            approvalNotes=spare_parts_request.approvalNotes,
            isRequestedReturn=spare_parts_request.isRequestedReturn,
            returnDate=spare_parts_request.returnDate,
            isReturned=spare_parts_request.isReturned,
            maintenanceWorkDescription=maintenance_work.workDescription if maintenance_work else None,
            sparePartNumber=spare_part.partNumber if spare_part else None,
            sparePartName=spare_part.partName if spare_part else None,
            currentStock=spare_part.currentStock if spare_part else None,
            createdAt=spare_parts_request.createdAt,
            updatedAt=spare_parts_request.updatedAt
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to request return: {str(e)}")

@router.patch("/{request_id}/process-return", response_model=SparePartsRequestResponse)
async def process_return(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager)
):
    """Process return of spare parts (inventory managers only)"""
    
    spare_parts_request = db.query(SparePartsRequest).filter(SparePartsRequest.id == request_id).first()
    if not spare_parts_request:
        raise HTTPException(status_code=404, detail="Spare parts request not found")
    
    # Validate return flags
    if not spare_parts_request.isRequestedReturn:
        raise HTTPException(status_code=400, detail="Return must be requested first before processing")
    
    if spare_parts_request.isReturned:
        raise HTTPException(status_code=400, detail="Parts have already been returned")
    
    # Load spare part
    spare_part = db.query(SparePart).filter(SparePart.id == spare_parts_request.sparePartId).first()
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Load maintenance work for reference
    maintenance_work = db.query(MaintenanceWork).filter(MaintenanceWork.id == spare_parts_request.maintenanceWorkId).first()
    
    try:
        before_quantity = spare_part.currentStock
        after_quantity = before_quantity + spare_parts_request.quantityRequested
        unit_price = spare_part.unitPrice or 0.0
        total_value = unit_price * spare_parts_request.quantityRequested
        
        # Create IN inventory transaction to restore stock
        transaction = InventoryTransaction(
            sparePartId=spare_parts_request.sparePartId,
            transactionType=TransactionType.IN,
            quantity=spare_parts_request.quantityRequested,
            unitPrice=unit_price,
            totalValue=total_value,
            referenceType="RETURN",
            referenceNumber=f"SPR-RET-{spare_parts_request.id}",
            notes=f"دخول مرتجع - طلب قطع غيار رقم {spare_parts_request.id}",
            transactionDate=datetime.utcnow(),
            performedById=current_user.id
        )
        db.add(transaction)
        db.flush()
        
        # Update spare part quantity
        spare_part.currentStock = after_quantity
        db.add(spare_part)
        
        # Update request - set isReturned to True and returnDate
        spare_parts_request.isReturned = True
        spare_parts_request.returnDate = datetime.utcnow()
        # Status remains unchanged (stays as original status, e.g., ISSUED)
        db.add(spare_parts_request)
        
        # Create activity log
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="PROCESS_RETURN",
            entityType="SPARE_PARTS_REQUEST",
            entityId=spare_parts_request.id,
            description=f"Return processed: {spare_parts_request.quantityRequested} units of {spare_part.partNumber} returned to inventory by {current_user.fullName}",
            oldValues={
                "isReturned": False,
                "stock": {"before": before_quantity, "after": after_quantity}
            },
            newValues={
                "isReturned": True,
                "returnDate": spare_parts_request.returnDate.isoformat(),
                "transactionId": transaction.id,
                "quantityReturned": spare_parts_request.quantityRequested
            },
            request=request
        )
        
        db.commit()
        db.refresh(spare_parts_request)
        
        # Load related entities for response
        requested_by_user = db.query(User).filter(User.id == spare_parts_request.requestedBy).first()
        approved_by_user = db.query(User).filter(User.id == spare_parts_request.approvedBy).first() if spare_parts_request.approvedBy else None
        
        return SparePartsRequestResponse(
            id=spare_parts_request.id,
            maintenanceWorkId=spare_parts_request.maintenanceWorkId,
            sparePartId=spare_parts_request.sparePartId,
            quantityRequested=spare_parts_request.quantityRequested,
            status=spare_parts_request.status.value,
            requestedBy=spare_parts_request.requestedBy,
            requestedByName=requested_by_user.fullName if requested_by_user else None,
            approvedBy=spare_parts_request.approvedBy,
            approvedByName=approved_by_user.fullName if approved_by_user else None,
            approvedAt=spare_parts_request.approvedAt,
            rejectionReason=spare_parts_request.rejectionReason,
            approvalNotes=spare_parts_request.approvalNotes,
            isRequestedReturn=spare_parts_request.isRequestedReturn,
            returnDate=spare_parts_request.returnDate,
            isReturned=spare_parts_request.isReturned,
            maintenanceWorkDescription=maintenance_work.workDescription if maintenance_work else None,
            sparePartNumber=spare_part.partNumber,
            sparePartName=spare_part.partName,
            currentStock=spare_part.currentStock,
            createdAt=spare_parts_request.createdAt,
            updatedAt=spare_parts_request.updatedAt
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process return: {str(e)}")


from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
from app.core.database import get_db
from app.core.deps import get_current_user, require_role_list
from app.models.maintenance_request import MaintenanceRequest, RequestStatus, RequestPriority
from app.models.machine import Machine, MachineStatus
from app.models.user import User, UserRole
from app.models.attachment import Attachment
from app.schemas.maintenance_request import (
    MaintenanceRequestCreate, 
    MaintenanceRequestUpdate, 
    MaintenanceRequestResponse,
    MaintenanceRequestListResponse,
    MaintenanceRequestFilters
)
from app.schemas.attachment import AttachmentResponse
import uuid
import shutil

router = APIRouter()

def _build_request_response(db: Session, request: MaintenanceRequest) -> MaintenanceRequestResponse:
    """Serialize MaintenanceRequest with attachments and requester name."""
    attachments = db.query(Attachment).filter(
        Attachment.entityType == "MAINTENANCE_REQUEST",
        Attachment.entityId == request.id
    ).all()

    requested_by_name = None
    if getattr(request, "requestedBy", None):
        requested_by_name = request.requestedBy.fullName
    else:
        # Ensure relationship is loaded if not already
        user = db.query(User).filter(User.id == request.requestedById).first()
        if user:
            requested_by_name = user.fullName

    request_dict = {
        "id": request.id,
        "title": request.title,
        "description": request.description,
        "priority": request.priority,
        "status": request.status,
        "requestedDate": request.requestedDate,
        "expectedCompletionDate": request.expectedCompletionDate,
        "actualCompletionDate": request.actualCompletionDate,
        "machineId": request.machineId,
        "requestedById": request.requestedById,
        "requestedByName": requested_by_name,
        "failureCodeId": request.failureCodeId,
        "maintenanceTypeId": request.maintenanceTypeId,
        "createdAt": request.createdAt,
        "updatedAt": request.updatedAt,
        "attachments": [AttachmentResponse.model_validate(att) for att in attachments] if attachments else []
    }

    return MaintenanceRequestResponse(**request_dict)

@router.get("/health")
async def health_check():
    """Health check for maintenance requests router"""
    return {"status": "ok", "router": "maintenance-requests"}

@router.get("", response_model=MaintenanceRequestListResponse)
async def get_maintenance_requests(
    status: Optional[RequestStatus] = None,
    priority: Optional[RequestPriority] = None,
    machineId: Optional[int] = None,
    requestedById: Optional[int] = None,
    startDate: Optional[datetime] = None,
    endDate: Optional[datetime] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_MANAGER", "ADMIN", "MAINTENANCE_TECH"]))
):
    """Get maintenance requests with filtering and pagination"""
    # Build query
    query = db.query(MaintenanceRequest)
    
    # Apply filters
    if status:
        query = query.filter(MaintenanceRequest.status == status)
    if priority:
        query = query.filter(MaintenanceRequest.priority == priority)
    if machineId:
        query = query.filter(MaintenanceRequest.machineId == machineId)
    if requestedById:
        query = query.filter(MaintenanceRequest.requestedById == requestedById)
    if startDate:
        query = query.filter(MaintenanceRequest.requestedDate >= startDate)
    if endDate:
        query = query.filter(MaintenanceRequest.requestedDate <= endDate)
    if search:
        query = query.filter(
            MaintenanceRequest.title.contains(search) | 
            MaintenanceRequest.description.contains(search)
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    requests = query.order_by(MaintenanceRequest.requestedDate.desc()).offset(offset).limit(limit).all()
    
    # Fetch attachments for each request
    from app.models.attachment import Attachment
    for request in requests:
        attachments = db.query(Attachment).filter(
            Attachment.entityType == "MAINTENANCE_REQUEST",
            Attachment.entityId == request.id
        ).all()
        request.attachments = attachments
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit
    
    return MaintenanceRequestListResponse(
        requests=requests,
        total=total,
        page=page,
        pageSize=limit,
        totalPages=total_pages
    )

def ensure_upload_dir():
    """Ensure upload directory exists"""
    upload_dir = "./uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    return upload_dir

@router.post("", response_model=MaintenanceRequestResponse)
async def create_maintenance_request(
    request: MaintenanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["SUPERVISOR", "ADMIN", "MAINTENANCE_MANAGER", "MAINTENANCE_TECH"]))
):
    """Create a new maintenance request"""
    print(f"Received request data: {request.dict()}")
    print(f"Machine ID: {request.machineId}")
    print(f"Current user ID: {current_user.id}")
    
    # Verify machine exists
    machine = db.query(Machine).filter(Machine.id == request.machineId).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Optionally update machine status if provided
    if request.machineStatus is not None:
        # Ensure the provided status is a valid MachineStatus enum
        try:
            new_status = (
                request.machineStatus
                if isinstance(request.machineStatus, MachineStatus)
                else MachineStatus(request.machineStatus)
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid machine status: {request.machineStatus}"
            )

        if machine.status != new_status:
            machine.status = new_status

    # Create maintenance request
    maintenance_request = MaintenanceRequest(
        title=request.title,
        description=request.description,
        priority=request.priority,
        status=RequestStatus.PENDING,
        requestedDate=datetime.utcnow(),
        expectedCompletionDate=request.expectedCompletionDate,
        machineId=request.machineId,
        requestedById=current_user.id,
        failureCodeId=request.failureCodeId,
        maintenanceTypeId=request.maintenanceTypeId
    )
    
    db.add(maintenance_request)
    db.commit()
    db.refresh(maintenance_request)
    maintenance_request.requestedBy = current_user
    
    return _build_request_response(db, maintenance_request)

# Technician-specific endpoints (must be before /{request_id} to avoid route conflicts)
@router.get("/available", response_model=MaintenanceRequestListResponse)
async def get_available_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    machineId: Optional[int] = Query(None, description="Filter by machine ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(25, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_TECH", "MAINTENANCE_MANAGER", "ADMIN"]))
):
    """Get available maintenance requests (PENDING status with no MaintenanceWork record)"""
    from app.models.maintenance_work import MaintenanceWork
    
    # Parse status enum from string
    filter_status = RequestStatus.PENDING
    if status:
        try:
            filter_status = RequestStatus(status.upper())
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}. Valid values: {[s.value for s in RequestStatus]}")
    
    # Parse priority enum from string
    filter_priority = None
    if priority:
        try:
            filter_priority = RequestPriority(priority.upper())
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail=f"Invalid priority: {priority}. Valid values: {[p.value for p in RequestPriority]}")
    
    query = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status == filter_status
    )
    
    # Apply additional filters
    if filter_priority:
        query = query.filter(MaintenanceRequest.priority == filter_priority)
    if machineId:
        query = query.filter(MaintenanceRequest.machineId == machineId)
    
    # Filter out requests that already have a MaintenanceWork record
    requests_with_work = db.query(MaintenanceWork.requestId).distinct()
    query = query.filter(~MaintenanceRequest.id.in_(requests_with_work))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    requests = query.order_by(MaintenanceRequest.requestedDate.desc()).offset(offset).limit(limit).all()
    
    # Fetch attachments and requester name for each request
    request_list = [_build_request_response(db, request) for request in requests]
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit
    
    return MaintenanceRequestListResponse(
        requests=request_list,
        total=total,
        page=page,
        pageSize=limit,
        totalPages=total_pages
    )

@router.get("/my-work", response_model=MaintenanceRequestListResponse)
async def get_my_work_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(25, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_TECH", "MAINTENANCE_MANAGER", "ADMIN"]))
):
    """Get maintenance requests assigned to current technician (IN_PROGRESS and WAITING_PARTS with their MaintenanceWork)"""
    from app.models.maintenance_work import MaintenanceWork
    
    # Parse status enum from string - default to showing both IN_PROGRESS and WAITING_PARTS
    filter_statuses = [RequestStatus.IN_PROGRESS, RequestStatus.WAITING_PARTS]
    if status:
        try:
            filter_statuses = [RequestStatus(status.upper())]
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}. Valid values: {[s.value for s in RequestStatus]}")
    
    # Parse priority enum from string
    filter_priority = None
    if priority:
        try:
            filter_priority = RequestPriority(priority.upper())
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail=f"Invalid priority: {priority}. Valid values: {[p.value for p in RequestPriority]}")
    
    # Get requests where current user has a MaintenanceWork record
    # For maintenance managers, show all work; for technicians, show only their own
    query = db.query(MaintenanceRequest).join(
        MaintenanceWork,
        MaintenanceRequest.id == MaintenanceWork.requestId
    ).filter(
        MaintenanceRequest.status.in_(filter_statuses)
    )
    
    # Filter by assigned technician only for technicians, not managers
    if current_user.role == UserRole.MAINTENANCE_TECH:
        query = query.filter(MaintenanceWork.assignedToId == current_user.id)
    
    # Apply additional filters
    if filter_priority:
        query = query.filter(MaintenanceRequest.priority == filter_priority)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    requests = query.order_by(MaintenanceRequest.requestedDate.desc()).offset(offset).limit(limit).all()
    
    # Fetch attachments and requester name for each request
    request_list = [_build_request_response(db, request) for request in requests]
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit
    
    return MaintenanceRequestListResponse(
        requests=request_list,
        total=total,
        page=page,
        pageSize=limit,
        totalPages=total_pages
    )

@router.post("/{request_id}/accept", response_model=MaintenanceRequestResponse)
async def accept_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_TECH", "ADMIN"]))
):
    """Accept a maintenance request (creates MaintenanceWork and updates status to IN_PROGRESS)"""
    from app.models.maintenance_work import MaintenanceWork, WorkStatus
    from sqlalchemy.exc import IntegrityError
    
    # Get the maintenance request
    maintenance_request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    
    if not maintenance_request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    # Check if request is PENDING
    if maintenance_request.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot accept request with status {maintenance_request.status}. Only PENDING requests can be accepted."
        )
    
    # Check if request already has a MaintenanceWork record
    existing_work = db.query(MaintenanceWork).filter(
        MaintenanceWork.requestId == request_id
    ).first()
    
    if existing_work:
        raise HTTPException(
            status_code=400,
            detail="Request already has an assigned technician"
        )
    
    # Create MaintenanceWork record with database transaction
    try:
        # startTime is automatically recorded when technician accepts the request
        maintenance_work = MaintenanceWork(
            requestId=request_id,
            assignedToId=current_user.id,
            machineId=maintenance_request.machineId,
            workDescription=f"Maintenance work started for request #{request_id}",
            status=WorkStatus.IN_PROGRESS,
            startTime=datetime.utcnow()  # Automatically set when request is accepted
        )
        
        db.add(maintenance_work)
        
        # Update request status to IN_PROGRESS
        maintenance_request.status = RequestStatus.IN_PROGRESS
        
        # Create activity log entry
        from app.services.audit_service import log_activity
        log_activity(
            db=db,
            userId=current_user.id,
            action="CREATE",  # Use CREATE for acceptance (creates MaintenanceWork)
            entityType="MAINTENANCE_REQUEST",
            entityId=request_id,
            description=f"Request accepted by technician {current_user.fullName}",
            request=request
        )
        
        db.commit()
        db.refresh(maintenance_request)
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Request was accepted by another technician. Please refresh and try again."
        )
    
    return _build_request_response(db, maintenance_request)

@router.get("/{request_id}", response_model=MaintenanceRequestResponse)
async def get_maintenance_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific maintenance request"""
    maintenance_request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    
    if not maintenance_request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    return _build_request_response(db, maintenance_request)

@router.patch("/{request_id}", response_model=MaintenanceRequestResponse)
async def update_maintenance_request(
    request_id: int,
    request_data: MaintenanceRequestUpdate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["SUPERVISOR", "ADMIN", "MAINTENANCE_MANAGER", "MAINTENANCE_TECH"]))
):
    """Update a maintenance request"""
    maintenance_request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    
    if not maintenance_request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    # Track status changes
    old_status = maintenance_request.status
    
    # Update fields
    if request_data.title is not None:
        maintenance_request.title = request_data.title
    if request_data.description is not None:
        maintenance_request.description = request_data.description
    if request_data.priority is not None:
        maintenance_request.priority = request_data.priority
    if request_data.status is not None:
        maintenance_request.status = request_data.status
    if request_data.failureCodeId is not None:
        maintenance_request.failureCodeId = request_data.failureCodeId
    if request_data.maintenanceTypeId is not None:
        maintenance_request.maintenanceTypeId = request_data.maintenanceTypeId
    if request_data.expectedCompletionDate is not None:
        maintenance_request.expectedCompletionDate = request_data.expectedCompletionDate
    if request_data.actualCompletionDate is not None:
        maintenance_request.actualCompletionDate = request_data.actualCompletionDate
    
    # Log status change if status was updated
    if request_data.status is not None and old_status != request_data.status:
        # Create activity log entry for status change
        from app.services.audit_service import log_activity
        old_values = {"status": old_status.value if hasattr(old_status, 'value') else str(old_status)}
        new_values = {"status": request_data.status.value if hasattr(request_data.status, 'value') else str(request_data.status)}
        log_activity(
            db=db,
            userId=current_user.id,
            action="UPDATE",
            entityType="MAINTENANCE_REQUEST",
            entityId=request_id,
            description=f"Status changed from {old_status} to {request_data.status}",
            oldValues=old_values,
            newValues=new_values,
            request=http_request
        )
    
    db.commit()
    db.refresh(maintenance_request)
    
    return _build_request_response(db, maintenance_request)

@router.patch("/{request_id}/status", response_model=MaintenanceRequestResponse)
async def update_request_status(
    request_id: int,
    status: RequestStatus,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_MANAGER", "ADMIN", "MAINTENANCE_TECH"]))
):
    """Update maintenance request status with tracking"""
    maintenance_request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    
    if not maintenance_request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    old_status = maintenance_request.status
    maintenance_request.status = status
    
    # Create activity log entry for status change
    from app.services.audit_service import log_activity
    old_values = {"status": old_status.value if hasattr(old_status, 'value') else str(old_status)}
    new_values = {"status": status.value if hasattr(status, 'value') else str(status)}
    log_activity(
        db=db,
        userId=current_user.id,
        action="UPDATE",
        entityType="MAINTENANCE_REQUEST",
        entityId=request_id,
        description=f"Status changed from {old_status} to {status}",
        oldValues=old_values,
        newValues=new_values,
        request=request
    )
    
    db.commit()
    db.refresh(maintenance_request)
    
    return _build_request_response(db, maintenance_request)

@router.post("/{request_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    request_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["SUPERVISOR", "ADMIN", "MAINTENANCE_MANAGER"]))
):
    """Upload an attachment for a maintenance request"""
    # Verify request exists
    maintenance_request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    
    if not maintenance_request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    # Ensure upload directory exists
    upload_dir = ensure_upload_dir()
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create attachment record
    attachment = Attachment(
        fileName=unique_filename,
        originalFileName=file.filename,
        filePath=file_path,
        fileSize=os.path.getsize(file_path),
        mimeType=file.content_type or "application/octet-stream",
        description=description,
        entityType="MAINTENANCE_REQUEST",
        entityId=request_id,
        uploadedById=current_user.id
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment


@router.get("/attachments/{attachment_id}/file")
async def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """Download a file attachment"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    file_path = attachment.filePath
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(
        path=file_path,
        filename=attachment.originalFileName,
        media_type=attachment.mimeType
    )

@router.get("/attachments/{attachment_id}/view")
async def view_attachment(
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """View a file attachment in browser"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    file_path = attachment.filePath
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(
        path=file_path,
        media_type=attachment.mimeType,
        headers={"Content-Disposition": f"inline; filename={attachment.originalFileName}"}
    )
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_role_list
from app.models.machine import Machine, MachineStatus
from app.models.department import Department
from app.models.user import User
from app.models.maintenance_request import MaintenanceRequest, RequestStatus
from app.models.machine_spare_part import MachineSparePart
from app.models.attachment import Attachment
from app.models.spare_part import SparePart
from app.schemas.machine import (
    MachineCreate, 
    MachineUpdate, 
    MachineResponse, 
    MachineListResponse,
    MachineStatusSummaryResponse,
    QRCodeResponse,
    MachineDetailResponse,
    DepartmentBasicInfo,
    MaintenanceRequestBasicInfo,
    MachineSparePartInfo,
    AttachmentBasicInfo
)
from app.services.qr_code_service import QRCodeService
import math
import logging

router = APIRouter()

@router.get("", response_model=MachineListResponse)
async def list_machines(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    status: Optional[MachineStatus] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["ADMIN", "MAINTENANCE_MANAGER"]))
):
    """List machines with pagination and filtering"""
    query = db.query(Machine)
    
    # Apply filters
    if search:
        query = query.filter(
            Machine.name.contains(search) |
            Machine.model.contains(search) |
            Machine.serialNumber.contains(search)
        )
    
    if department_id:
        query = query.filter(Machine.departmentId == department_id)
    
    if status:
        query = query.filter(Machine.status == status)
    
    if location:
        query = query.filter(Machine.location.contains(location))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    machines = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    machine_responses = [MachineResponse.model_validate(machine) for machine in machines]
    
    return MachineListResponse(
        machines=machine_responses,
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=math.ceil(total / page_size)
    )

@router.get("/status-summary", response_model=MachineStatusSummaryResponse)
async def get_machine_status_summary(
    status: Optional[List[MachineStatus]] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["ADMIN", "MAINTENANCE_MANAGER", "SUPERVISOR"]))
):
    """Return counts of machines grouped by status."""
    query = db.query(Machine.status, func.count(Machine.id)).group_by(Machine.status)

    if status:
        query = query.filter(Machine.status.in_(status))

    results = query.all()

    counts: dict[str, int] = {}
    for machine_status, count in results:
        status_key = machine_status.value if isinstance(machine_status, MachineStatus) else str(machine_status)
        counts[status_key] = count

    if status:
        for requested_status in status:
            counts.setdefault(requested_status.value, 0)
    else:
        for machine_status in MachineStatus:
            counts.setdefault(machine_status.value, 0)

    total = sum(counts.values())

    return MachineStatusSummaryResponse(counts=counts, total=total)

@router.post("", response_model=MachineResponse)
async def create_machine(
    machine_data: MachineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new machine"""
    # Validate department exists
    department = db.query(Department).filter(Department.id == machine_data.departmentId).first()
    if not department:
        raise HTTPException(status_code=400, detail="Department not found")
    
    # Validate serial number is unique if provided
    if machine_data.serialNumber:
        existing_machine = db.query(Machine).filter(Machine.serialNumber == machine_data.serialNumber).first()
        if existing_machine:
            raise HTTPException(status_code=400, detail="A machine with this serial number already exists. Please use a different serial number.")
    
    # Use provided QR code or generate unique one
    if machine_data.qrCode:
        # Validate that the provided QR code is unique
        if not QRCodeService.validate_qr_code_uniqueness(db, machine_data.qrCode, None):
            raise HTTPException(status_code=400, detail="QR code already exists. Please use a different QR code.")
        qr_code = machine_data.qrCode
    else:
        # Generate unique QR code
        qr_code = QRCodeService.generate_qr_code_for_machine(db, None)
    
    # Create machine
    machine = Machine(
        qrCode=qr_code,
        name=machine_data.name,
        model=machine_data.model,
        serialNumber=machine_data.serialNumber,
        departmentId=machine_data.departmentId,
        location=machine_data.location,
        installationDate=machine_data.installationDate,
        status=machine_data.status or MachineStatus.OPERATIONAL
    )
    
    db.add(machine)
    db.commit()
    db.refresh(machine)
    
    return MachineResponse.model_validate(machine)

@router.get("/{machine_id}", response_model=MachineResponse)
async def get_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get machine details by ID"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    return MachineResponse.model_validate(machine)

@router.patch("/{machine_id}", response_model=MachineResponse)
async def update_machine(
    machine_id: int,
    machine_data: MachineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update machine"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Validate department if provided
    if machine_data.departmentId:
        department = db.query(Department).filter(Department.id == machine_data.departmentId).first()
        if not department:
            raise HTTPException(status_code=400, detail="Department not found")
    
    # Get update data once
    update_data = machine_data.model_dump(exclude_unset=True)
    
    # Validate QR code is unique if provided and changed
    if 'qrCode' in update_data and update_data['qrCode'] != machine.qrCode:
        if not QRCodeService.validate_qr_code_uniqueness(db, update_data['qrCode'], machine_id):
            raise HTTPException(status_code=400, detail="QR code already exists. Please use a different QR code.")
    
    # Validate serial number is unique if provided and changed
    if 'serialNumber' in update_data and update_data['serialNumber'] != machine.serialNumber:
        existing_machine = db.query(Machine).filter(
            Machine.serialNumber == update_data['serialNumber'],
            Machine.id != machine_id
        ).first()
        if existing_machine:
            raise HTTPException(status_code=400, detail="A machine with this serial number already exists. Please use a different serial number.")
    
    # Update fields
    for field, value in update_data.items():
        setattr(machine, field, value)
    
    db.commit()
    db.refresh(machine)
    
    return MachineResponse.model_validate(machine)

@router.delete("/{machine_id}")
async def delete_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete machine"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Check if machine has dependencies (maintenance requests, etc.)
    # For now, we'll allow deletion but this could be enhanced
    # to check for maintenance requests, work orders, etc.
    
    db.delete(machine)
    db.commit()
    
    return {"message": "Machine deleted successfully"}

@router.get("/{machine_id}/qr-code", response_model=QRCodeResponse)
async def get_machine_qr_code(
    machine_id: int,
    size: int = Query(200, ge=100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get QR code image for machine"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Generate QR code data
    qr_data = QRCodeService.generate_machine_qr_data(machine.id, machine.qrCode)
    
    # Generate QR code image
    qr_image = QRCodeService.generate_qr_code_image(qr_data, size)
    
    return QRCodeResponse(
        qrCode=machine.qrCode,
        qrCodeImage=qr_image,
        machineId=machine.id,
        machineName=machine.name
    )

@router.get("/qr/{qr_code:path}", response_model=MachineResponse)
async def get_machine_by_qr_code(
    qr_code: str,
    db: Session = Depends(get_db)
):
    """Get machine by QR code (for mobile scanning)
    
    Uses :path parameter type to handle QR codes with special characters like slashes.
    The QR code is automatically URL-decoded by FastAPI.
    """
    # FastAPI automatically decodes the path parameter
    # So if the client sends encoded value, it will be decoded here
    logger = logging.getLogger(__name__)
    logger.info(f"Received QR code lookup request for: {repr(qr_code)} (length: {len(qr_code)})")
    
    machine = db.query(Machine).options(joinedload(Machine.department)).filter(Machine.qrCode == qr_code).first()
    if not machine:
        logger.warning(f"Machine not found for QR code: {repr(qr_code)}")
        # Try to find similar QR codes for debugging
        similar = db.query(Machine.qrCode).limit(5).all()
        logger.info(f"Sample QR codes in database: {[str(q[0])[:50] for q in similar]}")
        raise HTTPException(status_code=404, detail="Machine not found")
    
    logger.info(f"Found machine {machine.id} ({machine.name}) for QR code: {repr(qr_code)}")
    return MachineResponse.model_validate(machine)

@router.get("/{machine_id}/detail", response_model=MachineDetailResponse)
async def get_machine_detail(
    machine_id: int,
    include_history: bool = Query(True, description="Include maintenance history"),
    page: int = Query(1, ge=1, description="Page number for maintenance history"),
    page_size: int = Query(10, ge=1, le=100, description="Page size for maintenance history"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive machine detail with history, spare parts, and attachments"""
    
    # Get machine with department
    machine = db.query(Machine).options(joinedload(Machine.department)).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    # Get active maintenance requests (not completed or cancelled)
    active_maintenance = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.machineId == machine_id,
        MaintenanceRequest.status.in_([RequestStatus.PENDING, RequestStatus.IN_PROGRESS, RequestStatus.WAITING_PARTS])
    ).order_by(MaintenanceRequest.requestedDate.desc()).all()
    
    # Get maintenance history (completed and cancelled) with pagination
    maintenance_history = []
    total_maintenance_count = 0
    
    if include_history:
        history_query = db.query(MaintenanceRequest).filter(
            MaintenanceRequest.machineId == machine_id,
            MaintenanceRequest.status.in_([RequestStatus.COMPLETED, RequestStatus.CANCELLED])
        )
        
        total_maintenance_count = history_query.count()
        
        offset = (page - 1) * page_size
        maintenance_history = history_query.order_by(MaintenanceRequest.requestedDate.desc()).offset(offset).limit(page_size).all()
    
    # Get spare parts requirements
    spare_parts_reqs = db.query(MachineSparePart).options(joinedload(MachineSparePart.sparePart)).filter(
        MachineSparePart.machineId == machine_id
    ).all()
    
    # Get attachments
    attachments = db.query(Attachment).options(joinedload(Attachment.uploadedBy)).filter(
        Attachment.entityType == 'MACHINE',
        Attachment.entityId == machine_id
    ).all()
    
    # Build response with stock status for spare parts
    spare_parts_info = []
    for req in spare_parts_reqs:
        stock_status = 'IN_STOCK'
        if req.sparePart.currentStock < req.quantityRequired:
            if req.sparePart.currentStock >= req.sparePart.minimumStock:
                stock_status = 'LOW_STOCK'
            else:
                stock_status = 'OUT_OF_STOCK'
        
        spare_parts_info.append({
            'id': req.id,
            'quantityRequired': req.quantityRequired,
            'notes': req.notes,
            'sparePart': req.sparePart,
            'stockStatus': stock_status
        })
    
    # Calculate total pages for maintenance history
    total_history_pages = math.ceil(total_maintenance_count / page_size) if include_history else 0
    
    return MachineDetailResponse(
        # Machine basic info
        id=machine.id,
        qrCode=machine.qrCode,
        name=machine.name,
        model=machine.model,
        serialNumber=machine.serialNumber,
        location=machine.location,
        installationDate=machine.installationDate,
        status=machine.status,
        createdAt=machine.createdAt,
        updatedAt=machine.updatedAt,
        
        # Department info
        departmentId=machine.departmentId,
        department=DepartmentBasicInfo.model_validate(machine.department) if machine.department else None,
        
        # Maintenance info
        maintenanceHistory=[MaintenanceRequestBasicInfo.model_validate(mr) for mr in maintenance_history],
        activeMaintenance=[MaintenanceRequestBasicInfo.model_validate(mr) for mr in active_maintenance],
        totalMaintenanceCount=total_maintenance_count,
        
        # Spare parts requirements
        sparePartsRequirements=[MachineSparePartInfo(**info) for info in spare_parts_info],
        
        # Attachments - map createdAt to uploadedAt since Attachment model uses createdAt for upload time
        attachments=[
            AttachmentBasicInfo(
                id=att.id,
                fileName=att.fileName,
                originalFileName=att.originalFileName,
                filePath=att.filePath,
                fileSize=att.fileSize,
                mimeType=att.mimeType,
                description=att.description,
                uploadedById=att.uploadedById,
                uploadedAt=att.createdAt  # Use createdAt as uploadedAt
            ) for att in attachments
        ],
        
        # Pagination info
        maintenanceHistoryPage=page,
        maintenanceHistoryPageSize=page_size,
        maintenanceHistoryTotalPages=total_history_pages
    )

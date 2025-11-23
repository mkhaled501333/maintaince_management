from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user, require_role_list
from app.models.maintenance_work import MaintenanceWork
from app.models.user import User
from app.schemas.maintenance_work import (
    MaintenanceWorkCreate,
    MaintenanceWorkUpdate,
    MaintenanceWorkResponse,
    MaintenanceWorkStart,
    MaintenanceWorkProgressUpdate,
    MaintenanceWorkComplete
)

router = APIRouter()

@router.get("/by-request/{request_id}", response_model=Optional[MaintenanceWorkResponse])
async def get_work_by_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get maintenance work record by request ID"""
    from fastapi.responses import Response
    
    maintenance_work = db.query(MaintenanceWork).filter(
        MaintenanceWork.requestId == request_id
    ).first()
    
    if not maintenance_work:
        return Response(status_code=204)  # No content
    
    # Technicians can only view their own work (unless admin/manager)
    if current_user.role not in ["ADMIN", "MAINTENANCE_MANAGER"]:
        if maintenance_work.assignedToId != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own maintenance work"
            )
    
    return maintenance_work

@router.get("/{work_id}", response_model=MaintenanceWorkResponse)
async def get_maintenance_work(
    work_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific maintenance work record"""
    maintenance_work = db.query(MaintenanceWork).filter(
        MaintenanceWork.id == work_id
    ).first()
    
    if not maintenance_work:
        raise HTTPException(status_code=404, detail="Maintenance work not found")
    
    # Technicians can only view their own work (unless admin/manager)
    if current_user.role not in ["ADMIN", "MAINTENANCE_MANAGER"]:
        if maintenance_work.assignedToId != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own maintenance work"
            )
    
    return maintenance_work

@router.post("", response_model=MaintenanceWorkResponse)
async def create_maintenance_work(
    work: MaintenanceWorkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_TECH", "ADMIN"]))
):
    """Create a new maintenance work record"""
    from app.models.maintenance_request import MaintenanceRequest
    
    # Verify request exists
    maintenance_request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == work.requestId
    ).first()
    
    if not maintenance_request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    # Check if work already exists for this request
    existing_work = db.query(MaintenanceWork).filter(
        MaintenanceWork.requestId == work.requestId
    ).first()
    
    if existing_work:
        raise HTTPException(
            status_code=409,
            detail="Maintenance work already exists for this request"
        )
    
    # Create maintenance work
    from app.models.maintenance_work import WorkStatus
    maintenance_work = MaintenanceWork(
        requestId=work.requestId,
        assignedToId=current_user.id,
        machineId=maintenance_request.machineId,
        workDescription=work.workDescription or f"Maintenance work for request #{work.requestId}",
        startTime=work.startedAt,
        status=WorkStatus.IN_PROGRESS
    )
    
    db.add(maintenance_work)
    db.commit()
    db.refresh(maintenance_work)
    
    return maintenance_work

@router.patch("/{work_id}", response_model=MaintenanceWorkResponse)
async def update_maintenance_work(
    work_id: int,
    work_update: MaintenanceWorkUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_TECH", "ADMIN"]))
):
    """Update maintenance work progress"""
    maintenance_work = db.query(MaintenanceWork).filter(
        MaintenanceWork.id == work_id
    ).first()
    
    if not maintenance_work:
        raise HTTPException(status_code=404, detail="Maintenance work not found")
    
    # Technicians can only update their own work (unless admin/manager)
    if current_user.role not in ["ADMIN", "MAINTENANCE_MANAGER"]:
        if maintenance_work.assignedToId != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own maintenance work"
            )
    
    # Update fields
    if work_update.startedAt is not None:
        maintenance_work.startTime = work_update.startedAt
    if work_update.workDescription is not None:
        maintenance_work.workDescription = work_update.workDescription
    if work_update.completedAt is not None:
        maintenance_work.endTime = work_update.completedAt
    if work_update.status is not None:
        maintenance_work.status = work_update.status
    
    # Handle maintenanceSteps
    if work_update.maintenanceSteps is not None:
        maintenance_work.maintenanceSteps = [step.dict() for step in work_update.maintenanceSteps]
    
    # Create activity log entry
    from app.services.audit_service import log_activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="UPDATE",
        entityType="MAINTENANCE_WORK",
        entityId=work_id,
        description=f"Maintenance work progress updated by {current_user.fullName}",
        request=request
    )
    
    db.commit()
    db.refresh(maintenance_work)
    
    return maintenance_work

@router.patch("/{work_id}/start", response_model=MaintenanceWorkResponse)
async def start_maintenance_work(
    work_id: int,
    work_start: MaintenanceWorkStart,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_TECH", "ADMIN"]))
):
    """Start maintenance work"""
    from app.models.maintenance_work import WorkStatus
    from datetime import datetime
    
    maintenance_work = db.query(MaintenanceWork).filter(
        MaintenanceWork.id == work_id
    ).first()
    
    if not maintenance_work:
        raise HTTPException(status_code=404, detail="Maintenance work not found")
    
    # Technicians can only start their own work (unless admin/manager)
    if current_user.role not in ["ADMIN", "MAINTENANCE_MANAGER"]:
        if maintenance_work.assignedToId != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only start your own maintenance work"
            )
    
    # Validate work status transition
    if maintenance_work.status != WorkStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start work with status {maintenance_work.status}. Work must be PENDING."
        )
    
    # Update work details
    maintenance_work.status = WorkStatus.IN_PROGRESS
    maintenance_work.startTime = datetime.utcnow()
    
    if work_start.workDescription:
        maintenance_work.workDescription = work_start.workDescription
    
    if work_start.maintenanceSteps:
        maintenance_work.maintenanceSteps = [step.dict() for step in work_start.maintenanceSteps]
    
    # Update maintenance request status
    from app.models.maintenance_request import MaintenanceRequest, RequestStatus
    maintenance_request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == maintenance_work.requestId
    ).first()
    
    if maintenance_request:
        maintenance_request.status = RequestStatus.IN_PROGRESS
    
    # Create activity log entry
    from app.services.audit_service import log_activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="START",
        entityType="MAINTENANCE_WORK",
        entityId=work_id,
        description=f"Maintenance work started by {current_user.fullName}",
        request=request
    )
    
    db.commit()
    db.refresh(maintenance_work)
    
    return maintenance_work

@router.patch("/{work_id}/update-progress", response_model=MaintenanceWorkResponse)
async def update_maintenance_work_progress(
    work_id: int,
    progress_update: MaintenanceWorkProgressUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_TECH", "ADMIN"]))
):
    """Update maintenance work progress"""
    from app.models.maintenance_work import WorkStatus
    from datetime import datetime
    
    maintenance_work = db.query(MaintenanceWork).filter(
        MaintenanceWork.id == work_id
    ).first()
    
    if not maintenance_work:
        raise HTTPException(status_code=404, detail="Maintenance work not found")
    
    # Technicians can only update their own work (unless admin/manager)
    if current_user.role not in ["ADMIN", "MAINTENANCE_MANAGER"]:
        if maintenance_work.assignedToId != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own maintenance work"
            )
    
    # Validate work status
    if maintenance_work.status == WorkStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Cannot update progress on completed work"
        )
    
    # Validate step completion sequence
    steps = progress_update.maintenanceSteps
    for i, step in enumerate(steps):
        if step.completed and i > 0:
            # Check if previous step is completed
            prev_step = steps[i-1]
            if not prev_step.completed:
                raise HTTPException(
                    status_code=400,
                    detail=f"Step {step.step} cannot be completed before step {prev_step.step}"
                )
    
    # Update maintenance steps with timestamps for completed steps
    updated_steps = []
    for step in steps:
        step_dict = step.dict()
        if step.completed and not step.completedAt:
            step_dict['completedAt'] = datetime.utcnow().isoformat()
        elif step_dict.get('completedAt') and isinstance(step_dict['completedAt'], datetime):
            step_dict['completedAt'] = step_dict['completedAt'].isoformat()
        updated_steps.append(step_dict)
    
    maintenance_work.maintenanceSteps = updated_steps
    
    # Create activity log entry
    from app.services.audit_service import log_activity
    completed_steps = [step.step for step in steps if step.completed]
    log_activity(
        db=db,
        userId=current_user.id,
        action="UPDATE",
        entityType="MAINTENANCE_WORK",
        entityId=work_id,
        description=f"Maintenance work progress updated by {current_user.fullName}. Completed steps: {completed_steps}",
        request=request
    )
    
    db.commit()
    db.refresh(maintenance_work)
    
    return maintenance_work

@router.patch("/{work_id}/complete", response_model=MaintenanceWorkResponse)
async def complete_maintenance_work(
    work_id: int,
    work_complete: MaintenanceWorkComplete,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["MAINTENANCE_TECH", "ADMIN"]))
):
    """Complete maintenance work"""
    from app.models.maintenance_work import WorkStatus
    from datetime import datetime
    
    maintenance_work = db.query(MaintenanceWork).filter(
        MaintenanceWork.id == work_id
    ).first()
    
    if not maintenance_work:
        raise HTTPException(status_code=404, detail="Maintenance work not found")
    
    # Technicians can only complete their own work (unless admin/manager)
    if current_user.role not in ["ADMIN", "MAINTENANCE_MANAGER"]:
        if maintenance_work.assignedToId != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only complete your own maintenance work"
            )
    
    # Validate work status
    if maintenance_work.status == WorkStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Work is already completed"
        )
    
    if maintenance_work.status == WorkStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Cannot complete work that hasn't been started"
        )
    
    # Update work details
    maintenance_work.status = WorkStatus.COMPLETED
    maintenance_work.endTime = datetime.utcnow()
    maintenance_work.workDescription = work_complete.workDescription
    
    if work_complete.maintenanceSteps:
        # Ensure all steps are marked as completed
        updated_steps = []
        for step in work_complete.maintenanceSteps:
            step_dict = step.dict()
            if not step.completedAt:
                step_dict['completedAt'] = datetime.utcnow().isoformat()
            elif step_dict.get('completedAt') and isinstance(step_dict['completedAt'], datetime):
                step_dict['completedAt'] = step_dict['completedAt'].isoformat()
            step_dict['completed'] = True
            updated_steps.append(step_dict)
        maintenance_work.maintenanceSteps = updated_steps
    
    # Update maintenance request status
    from app.models.maintenance_request import MaintenanceRequest, RequestStatus
    maintenance_request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == maintenance_work.requestId
    ).first()
    
    if not maintenance_request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    
    # Validate request status transition - only allow from IN_PROGRESS or WAITING_PARTS
    if maintenance_request.status not in [RequestStatus.IN_PROGRESS, RequestStatus.WAITING_PARTS]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete work when request status is {maintenance_request.status}. Request must be IN_PROGRESS or WAITING_PARTS."
        )
    
    # Update request status to COMPLETED
    maintenance_request.status = RequestStatus.COMPLETED
    maintenance_request.actualCompletionDate = datetime.utcnow()
    
    # Update machine status - change to OPERATIONAL if no other active maintenance requests
    from app.models.machine import Machine, MachineStatus
    from app.services.audit_service import log_activity
    machine = db.query(Machine).filter(Machine.id == maintenance_work.machineId).first()
    
    if machine:
        # Check if there are other active maintenance requests for this machine
        other_active_requests = db.query(MaintenanceRequest).filter(
            MaintenanceRequest.machineId == maintenance_work.machineId,
            MaintenanceRequest.id != maintenance_work.requestId,
            MaintenanceRequest.status.in_([
                RequestStatus.PENDING,
                RequestStatus.IN_PROGRESS,
                RequestStatus.WAITING_PARTS
            ])
        ).count()
        
        # Only change to OPERATIONAL if there are no other active maintenance requests
        if other_active_requests == 0 and machine.status in [MachineStatus.MAINTENANCE, MachineStatus.DOWN]:
            old_machine_status = machine.status
            machine.status = MachineStatus.OPERATIONAL
            
            # Log machine status change
            log_activity(
                db=db,
                userId=current_user.id,
                action="UPDATE",
                entityType="MACHINE",
                entityId=machine.id,
                description=f"Machine status changed from {old_machine_status.value} to OPERATIONAL after maintenance work completion",
                oldValues={"status": old_machine_status.value},
                newValues={"status": MachineStatus.OPERATIONAL.value},
                request=request
            )
    
    # Create machine downtime record
    from app.models.machine_downtime import MachineDowntime
    if maintenance_work.startTime and maintenance_work.endTime:
        duration_hours = (maintenance_work.endTime - maintenance_work.startTime).total_seconds() / 3600
        
        downtime = MachineDowntime(
            machineId=maintenance_work.machineId,
            reason=f"Maintenance work completed for request {maintenance_work.requestId}",
            startTime=maintenance_work.startTime,
            endTime=maintenance_work.endTime,
            duration=duration_hours,
            maintenanceWorkId=maintenance_work.id
        )
        db.add(downtime)
    
    # Create activity log entry
    duration = ""
    if maintenance_work.startTime and maintenance_work.endTime:
        duration_minutes = int((maintenance_work.endTime - maintenance_work.startTime).total_seconds() / 60)
        duration = f" (Duration: {duration_minutes} minutes)"
    
    # Include notes in activity log if provided
    notes_info = ""
    if work_complete.notes:
        notes_info = f" Notes: {work_complete.notes}"
    
    log_activity(
        db=db,
        userId=current_user.id,
        action="COMPLETE",
        entityType="MAINTENANCE_WORK",
        entityId=work_id,
        description=f"Maintenance work completed by {current_user.fullName}{duration}{notes_info}",
        request=request
    )
    
    # Notification stub - log completion for stakeholders (AC: 5)
    # TODO: Implement actual notification mechanism (email, SMS, etc.)
    import logging
    logger = logging.getLogger(__name__)
    logger.info(
        f"Maintenance work {work_id} completed. "
        f"Request {maintenance_work.requestId} status changed to COMPLETED. "
        f"Technician: {current_user.fullName} ({current_user.id}). "
        f"Machine: {maintenance_work.machineId}."
    )
    
    db.commit()
    db.refresh(maintenance_work)
    
    return maintenance_work


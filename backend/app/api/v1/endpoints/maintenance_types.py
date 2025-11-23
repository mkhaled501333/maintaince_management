from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from app.core.database import get_db
from app.core.deps import require_role_list
from app.models.maintenance_type import MaintenanceType
from app.models.user import User
from app.schemas.maintenance_type import MaintenanceTypeCreate, MaintenanceTypeResponse

router = APIRouter()

@router.get("", response_model=List[MaintenanceTypeResponse])
async def list_maintenance_types(
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    db: Session = Depends(get_db)
):
    """List all maintenance types"""
    query = db.query(MaintenanceType)
    
    if category:
        query = query.filter(MaintenanceType.category == category)
    
    if is_active is not None:
        query = query.filter(MaintenanceType.isActive == is_active)
    
    maintenance_types = query.all()
    return maintenance_types


@router.post("", response_model=MaintenanceTypeResponse, status_code=201)
async def create_maintenance_type(
    body: MaintenanceTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["ADMIN"]))
):
    """Create a new maintenance type. Returns 409 if name already exists."""
    maint_type = MaintenanceType(
        name=body.name,
        description=body.description,
        category=body.category,
        isActive=body.isActive if body.isActive is not None else True,
    )
    db.add(maint_type)
    try:
        db.commit()
        db.refresh(maint_type)
        return maint_type
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Maintenance type already exists")

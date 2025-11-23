from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.department import Department
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter()

@router.get("", response_model=List[DepartmentResponse])
async def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all departments"""
    departments = db.query(Department).all()
    return [DepartmentResponse.model_validate(dept) for dept in departments]

@router.post("", response_model=DepartmentResponse)
async def create_department(
    department_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new department"""
    # Check if department name already exists
    existing_dept = db.query(Department).filter(Department.name == department_data.name).first()
    if existing_dept:
        raise HTTPException(status_code=400, detail="Department name already exists")
    
    # Create new department
    new_department = Department(
        name=department_data.name,
        description=department_data.description
    )
    
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    
    return DepartmentResponse.model_validate(new_department)

@router.put("/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: int,
    department_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update department information"""
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check for name conflicts
    if department_data.name and department_data.name != department.name:
        existing_dept = db.query(Department).filter(Department.name == department_data.name).first()
        if existing_dept:
            raise HTTPException(status_code=400, detail="Department name already exists")
    
    # Update department fields
    update_data = department_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(department, field, value)
    
    db.commit()
    db.refresh(department)
    
    return DepartmentResponse.model_validate(department)

@router.delete("/{dept_id}")
async def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete department"""
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if department has machines
    if department.machines:
        raise HTTPException(status_code=400, detail="Cannot delete department with assigned machines")
    
    db.delete(department)
    db.commit()
    
    return {"message": "Department deleted successfully"}

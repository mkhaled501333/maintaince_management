from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from app.core.database import get_db
from app.core.deps import require_role_list
from app.models.failure_code import FailureCode
from app.models.user import User
from app.schemas.failure_code import FailureCodeCreate, FailureCodeResponse

router = APIRouter()

@router.get("", response_model=List[FailureCodeResponse])
async def list_failure_codes(
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    db: Session = Depends(get_db)
):
    """List all failure codes"""
    query = db.query(FailureCode)
    
    if category:
        query = query.filter(FailureCode.category == category)
    
    if is_active is not None:
        query = query.filter(FailureCode.isActive == is_active)
    
    failure_codes = query.all()
    return failure_codes


@router.post("", response_model=FailureCodeResponse, status_code=201)
async def create_failure_code(
    body: FailureCodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_list(["ADMIN"]))
):
    """Create a new failure code. Returns 409 if code already exists."""
    failure_code = FailureCode(
        code=body.code,
        description=body.description,
        category=body.category,
        isActive=body.isActive if body.isActive is not None else True,
    )
    db.add(failure_code)
    try:
        db.commit()
        db.refresh(failure_code)
        return failure_code
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Failure code already exists")

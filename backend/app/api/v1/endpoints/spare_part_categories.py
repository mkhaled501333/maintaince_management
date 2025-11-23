from typing import List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_inventory_manager
from app.models.spare_part_category import SparePartCategory
from app.models.user import User
from app.schemas.spare_part_category import SparePartCategoryResponse

router = APIRouter()


@router.get("", response_model=List[SparePartCategoryResponse])
async def list_spare_part_categories(
    is_active: Optional[bool] = Query(True, alias="isActive", description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in category name or code"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
):
    query = db.query(SparePartCategory)

    if is_active is not None:
        query = query.filter(SparePartCategory.isActive == is_active)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (SparePartCategory.name.ilike(search_term))
            | (SparePartCategory.code.ilike(search_term))
        )

    categories = query.order_by(SparePartCategory.name.asc()).all()
    return categories


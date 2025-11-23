from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SparePartCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, description="Category description")
    isActive: bool = True


class SparePartCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, description="Category description")


class SparePartCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, description="Category description")
    isActive: Optional[bool] = None


class SparePartCategoryResponse(SparePartCategoryBase):
    id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


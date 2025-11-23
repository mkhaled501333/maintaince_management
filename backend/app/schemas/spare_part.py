from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

from app.schemas.spare_part_category import SparePartCategoryResponse


class SparePartCreate(BaseModel):
    partNumber: str = Field(..., min_length=1, max_length=100, description="Part number is required and must be unique")
    partName: str = Field(..., min_length=1, max_length=200, description="Part name is required")
    description: Optional[str] = Field(None, description="Part description")
    categoryId: Optional[int] = Field(None, description="Spare part category ID")
    currentStock: int = Field(0, ge=0, description="Current stock quantity")
    minimumStock: int = Field(0, ge=0, description="Minimum stock level")
    maximumStock: Optional[int] = Field(None, ge=0, description="Maximum stock level")
    unitPrice: Optional[float] = Field(None, ge=0, description="Unit price")
    supplier: Optional[str] = Field(None, max_length=200, description="Supplier name")
    supplierPartNumber: Optional[str] = Field(None, max_length=100, description="Supplier part number")
    location: Optional[str] = Field(None, max_length=200, description="Storage location")

    @validator('partNumber', 'partName')
    def validate_required_fields(cls, v):
        if isinstance(v, str) and len(v.strip()) < 1:
            raise ValueError('Field cannot be empty')
        return v.strip() if isinstance(v, str) else v

    @validator('description', 'supplier', 'supplierPartNumber', 'location')
    def validate_optional_string_fields(cls, v):
        if v is not None:
            if isinstance(v, str) and v.strip() == '':
                return None
            return v.strip() if isinstance(v, str) else v
        return v


class SparePartUpdate(BaseModel):
    partNumber: Optional[str] = Field(None, min_length=1, max_length=100, description="Part number")
    partName: Optional[str] = Field(None, min_length=1, max_length=200, description="Part name")
    description: Optional[str] = Field(None, description="Part description")
    categoryId: Optional[int] = Field(None, description="Spare part category ID")
    currentStock: Optional[int] = Field(None, ge=0, description="Current stock quantity")
    minimumStock: Optional[int] = Field(None, ge=0, description="Minimum stock level")
    maximumStock: Optional[int] = Field(None, ge=0, description="Maximum stock level")
    unitPrice: Optional[float] = Field(None, ge=0, description="Unit price")
    supplier: Optional[str] = Field(None, max_length=200, description="Supplier name")
    supplierPartNumber: Optional[str] = Field(None, max_length=100, description="Supplier part number")
    location: Optional[str] = Field(None, max_length=200, description="Storage location")
    isActive: Optional[bool] = Field(None, description="Active status")

    @validator('partNumber', 'partName')
    def validate_required_fields(cls, v):
        if v is not None:
            if isinstance(v, str) and len(v.strip()) < 1:
                raise ValueError('Field cannot be empty')
            return v.strip() if isinstance(v, str) else v
        return v

    @validator('description', 'supplier', 'supplierPartNumber', 'location')
    def validate_optional_string_fields(cls, v):
        if v is not None:
            if isinstance(v, str) and v.strip() == '':
                return None
            return v.strip() if isinstance(v, str) else v
        return v


class SparePartResponse(BaseModel):
    id: int
    partNumber: str
    partName: str
    description: Optional[str]
    categoryId: Optional[int]
    currentStock: int
    minimumStock: int
    maximumStock: Optional[int]
    unitPrice: Optional[float]
    supplier: Optional[str]
    supplierPartNumber: Optional[str]
    location: Optional[str]
    isActive: bool
    transactionCount: Optional[int] = 0
    createdAt: datetime
    updatedAt: datetime
    category: Optional[SparePartCategoryResponse] = None

    class Config:
        from_attributes = True


class SparePartListResponse(BaseModel):
    spareParts: List[SparePartResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int


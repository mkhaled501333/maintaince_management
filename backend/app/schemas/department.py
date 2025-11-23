from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Department name must be 2-100 characters")
    description: Optional[str] = Field(None, max_length=500, description="Description must be less than 500 characters")

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Department name must be at least 2 characters long')
        return v.strip()

class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Department name must be 2-100 characters")
    description: Optional[str] = Field(None, max_length=500, description="Description must be less than 500 characters")

    @validator('name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) < 2:
            raise ValueError('Department name must be at least 2 characters long')
        return v.strip() if v is not None else v

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

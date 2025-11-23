from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MaintenanceTypeCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    isActive: Optional[bool] = True

    class Config:
        extra = "forbid"


class MaintenanceTypeUpdate(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    isActive: Optional[bool] = None

    class Config:
        extra = "forbid"


class MaintenanceTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True



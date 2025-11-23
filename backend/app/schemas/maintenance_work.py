from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.maintenance_work import WorkStatus

# Maintenance Step schema
class MaintenanceStep(BaseModel):
    step: int
    description: str
    completed: bool
    completedAt: Optional[datetime] = None

# Request schemas
class MaintenanceWorkCreate(BaseModel):
    requestId: int
    startedAt: Optional[datetime] = None
    workDescription: Optional[str] = None
    maintenanceSteps: Optional[List[MaintenanceStep]] = None
    
    class Config:
        extra = "forbid"

class MaintenanceWorkUpdate(BaseModel):
    startedAt: Optional[datetime] = None
    workDescription: Optional[str] = None
    maintenanceSteps: Optional[List[MaintenanceStep]] = None
    completedAt: Optional[datetime] = None
    status: Optional[WorkStatus] = None

# Progress tracking schemas
class MaintenanceWorkStart(BaseModel):
    """Schema for starting maintenance work"""
    workDescription: Optional[str] = None
    maintenanceSteps: Optional[List[MaintenanceStep]] = None
    
    class Config:
        extra = "forbid"

class MaintenanceWorkProgressUpdate(BaseModel):
    """Schema for updating maintenance work progress"""
    maintenanceSteps: List[MaintenanceStep] = Field(..., description="Updated maintenance steps")
    
    class Config:
        extra = "forbid"

class MaintenanceWorkComplete(BaseModel):
    """Schema for completing maintenance work"""
    workDescription: str = Field(..., min_length=1, description="Work description is required when completing")
    maintenanceSteps: Optional[List[MaintenanceStep]] = None
    notes: Optional[str] = Field(None, description="Optional completion notes")
    
    class Config:
        extra = "forbid"

class MaintenanceWorkResponse(BaseModel):
    id: int
    requestId: int
    assignedToId: int
    machineId: int
    workDescription: str
    status: WorkStatus
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    laborCost: Optional[float] = None
    materialCost: Optional[float] = None
    totalCost: Optional[float] = None
    failureCodeId: Optional[int] = None
    maintenanceTypeId: Optional[int] = None
    maintenanceSteps: Optional[List[MaintenanceStep]] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True


from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.maintenance_request import RequestStatus, RequestPriority
from app.models.machine import MachineStatus
from app.schemas.attachment import AttachmentResponse

# Request Schemas
class MaintenanceRequestCreate(BaseModel):
    machineId: int
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    priority: RequestPriority = RequestPriority.MEDIUM
    failureCodeId: Optional[int] = None
    maintenanceTypeId: Optional[int] = None
    expectedCompletionDate: Optional[datetime] = None
    machineStatus: Optional[MachineStatus] = Field(
        None, description="Optional machine status override when reporting a problem"
    )
    
    class Config:
        extra = "forbid"

class MaintenanceRequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    priority: Optional[RequestPriority] = None
    status: Optional[RequestStatus] = None
    failureCodeId: Optional[int] = None
    maintenanceTypeId: Optional[int] = None
    expectedCompletionDate: Optional[datetime] = None
    actualCompletionDate: Optional[datetime] = None

class MaintenanceRequestResponse(BaseModel):
    id: int
    title: str
    description: str
    priority: RequestPriority
    status: RequestStatus
    requestedDate: datetime
    expectedCompletionDate: Optional[datetime] = None
    actualCompletionDate: Optional[datetime] = None
    machineId: int
    requestedById: int
    requestedByName: Optional[str] = None
    failureCodeId: Optional[int] = None
    maintenanceTypeId: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime
    attachments: Optional[List[AttachmentResponse]] = []

    class Config:
        from_attributes = True

# Dashboard-specific schemas
class MaintenanceRequestListResponse(BaseModel):
    requests: List[MaintenanceRequestResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int

class MaintenanceRequestFilters(BaseModel):
    status: Optional[RequestStatus] = None
    priority: Optional[RequestPriority] = None
    machineId: Optional[int] = None
    requestedById: Optional[int] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 25

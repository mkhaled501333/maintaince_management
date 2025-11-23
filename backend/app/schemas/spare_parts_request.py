from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.spare_parts_request import SparePartsRequestStatus

class SparePartsRequestCreate(BaseModel):
    maintenanceWorkId: int = Field(..., description="ID of the maintenance work")
    sparePartId: int = Field(..., description="ID of the spare part")
    quantityRequested: int = Field(..., gt=0, description="Quantity requested (must be positive)")

    @validator('quantityRequested')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('quantityRequested must be positive')
        return v

class ApproveRequest(BaseModel):
    approvalNotes: Optional[str] = Field(None, description="Notes for approval")

class RejectRequest(BaseModel):
    rejectionReason: str = Field(..., min_length=1, description="Reason for rejection")

    @validator('rejectionReason')
    def validate_rejection_reason(cls, v):
        if isinstance(v, str) and len(v.strip()) < 1:
            raise ValueError('rejectionReason cannot be empty')
        return v.strip() if isinstance(v, str) else v

class SparePartsRequestResponse(BaseModel):
    id: int
    maintenanceWorkId: int
    sparePartId: int
    quantityRequested: int
    status: str
    requestedBy: int
    requestedByName: Optional[str] = None
    approvedBy: Optional[int] = None
    approvedByName: Optional[str] = None
    approvedAt: Optional[datetime] = None
    rejectionReason: Optional[str] = None
    approvalNotes: Optional[str] = None
    # Return fields
    isRequestedReturn: Optional[bool] = False
    returnDate: Optional[datetime] = None
    isReturned: Optional[bool] = False
    # Related entity info
    maintenanceWorkDescription: Optional[str] = None
    sparePartNumber: Optional[str] = None
    sparePartName: Optional[str] = None
    currentStock: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class SparePartsRequestListResponse(BaseModel):
    requests: List[SparePartsRequestResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int


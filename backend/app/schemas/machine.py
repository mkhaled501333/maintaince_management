from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, date
from app.models.machine import MachineStatus

class MachineCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Machine name must be 2-100 characters")
    model: Optional[str] = Field(None, max_length=100, description="Machine model must be less than 100 characters")
    serialNumber: Optional[str] = Field(None, max_length=100, description="Serial number must be less than 100 characters")
    departmentId: int = Field(..., description="Department ID is required")
    location: Optional[str] = Field(None, max_length=200, description="Location must be less than 200 characters")
    installationDate: Optional[date] = Field(None, description="Installation date")
    status: Optional[MachineStatus] = Field(MachineStatus.OPERATIONAL, description="Machine status")
    qrCode: Optional[str] = Field(None, max_length=255, description="Optional QR code to assign to the machine")

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Machine name must be at least 2 characters long')
        return v.strip()

    @validator('serialNumber')
    def validate_serial_number(cls, v):
        if v is not None:
            # Convert empty strings to None
            if v.strip() == '':
                return None
            # Strip whitespace
            return v.strip()
        return v

    @validator('model')
    def validate_model(cls, v):
        if v is not None:
            # Convert empty strings to None
            if v.strip() == '':
                return None
            # Strip whitespace
            return v.strip()
        return v

    @validator('location')
    def validate_location(cls, v):
        if v is not None:
            # Convert empty strings to None
            if v.strip() == '':
                return None
            # Strip whitespace
            return v.strip()
        return v
    
    @validator('qrCode')
    def validate_qr_code(cls, v):
        if v is not None:
            # Convert empty strings to None
            if v.strip() == '':
                return None
            # Strip whitespace
            return v.strip()
        return v

class MachineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Machine name must be 2-100 characters")
    model: Optional[str] = Field(None, max_length=100, description="Machine model must be less than 100 characters")
    serialNumber: Optional[str] = Field(None, max_length=100, description="Serial number must be less than 100 characters")
    departmentId: Optional[int] = Field(None, description="Department ID")
    location: Optional[str] = Field(None, max_length=200, description="Location must be less than 200 characters")
    installationDate: Optional[date] = Field(None, description="Installation date")
    status: Optional[MachineStatus] = Field(None, description="Machine status")

    @validator('name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) < 2:
            raise ValueError('Machine name must be at least 2 characters long')
        return v.strip() if v is not None else v

    @validator('serialNumber')
    def validate_serial_number(cls, v):
        if v is not None:
            # Convert empty strings to None
            if v.strip() == '':
                return None
            # Strip whitespace
            return v.strip()
        return v

    @validator('model')
    def validate_model(cls, v):
        if v is not None:
            # Convert empty strings to None
            if v.strip() == '':
                return None
            # Strip whitespace
            return v.strip()
        return v

    @validator('location')
    def validate_location(cls, v):
        if v is not None:
            # Convert empty strings to None
            if v.strip() == '':
                return None
            # Strip whitespace
            return v.strip()
        return v

class MachineResponse(BaseModel):
    id: int
    qrCode: str
    name: str
    model: Optional[str] = None
    serialNumber: Optional[str] = None
    location: Optional[str] = None
    installationDate: Optional[date] = None
    status: MachineStatus
    departmentId: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class MachineListResponse(BaseModel):
    machines: list[MachineResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int

class MachineStatusSummaryResponse(BaseModel):
    counts: dict[str, int]
    total: int

class QRCodeResponse(BaseModel):
    qrCode: str
    qrCodeImage: str  # Base64 encoded image or URL
    machineId: int
    machineName: str

# Schemas for Machine Detail View
class DepartmentBasicInfo(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class MaintenanceRequestBasicInfo(BaseModel):
    id: int
    title: str
    description: str
    priority: str
    status: str
    requestedDate: datetime
    expectedCompletionDate: Optional[datetime] = None
    actualCompletionDate: Optional[datetime] = None
    requestedById: int
    
    class Config:
        from_attributes = True

class SparePartBasicInfo(BaseModel):
    id: int
    partNumber: str
    name: str
    currentStock: int
    minimumStock: int
    unitPrice: Optional[float] = None
    
    class Config:
        from_attributes = True

class MachineSparePartInfo(BaseModel):
    id: int
    quantityRequired: int
    notes: Optional[str] = None
    sparePart: SparePartBasicInfo
    stockStatus: Optional[str] = None  # 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'
    
    class Config:
        from_attributes = True

class AttachmentBasicInfo(BaseModel):
    id: int
    fileName: str
    originalFileName: str
    filePath: str
    fileSize: int
    mimeType: str
    description: Optional[str] = None
    uploadedById: int
    uploadedAt: datetime
    
    class Config:
        from_attributes = True

class MachineDetailResponse(BaseModel):
    # Machine information
    id: int
    qrCode: str
    name: str
    model: Optional[str] = None
    serialNumber: Optional[str] = None
    location: Optional[str] = None
    installationDate: Optional[date] = None
    status: MachineStatus
    createdAt: datetime
    updatedAt: datetime
    
    # Department details
    departmentId: int
    department: Optional[DepartmentBasicInfo] = None
    
    # Maintenance information
    maintenanceHistory: list[MaintenanceRequestBasicInfo] = []
    activeMaintenance: list[MaintenanceRequestBasicInfo] = []
    totalMaintenanceCount: int = 0
    
    # Spare parts requirements
    sparePartsRequirements: list[MachineSparePartInfo] = []
    
    # File attachments
    attachments: list[AttachmentBasicInfo] = []
    
    # Pagination info for maintenance history
    maintenanceHistoryPage: int = 1
    maintenanceHistoryPageSize: int = 10
    maintenanceHistoryTotalPages: int = 0
    
    class Config:
        from_attributes = True
from sqlalchemy import Column, String, Text, ForeignKey, Enum, DateTime, Integer
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class RequestPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_PARTS = "WAITING_PARTS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class MaintenanceRequest(BaseModel):
    __tablename__ = "maintenance_requests"
    
    # Request details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(RequestPriority), nullable=False, default=RequestPriority.MEDIUM)
    status = Column(Enum(RequestStatus), nullable=False, default=RequestStatus.PENDING)
    
    # Dates
    requestedDate = Column(DateTime(timezone=True), nullable=False)
    expectedCompletionDate = Column(DateTime(timezone=True), nullable=True)
    actualCompletionDate = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    machineId = Column(Integer, ForeignKey("machines.id"), nullable=False)
    machine = relationship("Machine", back_populates="maintenanceRequests")
    
    requestedById = Column(Integer, ForeignKey("users.id"), nullable=False)
    requestedBy = relationship("User", back_populates="maintenanceRequests")
    
    # Foreign keys for failure code and maintenance type
    failureCodeId = Column(Integer, ForeignKey("failurecodes.id"), nullable=True)
    maintenanceTypeId = Column(Integer, ForeignKey("maintenancetypes.id"), nullable=True)
    # Relationships for foreign keys
    failureCode = relationship("FailureCode", back_populates="maintenanceRequests")
    
    # Related work
    maintenanceWorks = relationship("MaintenanceWork", back_populates="request")
    
    def __repr__(self):
        return f"<MaintenanceRequest(title='{self.title}', status='{self.status}')>"

from sqlalchemy import Column, String, Text, ForeignKey, Enum, DateTime, Integer, Float, JSON
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class WorkStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"
    CANCELLED = "CANCELLED"

class MaintenanceWork(BaseModel):
    __tablename__ = "maintenance_works"
    
    # Work details
    workDescription = Column(Text, nullable=False)
    status = Column(Enum(WorkStatus), nullable=False, default=WorkStatus.PENDING)
    maintenanceSteps = Column(JSON, nullable=True)  # Array of MaintenanceStep objects
    
    # Time tracking
    startTime = Column(DateTime(timezone=True), nullable=True)
    endTime = Column(DateTime(timezone=True), nullable=True)
    estimatedHours = Column(Float, nullable=True)
    actualHours = Column(Float, nullable=True)
    
    # Cost tracking
    laborCost = Column(Float, nullable=True, default=0.0)
    materialCost = Column(Float, nullable=True, default=0.0)
    totalCost = Column(Float, nullable=True, default=0.0)
    
    # Relationships
    requestId = Column(Integer, ForeignKey("maintenance_requests.id"), nullable=False)
    request = relationship("MaintenanceRequest", back_populates="maintenanceWorks")
    
    machineId = Column(Integer, ForeignKey("machines.id"), nullable=False)
    machine = relationship("Machine", back_populates="maintenanceWorks")
    
    assignedToId = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignedTo = relationship("User", back_populates="maintenanceWorks")
    
    # Failure code relationship
    failureCodeId = Column(Integer, ForeignKey("failurecodes.id"), nullable=True)
    failureCode = relationship("FailureCode", back_populates="maintenanceWorks")
    
    # Maintenance type relationship
    maintenanceTypeId = Column(Integer, ForeignKey("maintenancetypes.id"), nullable=True)
    maintenanceType = relationship("MaintenanceType", back_populates="maintenanceWorks")
    
    # Spare parts requests relationship
    sparePartsRequests = relationship("SparePartsRequest", back_populates="maintenanceWork")
    
    def __repr__(self):
        return f"<MaintenanceWork(description='{self.workDescription[:50]}...', status='{self.status}')>"

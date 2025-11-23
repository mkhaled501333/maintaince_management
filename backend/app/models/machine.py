from sqlalchemy import Column, String, Text, ForeignKey, Boolean, DateTime, Integer, Date, Enum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from enum import Enum as PyEnum

class MachineStatus(PyEnum):
    OPERATIONAL = 'OPERATIONAL'
    DOWN = 'DOWN'
    MAINTENANCE = 'MAINTENANCE'
    DECOMMISSIONED = 'DECOMMISSIONED'

class Machine(BaseModel):
    __tablename__ = "machines"
    
    # QR Code and identification
    qrCode = Column(String(255), unique=True, nullable=False)
    
    # Basic machine information
    name = Column(String(100), nullable=False)
    model = Column(String(100), nullable=True)
    serialNumber = Column(String(100), nullable=True)
    location = Column(String(200), nullable=True)
    installationDate = Column(Date, nullable=True)
    
    # Status tracking
    status = Column(Enum(MachineStatus), nullable=False, default=MachineStatus.OPERATIONAL)
    
    # Department relationship
    departmentId = Column(Integer, ForeignKey("departments.id"), nullable=False)
    department = relationship("Department", back_populates="machines")
    
    # Relationships
    maintenanceRequests = relationship("MaintenanceRequest", back_populates="machine")
    maintenanceWorks = relationship("MaintenanceWork", back_populates="machine")
    machineSpareParts = relationship("MachineSparePart", back_populates="machine")
    machineDowntimes = relationship("MachineDowntime", back_populates="machine")
    preventiveMaintenanceTasks = relationship("PreventiveMaintenanceTask", back_populates="machine")
    preventiveMaintenanceLogs = relationship("PreventiveMaintenanceLog", back_populates="machine")
    
    def __repr__(self):
        return f"<Machine(name='{self.name}', serialNumber='{self.serialNumber}')>"

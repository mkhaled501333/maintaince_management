from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class MaintenanceType(BaseModel):
    __tablename__ = "maintenancetypes"
    
    # Maintenance type information
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    
    # Status
    isActive = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    maintenanceWorks = relationship("MaintenanceWork", back_populates="maintenanceType")
    maintenanceRequests = relationship("MaintenanceRequest", foreign_keys="MaintenanceRequest.maintenanceTypeId")
    
    def __repr__(self):
        return f"<MaintenanceType(name='{self.name}')>"

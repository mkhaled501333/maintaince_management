from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class FailureCode(BaseModel):
    __tablename__ = "failurecodes"
    
    # Failure code information
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    
    # Status
    isActive = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    maintenanceWorks = relationship("MaintenanceWork", back_populates="failureCode")
    maintenanceRequests = relationship("MaintenanceRequest", foreign_keys="MaintenanceRequest.failureCodeId")
    
    def __repr__(self):
        return f"<FailureCode(code='{self.code}', description='{self.description[:50]}...')>"

from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    MAINTENANCE_TECH = "MAINTENANCE_TECH"
    MAINTENANCE_MANAGER = "MAINTENANCE_MANAGER"
    INVENTORY_MANAGER = "INVENTORY_MANAGER"

class User(BaseModel):
    __tablename__ = "users"
    
    # Basic user information
    username = Column(String(50), unique=True, index=True, nullable=False)
    fullName = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)  # Plain text password
    
    # Role and permissions
    role = Column(Enum(UserRole), nullable=False, default=UserRole.MAINTENANCE_TECH)
    isActive = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    maintenanceRequests = relationship("MaintenanceRequest", back_populates="requestedBy")
    maintenanceWorks = relationship("MaintenanceWork", back_populates="assignedTo")
    activityLogs = relationship("ActivityLog", back_populates="user")
    sparePartsRequestsRequested = relationship("SparePartsRequest", foreign_keys="SparePartsRequest.requestedBy", back_populates="requestedByUser")
    sparePartsRequestsApproved = relationship("SparePartsRequest", foreign_keys="SparePartsRequest.approvedBy", back_populates="approvedByUser")
    
    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"

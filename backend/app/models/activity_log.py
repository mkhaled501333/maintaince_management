from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class ActivityLog(BaseModel):
    __tablename__ = "activity_logs"
    
    # Activity details
    action = Column(String(100), nullable=False)
    entityType = Column(String(50), nullable=False)  # MAINTENANCE_REQUEST, MACHINE, etc.
    entityId = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    
    # Additional data
    oldValues = Column(Text, nullable=True)  # JSON string of old values
    newValues = Column(Text, nullable=True)  # JSON string of new values
    
    # Request tracking (for audit trail)
    ipAddress = Column(String(45), nullable=True)  # IPv4 or IPv6 address
    userAgent = Column(String(500), nullable=True)  # User agent string
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    userId = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="activityLogs")
    
    def __repr__(self):
        return f"<ActivityLog(action='{self.action}', entityType='{self.entityType}')>"

from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Float, Boolean, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class PreventiveMaintenanceLog(BaseModel):
    __tablename__ = "preventive_maintenance_logs"
    
    # Log details
    performedDate = Column(DateTime(timezone=True), nullable=False)
    actualHours = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Status
    isCompleted = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    taskId = Column(Integer, ForeignKey("preventive_maintenance_tasks.id"), nullable=False)
    task = relationship("PreventiveMaintenanceTask", back_populates="preventiveMaintenanceLogs")
    
    machineId = Column(Integer, ForeignKey("machines.id"), nullable=False)
    machine = relationship("Machine", back_populates="preventiveMaintenanceLogs")
    
    # Performed by
    performedById = Column(Integer, ForeignKey("users.id"), nullable=False)
    performedBy = relationship("User")
    
    def __repr__(self):
        return f"<PreventiveMaintenanceLog(taskId={self.taskId}, performedDate='{self.performedDate}')>"

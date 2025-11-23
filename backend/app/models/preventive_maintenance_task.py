from sqlalchemy import Column, String, Text, ForeignKey, Integer, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class PreventiveMaintenanceTask(BaseModel):
    __tablename__ = "preventive_maintenance_tasks"
    
    # Task details
    taskName = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Scheduling
    frequencyDays = Column(Integer, nullable=False)  # Frequency in days
    estimatedHours = Column(Float, nullable=True)
    lastPerformedDate = Column(DateTime(timezone=True), nullable=True)
    nextDueDate = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    isActive = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    machineId = Column(Integer, ForeignKey("machines.id"), nullable=False)
    machine = relationship("Machine", back_populates="preventiveMaintenanceTasks")
    
    # Related logs
    preventiveMaintenanceLogs = relationship("PreventiveMaintenanceLog", back_populates="task")
    
    def __repr__(self):
        return f"<PreventiveMaintenanceTask(taskName='{self.taskName}', frequencyDays={self.frequencyDays})>"

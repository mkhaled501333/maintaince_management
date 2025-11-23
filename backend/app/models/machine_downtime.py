from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Float, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class MachineDowntime(BaseModel):
    __tablename__ = "machine_downtimes"
    
    # Downtime details
    reason = Column(Text, nullable=False)
    startTime = Column(DateTime(timezone=True), nullable=False)
    endTime = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Float, nullable=True)  # Duration in hours
    
    # Impact
    productionLoss = Column(Float, nullable=True)  # Production loss in units
    costImpact = Column(Float, nullable=True)  # Cost impact in currency
    
    # Relationships
    machineId = Column(Integer, ForeignKey("machines.id"), nullable=False)
    machine = relationship("Machine", back_populates="machineDowntimes")
    
    # Related maintenance work
    maintenanceWorkId = Column(Integer, ForeignKey("maintenance_works.id"), nullable=True)
    maintenanceWork = relationship("MaintenanceWork")
    
    def __repr__(self):
        return f"<MachineDowntime(machineId={self.machineId}, duration={self.duration})>"

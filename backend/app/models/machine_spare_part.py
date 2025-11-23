from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class MachineSparePart(BaseModel):
    __tablename__ = "machine_spareparts"
    
    # Relationships
    machineId = Column(Integer, ForeignKey("machines.id"), nullable=False)
    machine = relationship("Machine", back_populates="machineSpareParts")
    
    sparePartId = Column(Integer, ForeignKey("spareparts.id"), nullable=False)
    sparePart = relationship("SparePart", back_populates="machineSpareParts")
    
    # Additional information
    quantityRequired = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<MachineSparePart(machineId={self.machineId}, sparePartId={self.sparePartId})>"

from sqlalchemy import Column, String, Text, Float, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class SparePart(BaseModel):
    __tablename__ = "spareparts"
    
    # Part information
    partNumber = Column(String(100), nullable=False, unique=True)
    partName = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    categoryId = Column(Integer, ForeignKey("sparepart_categories.id", ondelete="SET NULL"), nullable=True)
    
    # Inventory information
    currentStock = Column(Integer, nullable=False, default=0)
    minimumStock = Column(Integer, nullable=False, default=0)
    maximumStock = Column(Integer, nullable=True)
    unitPrice = Column(Float, nullable=True)
    
    # Supplier information
    supplier = Column(String(200), nullable=True)
    supplierPartNumber = Column(String(100), nullable=True)
    
    # Location (for physical inventory management)
    location = Column(String(200), nullable=True)
    
    # Status
    isActive = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    inventoryTransactions = relationship("InventoryTransaction", back_populates="sparePart")
    machineSpareParts = relationship("MachineSparePart", back_populates="sparePart")
    sparePartsRequests = relationship("SparePartsRequest", back_populates="sparePart")
    category = relationship("SparePartCategory", back_populates="spareParts")
    
    def __repr__(self):
        return f"<SparePart(partNumber='{self.partNumber}', partName='{self.partName}')>"

    @property
    def categoryNumber(self):
        return self.category.code if self.category else None

    @property
    def categoryName(self):
        return self.category.name if self.category else None

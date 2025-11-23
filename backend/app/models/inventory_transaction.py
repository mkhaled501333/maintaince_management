from sqlalchemy import Column, String, Text, ForeignKey, Enum, Integer, Float, DateTime
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class TransactionType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"
    TRANSFER = "TRANSFER"

class InventoryTransaction(BaseModel):
    __tablename__ = "inventory_transactions"
    
    # Transaction details
    transactionType = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)
    unitPrice = Column(Float, nullable=True)
    totalValue = Column(Float, nullable=True)
    
    # Reference information
    referenceNumber = Column(String(100), nullable=True)
    referenceType = Column(String(50), nullable=True)  # MAINTENANCE_WORK, PURCHASE_ORDER, etc.
    notes = Column(Text, nullable=True)
    
    # Transaction date
    transactionDate = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    sparePartId = Column(Integer, ForeignKey("spareparts.id"), nullable=False)
    sparePart = relationship("SparePart", back_populates="inventoryTransactions")
    
    # User who performed the transaction
    performedById = Column(Integer, ForeignKey("users.id"), nullable=True)
    performedBy = relationship("User")
    
    def __repr__(self):
        return f"<InventoryTransaction(type='{self.transactionType}', quantity={self.quantity})>"

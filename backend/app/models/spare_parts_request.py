from sqlalchemy import Column, String, Text, ForeignKey, Enum, DateTime, Integer, Boolean
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class SparePartsRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ISSUED = "ISSUED"

class SparePartsRequest(BaseModel):
    __tablename__ = "spare_parts_requests"
    
    # Request details
    maintenanceWorkId = Column(Integer, ForeignKey("maintenance_works.id"), nullable=False)
    sparePartId = Column(Integer, ForeignKey("spareparts.id"), nullable=False)
    quantityRequested = Column(Integer, nullable=False)
    status = Column(Enum(SparePartsRequestStatus), nullable=False, default=SparePartsRequestStatus.PENDING)
    
    # User who requested the parts
    requestedBy = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Approval/Rejection details
    approvedBy = Column(Integer, ForeignKey("users.id"), nullable=True)
    approvedAt = Column(DateTime(timezone=True), nullable=True)
    rejectionReason = Column(Text, nullable=True)
    approvalNotes = Column(Text, nullable=True)
    
    # Return fields
    isRequestedReturn = Column('is_requested_return', Boolean, nullable=False, default=False)
    returnDate = Column('return_date', DateTime(timezone=True), nullable=True)
    isReturned = Column('is_returned', Boolean, nullable=False, default=False)
    
    # Relationships
    maintenanceWork = relationship("MaintenanceWork", back_populates="sparePartsRequests")
    sparePart = relationship("SparePart", back_populates="sparePartsRequests")
    requestedByUser = relationship("User", foreign_keys=[requestedBy], back_populates="sparePartsRequestsRequested")
    approvedByUser = relationship("User", foreign_keys=[approvedBy], back_populates="sparePartsRequestsApproved")
    
    def __repr__(self):
        return f"<SparePartsRequest(id={self.id}, status='{self.status}', quantity={self.quantityRequested})>"


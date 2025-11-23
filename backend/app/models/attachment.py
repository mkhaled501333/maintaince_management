from sqlalchemy import Column, String, Text, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Attachment(BaseModel):
    __tablename__ = "attachments"
    
    # File information
    fileName = Column(String(255), nullable=False)
    originalFileName = Column(String(255), nullable=False)
    filePath = Column(String(500), nullable=False)
    fileSize = Column(Integer, nullable=False)  # Size in bytes
    mimeType = Column(String(100), nullable=False)
    
    # Description
    description = Column(Text, nullable=True)
    
    # Generic foreign key fields for polymorphic relationships
    entityType = Column(String(50), nullable=False)  # MAINTENANCE_REQUEST, MAINTENANCE_WORK, etc.
    entityId = Column(Integer, nullable=False)
    
    # Uploaded by
    uploadedById = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploadedBy = relationship("User")
    
    def __repr__(self):
        return f"<Attachment(fileName='{self.fileName}', entityType='{self.entityType}')>"

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AttachmentCreate(BaseModel):
    entityType: str
    entityId: int
    description: Optional[str] = None

class AttachmentResponse(BaseModel):
    id: int
    fileName: str
    originalFileName: str
    filePath: str
    fileSize: int
    mimeType: str
    description: Optional[str] = None
    entityType: str
    entityId: int
    uploadedById: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

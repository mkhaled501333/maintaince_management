"""
Schemas for Activity Log models.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ActivityLogResponse(BaseModel):
    """Response schema for a single activity log entry"""
    id: int
    userId: int
    userName: Optional[str] = None
    userFullName: Optional[str] = None
    action: str
    entityType: str
    entityId: int
    description: Optional[str] = None
    oldValues: Optional[str] = None  # JSON string
    newValues: Optional[str] = None  # JSON string
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    timestamp: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ActivityLogListResponse(BaseModel):
    """Response schema for paginated activity logs list"""
    activityLogs: List[ActivityLogResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int


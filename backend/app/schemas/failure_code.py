from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FailureCodeCreate(BaseModel):
    code: str = Field(..., max_length=20)
    description: str
    category: Optional[str] = Field(None, max_length=100)
    isActive: Optional[bool] = True

    class Config:
        extra = "forbid"


class FailureCodeUpdate(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    isActive: Optional[bool] = None

    class Config:
        extra = "forbid"


class FailureCodeResponse(BaseModel):
    id: int
    code: str
    description: str
    category: Optional[str] = None
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True



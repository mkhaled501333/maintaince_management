from pydantic import BaseModel, Field, validator
from typing import Optional
from app.models.user import UserRole
import re

# Request schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Response schemas
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds

class UserResponse(BaseModel):
    id: int
    username: str
    fullName: str
    role: UserRole
    isActive: bool

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse

# User Management schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters")
    fullName: str = Field(..., min_length=2, max_length=100, description="Full name must be 2-100 characters")
    password: str = Field(..., min_length=6, max_length=100, description="Password must be 6-100 characters")
    role: UserRole = Field(..., description="Valid user role required")

    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

    @validator('fullName')
    def validate_full_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        return v.strip()

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Username must be 3-50 characters")
    fullName: Optional[str] = Field(None, min_length=2, max_length=100, description="Full name must be 2-100 characters")
    password: Optional[str] = Field(None, min_length=6, max_length=100, description="Password must be 6-100 characters")
    role: Optional[UserRole] = Field(None, description="Valid user role required")
    isActive: Optional[bool] = Field(None, description="User active status")

    @validator('username')
    def validate_username(cls, v):
        if v is not None and not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v

    @validator('password')
    def validate_password(cls, v):
        if v is not None and len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

    @validator('fullName')
    def validate_full_name(cls, v):
        if v is not None and len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        return v.strip() if v is not None else v

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int

# Internal schemas for JWT payload
class TokenPayload(BaseModel):
    sub: str  # user_id
    username: str
    role: UserRole
    exp: int
    iat: int

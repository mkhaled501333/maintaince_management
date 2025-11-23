from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import verify_token, verify_refresh_token
from app.models.user import User, UserRole
from app.schemas.user import TokenPayload

# HTTP Bearer token scheme
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token."""
    token = credentials.credentials
    payload = verify_token(token)
    
    user = db.query(User).filter(User.id == int(payload.sub)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user."""
    return current_user

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get the current user if authenticated, otherwise return None."""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        user = db.query(User).filter(User.id == int(payload.sub)).first()
        return user if user and user.isActive else None
    except HTTPException:
        return None

def require_role(required_role: UserRole):
    """Create a dependency that requires a specific role."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

def require_role_list(required_roles: list[str]):
    """Create a dependency that requires any of the specified roles from a list of role strings."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Check if user's role matches any required role
        # Compare the enum value (string) with the list of role strings
        if current_user.role.value in required_roles or current_user.role == UserRole.ADMIN:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return role_checker

def require_any_role(required_roles: list[UserRole]):
    """Create a dependency that requires any of the specified roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Common role-based dependencies
require_admin = require_role(UserRole.ADMIN)
require_supervisor = require_role(UserRole.SUPERVISOR)
require_maintenance_tech = require_role(UserRole.MAINTENANCE_TECH)
require_maintenance_manager = require_role(UserRole.MAINTENANCE_MANAGER)
require_inventory_manager = require_role(UserRole.INVENTORY_MANAGER)

# Multi-role dependencies
require_maintenance_staff = require_any_role([UserRole.MAINTENANCE_TECH, UserRole.MAINTENANCE_MANAGER])
require_management = require_any_role([UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER, UserRole.INVENTORY_MANAGER])

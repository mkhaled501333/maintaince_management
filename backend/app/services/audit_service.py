"""
Audit service for centralized activity logging.

This service provides a helper function to log activities with automatic
IP address and user agent extraction from FastAPI Request objects.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import Request
from sqlalchemy.orm import Session
import json

from app.models.activity_log import ActivityLog


def get_client_ip(request: Optional[Request]) -> Optional[str]:
    """
    Extract client IP address from request headers.
    
    Checks X-Forwarded-For (for proxies/load balancers), X-Real-IP,
    or falls back to direct client connection.
    """
    if not request:
        return None
    
    # Check X-Forwarded-For header (most common in proxied environments)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fall back to direct client connection
    if request.client:
        return request.client.host
    
    return None


def get_user_agent(request: Optional[Request]) -> Optional[str]:
    """
    Extract user agent string from request headers.
    """
    if not request:
        return None
    
    return request.headers.get("user-agent")


def log_activity(
    db: Session,
    userId: int,
    action: str,
    entityType: str,
    entityId: int,
    description: Optional[str] = None,
    oldValues: Optional[Dict[str, Any]] = None,
    newValues: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    timestamp: Optional[datetime] = None
) -> ActivityLog:
    """
    Create an activity log entry with automatic IP address and user agent extraction.
    
    Args:
        db: SQLAlchemy database session
        userId: ID of the user performing the action
        action: Action type (e.g., "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "COMPLETE", "CANCEL", "LOGIN", "LOGOUT", "ISSUE")
        entityType: Type of entity (e.g., "MAINTENANCE_REQUEST", "SPARE_PART", "MACHINE")
        entityId: ID of the entity being acted upon
        description: Human-readable description of the action
        oldValues: Dictionary of old values (will be serialized as JSON)
        newValues: Dictionary of new values (will be serialized as JSON)
        request: FastAPI Request object for extracting IP and user agent
        timestamp: Optional timestamp (defaults to current UTC time)
    
    Returns:
        ActivityLog: The created activity log record
    """
    # Extract IP address and user agent from request
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # Serialize old and new values as JSON strings
    old_values_json = json.dumps(oldValues) if oldValues else None
    new_values_json = json.dumps(newValues) if newValues else None
    
    # Use provided timestamp or default to current UTC time
    log_timestamp = timestamp or datetime.utcnow()
    
    # Create activity log entry
    activity_log = ActivityLog(
        userId=userId,
        action=action,
        entityType=entityType,
        entityId=entityId,
        description=description,
        oldValues=old_values_json,
        newValues=new_values_json,
        ipAddress=ip_address,
        userAgent=user_agent,
        timestamp=log_timestamp
    )
    
    db.add(activity_log)
    # Note: Don't commit here - let the caller handle transaction management
    return activity_log


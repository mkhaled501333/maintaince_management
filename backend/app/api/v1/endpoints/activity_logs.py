"""
Activity Logs API endpoints for audit trail viewing and export.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import Optional, List
from datetime import datetime
import csv
import io
import math

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.activity_log import ActivityLogResponse, ActivityLogListResponse

router = APIRouter()


@router.get("", response_model=ActivityLogListResponse)
async def get_activity_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    userId: Optional[int] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    entityType: Optional[str] = Query(None, description="Filter by entity type"),
    startDate: Optional[datetime] = Query(None, description="Filter logs from date"),
    endDate: Optional[datetime] = Query(None, description="Filter logs to date"),
    search: Optional[str] = Query(None, description="Search in description field"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Retrieve activity logs with pagination and filtering.
    
    Admin access only.
    """
    query = db.query(ActivityLog)
    
    # Apply filters
    if userId:
        query = query.filter(ActivityLog.userId == userId)
    
    if action:
        query = query.filter(ActivityLog.action == action)
    
    if entityType:
        query = query.filter(ActivityLog.entityType == entityType)
    
    if startDate:
        query = query.filter(ActivityLog.timestamp >= startDate)
    
    if endDate:
        query = query.filter(ActivityLog.timestamp <= endDate)
    
    if search:
        query = query.filter(
            ActivityLog.description.contains(search)
        )
    
    # Get total count before pagination
    total = query.count()
    
    # Order by timestamp descending (newest first)
    query = query.order_by(ActivityLog.timestamp.desc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    logs = query.offset(offset).limit(page_size).all()
    
    # Build response with user relationship
    log_list = []
    for log in logs:
        # Load user relationship
        user = db.query(User).filter(User.id == log.userId).first()
        
        log_list.append(ActivityLogResponse(
            id=log.id,
            userId=log.userId,
            userName=user.username if user else None,
            userFullName=user.fullName if user else None,
            action=log.action,
            entityType=log.entityType,
            entityId=log.entityId,
            description=log.description,
            oldValues=log.oldValues,
            newValues=log.newValues,
            ipAddress=log.ipAddress,
            userAgent=log.userAgent,
            timestamp=log.timestamp,
            createdAt=log.createdAt,
            updatedAt=log.updatedAt
        ))
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return ActivityLogListResponse(
        activityLogs=log_list,
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=total_pages
    )


@router.get("/export")
async def export_activity_logs(
    userId: Optional[int] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    entityType: Optional[str] = Query(None, description="Filter by entity type"),
    startDate: Optional[datetime] = Query(None, description="Filter logs from date"),
    endDate: Optional[datetime] = Query(None, description="Filter logs to date"),
    search: Optional[str] = Query(None, description="Search in description field"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Export activity logs to CSV format.
    
    Admin access only. Applies same filters as GET endpoint.
    """
    import json
    
    query = db.query(ActivityLog)
    
    # Apply same filters as GET endpoint
    if userId:
        query = query.filter(ActivityLog.userId == userId)
    
    if action:
        query = query.filter(ActivityLog.action == action)
    
    if entityType:
        query = query.filter(ActivityLog.entityType == entityType)
    
    if startDate:
        query = query.filter(ActivityLog.timestamp >= startDate)
    
    if endDate:
        query = query.filter(ActivityLog.timestamp <= endDate)
    
    if search:
        query = query.filter(
            ActivityLog.description.contains(search)
        )
    
    # Order by timestamp descending (newest first)
    query = query.order_by(ActivityLog.timestamp.desc())
    
    # Get all matching logs (no pagination for export)
    logs = query.all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID",
        "Timestamp",
        "User ID",
        "User Name",
        "User Full Name",
        "Action",
        "Entity Type",
        "Entity ID",
        "Description",
        "IP Address",
        "User Agent",
        "Old Values",
        "New Values"
    ])
    
    # Write data rows
    for log in logs:
        # Load user relationship
        user = db.query(User).filter(User.id == log.userId).first()
        
        # Parse JSON oldValues/newValues for readable export
        old_values_display = ""
        new_values_display = ""
        
        if log.oldValues:
            try:
                old_values_obj = json.loads(log.oldValues)
                old_values_display = json.dumps(old_values_obj, indent=2)
            except:
                old_values_display = log.oldValues
        
        if log.newValues:
            try:
                new_values_obj = json.loads(log.newValues)
                new_values_display = json.dumps(new_values_obj, indent=2)
            except:
                new_values_display = log.newValues
        
        writer.writerow([
            log.id,
            log.timestamp.isoformat() if log.timestamp else "",
            log.userId,
            user.username if user else "",
            user.fullName if user else "",
            log.action,
            log.entityType,
            log.entityId,
            log.description or "",
            log.ipAddress or "",
            log.userAgent or "",
            old_values_display,
            new_values_display
        ])
    
    output.seek(0)
    
    # Generate filename with timestamp
    filename = f"activity_logs_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    # Return as streaming response
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


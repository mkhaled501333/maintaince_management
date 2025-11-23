"""
Inventory Reports API endpoints.
"""
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from fastapi import status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import csv
import io

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.maintenance_analysis_service import (
    get_stock_levels,
    get_consumption_trends,
    calculate_inventory_valuation,
    get_reorder_report
)
from app.schemas.report import (
    StockLevelsReportResponse,
    ConsumptionReportResponse,
    ValuationReportResponse,
    ReorderReportResponse
)
from app.services.audit_service import log_activity

router = APIRouter()

# Roles that can access inventory reports: Admin and Inventory Manager
INVENTORY_REPORT_ROLES = ["ADMIN", "INVENTORY_MANAGER"]


@router.get("/inventory/stock-levels", response_model=StockLevelsReportResponse)
async def get_inventory_stock_levels(
    groupNumber: Optional[str] = Query(None, description="Filter by group number"),
    groupName: Optional[str] = Query(None, description="Filter by group name"),
    location: Optional[str] = Query(None, description="Filter by location"),
    export: Optional[str] = Query(None, description="Export format: csv or excel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Get stock levels report for all spare parts.
    
    Admin and Inventory Manager access only.
    """
    # Check if user has required role
    if current_user.role not in INVENTORY_REPORT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Get stock levels
    items = get_stock_levels(
        db=db,
        group_number=groupNumber,
        group_name=groupName,
        location=location
    )
    
    # Calculate summary statistics
    critical_count = sum(1 for item in items if item['status'] == 'CRITICAL')
    low_count = sum(1 for item in items if item['status'] == 'LOW')
    
    response = {
        'items': items,
        'totalItems': len(items),
        'criticalCount': critical_count,
        'lowStockCount': low_count
    }
    
    # Log activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="READ",
        entityType="STOCK_LEVELS_REPORT",
        entityId=0,
        description=f"Accessed stock levels report",
        request=request
    )
    db.commit()
    
    # Check if export requested
    if export and export.lower() == 'csv':
        return await _export_stock_levels_csv(response, groupNumber)
    
    return response


@router.get("/inventory/consumption", response_model=ConsumptionReportResponse)
async def get_inventory_consumption(
    dateFrom: Optional[datetime] = Query(None, description="Filter from date"),
    dateTo: Optional[datetime] = Query(None, description="Filter to date"),
    machineId: Optional[int] = Query(None, description="Filter by machine ID"),
    groupNumber: Optional[str] = Query(None, description="Filter by group number"),
    location: Optional[str] = Query(None, description="Filter by location"),
    export: Optional[str] = Query(None, description="Export format: csv or excel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Get consumption report for spare parts.
    
    Admin and Inventory Manager access only.
    """
    # Check if user has required role
    if current_user.role not in INVENTORY_REPORT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Get consumption trends
    result = get_consumption_trends(
        db=db,
        date_from=dateFrom,
        date_to=dateTo,
        machine_id=machineId,
        group_number=groupNumber,
        location=location
    )
    
    # Log activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="READ",
        entityType="CONSUMPTION_REPORT",
        entityId=0,
        description=f"Accessed consumption report",
        request=request
    )
    db.commit()
    
    # Check if export requested
    if export and export.lower() == 'csv':
        return await _export_consumption_csv(result, dateFrom, dateTo)
    
    return result


@router.get("/inventory/valuation", response_model=ValuationReportResponse)
async def get_inventory_valuation(
    groupNumber: Optional[str] = Query(None, description="Filter by group number"),
    export: Optional[str] = Query(None, description="Export format: csv or excel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Get inventory valuation report.
    
    Admin and Inventory Manager access only.
    """
    # Check if user has required role
    if current_user.role not in INVENTORY_REPORT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Get valuation
    result = calculate_inventory_valuation(
        db=db,
        group_number=groupNumber
    )
    
    # Log activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="READ",
        entityType="VALUATION_REPORT",
        entityId=0,
        description=f"Accessed valuation report",
        request=request
    )
    db.commit()
    
    # Check if export requested
    if export and export.lower() == 'csv':
        return await _export_valuation_csv(result)
    
    return result


@router.get("/inventory/reorder", response_model=ReorderReportResponse)
async def get_inventory_reorder(
    groupNumber: Optional[str] = Query(None, description="Filter by group number"),
    location: Optional[str] = Query(None, description="Filter by location"),
    export: Optional[str] = Query(None, description="Export format: csv or excel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Get reorder report for spare parts that need replenishment.
    
    Admin and Inventory Manager access only.
    """
    # Check if user has required role
    if current_user.role not in INVENTORY_REPORT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Get reorder report
    items = get_reorder_report(
        db=db,
        group_number=groupNumber,
        location=location
    )
    
    response = {
        'items': items,
        'totalItems': len(items)
    }
    
    # Log activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="READ",
        entityType="REORDER_REPORT",
        entityId=0,
        description=f"Accessed reorder report",
        request=request
    )
    db.commit()
    
    # Check if export requested
    if export and export.lower() == 'csv':
        return await _export_reorder_csv(response)
    
    return response


# Export helper functions for inventory reports

async def _export_stock_levels_csv(data: dict, group_number: Optional[str]):
    """Export stock levels report to CSV."""
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["Report Type: Stock Levels"])
    if group_number:
        writer.writerow(["Group: {}".format(group_number)])
    writer.writerow([])
    
    # Write summary
    writer.writerow(["Summary"])
    writer.writerow(["Total Items", data['totalItems']])
    writer.writerow(["Critical Count", data['criticalCount']])
    writer.writerow(["Low Stock Count", data['lowStockCount']])
    writer.writerow([])
    
    # Write items
    writer.writerow(["Stock Levels"])
    writer.writerow([
        "Part Number",
        "Part Name",
        "Category Number",
        "Category Name",
        "Location",
        "Quantity",
        "Min Quantity",
        "Max Quantity",
        "Unit Price",
        "Status"
    ])
    for item in data['items']:
        writer.writerow([
            item['partNumber'],
            item['partName'],
            item['categoryNumber'] or '',
            item['categoryName'] or '',
            item['location'] or '',
            item['quantity'],
            item['minQuantity'],
            item['maxQuantity'] or '',
            item['unitPrice'] or '',
            item['status']
        ])
    
    output.seek(0)
    filename = f"stock_levels_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


async def _export_consumption_csv(data: dict, date_from: Optional[datetime], date_to: Optional[datetime]):
    """Export consumption report to CSV."""
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Report Type: Consumption Report",
        "Date Range: {} to {}".format(
            date_from.strftime('%Y-%m-%d') if date_from else "All",
            date_to.strftime('%Y-%m-%d') if date_to else "All"
        )
    ])
    writer.writerow([])
    
    # Write summary
    writer.writerow(["Summary"])
    writer.writerow(["Total Consumption", data['totalConsumption']])
    writer.writerow(["Transaction Count", data['transactionCount']])
    writer.writerow([])
    
    # Write consumption by part
    writer.writerow(["Consumption by Part"])
    writer.writerow([
        "Part Number",
        "Part Name",
        "Category",
        "Location",
        "Quantity Consumed",
        "Total Value"
    ])
    for part in data['byPart']:
        writer.writerow([
            part['partNumber'],
            part['partName'],
            part['categoryName'] or '',
            part['location'] or '',
            part['quantityConsumed'],
            part['totalValue']
        ])
    
    output.seek(0)
    filename = f"consumption_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


async def _export_valuation_csv(data: dict):
    """Export valuation report to CSV."""
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["Report Type: Inventory Valuation"])
    writer.writerow([])
    
    # Write summary
    writer.writerow(["Summary"])
    writer.writerow(["Total Valuation", data['totalValuation']])
    writer.writerow([])
    
    # Write by group
    writer.writerow(["Valuation by Group"])
    writer.writerow([
        "Group Number",
        "Group Name",
        "Total Valuation",
        "Part Count"
    ])
    for group in data['byGroup']:
        writer.writerow([
            group['groupNumber'],
            group['groupName'],
            group['totalValuation'],
            group['partCount']
        ])
    
    output.seek(0)
    filename = f"valuation_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


async def _export_reorder_csv(data: dict):
    """Export reorder report to CSV."""
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["Report Type: Reorder Report"])
    writer.writerow([])
    
    # Write summary
    writer.writerow(["Summary"])
    writer.writerow(["Total Items Needing Reorder", data['totalItems']])
    writer.writerow([])
    
    # Write reorder items
    writer.writerow(["Items Requiring Reorder"])
    writer.writerow([
        "Part Number",
        "Part Name",
        "Category",
        "Location",
        "Current Quantity",
        "Min Quantity",
        "Shortfall",
        "Suggested Reorder Qty",
        "Unit Price",
        "Estimated Cost"
    ])
    for item in data['items']:
        writer.writerow([
            item['partNumber'],
            item['partName'],
            item['categoryName'] or '',
            item['location'] or '',
            item['currentQuantity'],
            item['minQuantity'],
            item['shortfall'],
            item['suggestedReorderQty'],
            item['unitPrice'] or '',
            item['estimatedCost']
        ])
    
    output.seek(0)
    filename = f"reorder_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


"""
Reports API endpoints for maintenance analytics and reporting.
"""
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from fastapi import status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import csv
import io

from app.core.database import get_db
from app.core.deps import get_current_user, require_role_list
from app.models.user import User
from app.services.maintenance_analysis_service import (
    get_downtime_statistics,
    calculate_maintenance_costs,
    analyze_failure_patterns,
    get_stock_levels,
    get_consumption_trends,
    calculate_inventory_valuation,
    get_reorder_report
)
from app.schemas.report import (
    DowntimeReportResponse,
    MaintenanceCostReportResponse,
    FailureAnalysisReportResponse,
    StockLevelsReportResponse,
    ConsumptionReportResponse,
    ValuationReportResponse,
    ReorderReportResponse,
    StockLevelItem,
    ConsumptionItem,
    ValuationByGroup,
    ReorderItem
)
from app.services.audit_service import log_activity

router = APIRouter()

# Roles that can access reports: Admin and Maintenance Manager
REPORT_ALLOWED_ROLES = ["ADMIN", "MAINTENANCE_MANAGER"]

# Roles that can access inventory reports: Admin and Inventory Manager
INVENTORY_REPORT_ROLES = ["ADMIN", "INVENTORY_MANAGER"]


@router.get("/downtime", response_model=DowntimeReportResponse)
async def get_downtime_report(
    machineId: Optional[int] = Query(None, description="Filter by machine ID"),
    departmentId: Optional[int] = Query(None, description="Filter by department ID"),
    startDate: Optional[datetime] = Query(None, description="Filter from date"),
    endDate: Optional[datetime] = Query(None, description="Filter to date"),
    export: Optional[str] = Query(None, description="Export format: csv or excel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Get downtime statistics report.
    
    Admin and Maintenance Manager access only.
    """
    # Check if user has required role
    if current_user.role not in REPORT_ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Get downtime statistics
    stats = get_downtime_statistics(
        db=db,
        machine_id=machineId,
        department_id=departmentId,
        start_date=startDate,
        end_date=endDate
    )
    
    # Log activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="READ",
        entityType="DOWNTIME_REPORT",
        entityId=0,
        description=f"Accessed downtime report",
        request=request
    )
    db.commit()
    
    # Check if export requested
    if export and export.lower() == 'csv':
        return await _export_downtime_csv(stats, startDate, endDate)
    
    return stats


@router.get("/maintenance-costs", response_model=MaintenanceCostReportResponse)
async def get_maintenance_cost_report(
    machineId: Optional[int] = Query(None, description="Filter by machine ID"),
    maintenanceTypeId: Optional[int] = Query(None, description="Filter by maintenance type ID"),
    startDate: Optional[datetime] = Query(None, description="Filter from date"),
    endDate: Optional[datetime] = Query(None, description="Filter to date"),
    export: Optional[str] = Query(None, description="Export format: csv or excel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Get maintenance cost analysis report.
    
    Admin and Maintenance Manager access only.
    """
    # Check if user has required role
    if current_user.role not in REPORT_ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Get cost analysis
    costs = calculate_maintenance_costs(
        db=db,
        machine_id=machineId,
        maintenance_type_id=maintenanceTypeId,
        start_date=startDate,
        end_date=endDate
    )
    
    # Log activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="READ",
        entityType="COST_REPORT",
        entityId=0,
        description=f"Accessed maintenance cost report",
        request=request
    )
    db.commit()
    
    # Check if export requested
    if export and export.lower() == 'csv':
        return await _export_costs_csv(costs, startDate, endDate)
    
    return costs


@router.get("/failure-analysis", response_model=FailureAnalysisReportResponse)
async def get_failure_analysis_report(
    machineId: Optional[int] = Query(None, description="Filter by machine ID"),
    departmentId: Optional[int] = Query(None, description="Filter by department ID"),
    startDate: Optional[datetime] = Query(None, description="Filter from date"),
    endDate: Optional[datetime] = Query(None, description="Filter to date"),
    failureCategory: Optional[str] = Query(None, description="Filter by failure category"),
    export: Optional[str] = Query(None, description="Export format: csv or excel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Get failure analysis report with pattern identification.
    
    Admin and Maintenance Manager access only.
    """
    # Check if user has required role
    if current_user.role not in REPORT_ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Get failure analysis
    analysis = analyze_failure_patterns(
        db=db,
        machine_id=machineId,
        department_id=departmentId,
        start_date=startDate,
        end_date=endDate,
        failure_category=failureCategory
    )
    
    # Log activity
    log_activity(
        db=db,
        userId=current_user.id,
        action="READ",
        entityType="FAILURE_REPORT",
        entityId=0,
        description=f"Accessed failure analysis report",
        request=request
    )
    db.commit()
    
    # Check if export requested
    if export and export.lower() == 'csv':
        return await _export_failure_csv(analysis, startDate, endDate)
    
    return analysis


async def _export_downtime_csv(stats: dict, start_date: Optional[datetime], end_date: Optional[datetime]):
    """Export downtime report to CSV."""
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Report Type: Downtime Statistics",
        "Date Range: {} to {}".format(
            start_date.strftime('%Y-%m-%d') if start_date else "All",
            end_date.strftime('%Y-%m-%d') if end_date else "All"
        )
    ])
    writer.writerow([])
    
    # Write summary
    writer.writerow(["Summary"])
    writer.writerow(["Total Downtime (Hours)", stats['totalDowntimeHours']])
    writer.writerow(["Total Downtime (Minutes)", stats['totalDowntimeMinutes']])
    writer.writerow(["Frequency", stats['frequency']])
    writer.writerow(["Average Downtime (Hours)", stats['avgDowntimeHours']])
    writer.writerow(["Average Downtime (Minutes)", stats['avgDowntimeMinutes']])
    writer.writerow([])
    
    # Write by machine
    writer.writerow(["Downtime by Machine"])
    writer.writerow(["Machine ID", "Machine Name", "Department", "Total Downtime (Hours)", "Frequency", "Avg Downtime (Hours)"])
    for machine in stats['byMachine']:
        writer.writerow([
            machine['machineId'],
            machine['machineName'],
            machine['departmentName'] or '',
            machine['totalDowntime'],
            machine['frequency'],
            machine['avgDowntime']
        ])
    writer.writerow([])
    
    # Write by department
    writer.writerow(["Downtime by Department"])
    writer.writerow(["Department ID", "Department Name", "Total Downtime (Hours)", "Frequency", "Avg Downtime (Hours)"])
    for dept in stats['byDepartment']:
        writer.writerow([
            dept['departmentId'],
            dept['departmentName'] or '',
            dept['totalDowntime'],
            dept['frequency'],
            dept['avgDowntime']
        ])
    
    output.seek(0)
    filename = f"downtime_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


async def _export_costs_csv(costs: dict, start_date: Optional[datetime], end_date: Optional[datetime]):
    """Export maintenance cost report to CSV."""
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Report Type: Maintenance Cost Analysis",
        "Date Range: {} to {}".format(
            start_date.strftime('%Y-%m-%d') if start_date else "All",
            end_date.strftime('%Y-%m-%d') if end_date else "All"
        )
    ])
    writer.writerow([])
    
    # Write summary
    writer.writerow(["Summary"])
    writer.writerow(["Total Parts Cost", costs['totalPartsCost']])
    writer.writerow(["Total Labor Cost", costs['totalLaborCost']])
    writer.writerow(["Total Cost", costs['totalCost']])
    writer.writerow([])
    
    # Write by machine
    writer.writerow(["Costs by Machine"])
    writer.writerow(["Machine ID", "Machine Name", "Parts Cost", "Labor Cost", "Total Cost", "Maintenance Count"])
    for machine in costs['byMachine']:
        writer.writerow([
            machine['machineId'],
            machine['machineName'],
            machine['partsCost'],
            machine['laborCost'],
            machine['totalCost'],
            machine['maintenanceCount']
        ])
    writer.writerow([])
    
    # Write by maintenance type
    writer.writerow(["Costs by Maintenance Type"])
    writer.writerow(["Maintenance Type ID", "Type Name", "Parts Cost", "Labor Cost", "Total Cost", "Maintenance Count"])
    for maint_type in costs['byMaintenanceType']:
        writer.writerow([
            maint_type['maintenanceTypeId'],
            maint_type['maintenanceTypeName'],
            maint_type['partsCost'],
            maint_type['laborCost'],
            maint_type['totalCost'],
            maint_type['maintenanceCount']
        ])
    
    output.seek(0)
    filename = f"maintenance_costs_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


async def _export_failure_csv(analysis: dict, start_date: Optional[datetime], end_date: Optional[datetime]):
    """Export failure analysis report to CSV."""
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Report Type: Failure Analysis",
        "Date Range: {} to {}".format(
            start_date.strftime('%Y-%m-%d') if start_date else "All",
            end_date.strftime('%Y-%m-%d') if end_date else "All"
        )
    ])
    writer.writerow([])
    
    # Write summary
    writer.writerow(["Summary"])
    writer.writerow(["Total Failures", analysis['totalFailures']])
    writer.writerow(["Unique Failure Codes", analysis['uniqueFailureCodes']])
    writer.writerow([])
    
    # Write failure patterns
    writer.writerow(["Failure Patterns"])
    writer.writerow([
        "Failure Code ID",
        "Code",
        "Description",
        "Category",
        "Frequency",
        "Affected Machines",
        "Avg Resolution Time (Minutes)",
        "Resolution Count"
    ])
    for pattern in analysis['failurePatterns']:
        writer.writerow([
            pattern['failureCodeId'],
            pattern['failureCode'],
            pattern['failureDescription'],
            pattern['failureCategory'] or '',
            pattern['frequency'],
            pattern['affectedMachineCount'],
            pattern['avgResolutionTimeMinutes'],
            pattern['resolutionCount']
        ])
    writer.writerow([])
    
    # Write recurring issues
    writer.writerow(["Recurring Issues (Top 10)"])
    writer.writerow([
        "Failure Code ID",
        "Code",
        "Description",
        "Category",
        "Frequency",
        "Affected Machines",
        "Avg Resolution Time (Minutes)"
    ])
    for issue in analysis['recurringIssues']:
        writer.writerow([
            issue['failureCodeId'],
            issue['failureCode'],
            issue['failureDescription'],
            issue['failureCategory'] or '',
            issue['frequency'],
            issue['affectedMachineCount'],
            issue['avgResolutionTimeMinutes']
        ])
    
    output.seek(0)
    filename = f"failure_analysis_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


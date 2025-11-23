"""
Maintenance Analysis Service for analytics and reporting.

This service provides helper functions for generating maintenance analytics
including downtime calculations, cost analysis, and failure pattern analysis.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_

from app.models.machine_downtime import MachineDowntime
from app.models.maintenance_request import MaintenanceRequest
from app.models.maintenance_work import MaintenanceWork
from app.models.inventory_transaction import InventoryTransaction
from app.models.machine import Machine
from app.models.failure_code import FailureCode
from app.models.department import Department
from app.models.spare_part import SparePart
from app.models.spare_part_category import SparePartCategory


def get_downtime_statistics(
    db: Session,
    machine_id: Optional[int] = None,
    department_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Calculate downtime statistics for machines and departments.
    
    Returns:
        Dictionary with total downtime (in hours), average downtime, 
        frequency (number of downtime events), and grouped data.
    """
    query = db.query(MachineDowntime)
    
    # Apply filters
    if machine_id:
        query = query.filter(MachineDowntime.machineId == machine_id)
    
    if start_date:
        query = query.filter(MachineDowntime.startTime >= start_date)
    
    if end_date:
        query = query.filter(MachineDowntime.startTime <= end_date)
    
    # If filtering by department, join with Machine table
    if department_id:
        query = query.join(Machine).filter(Machine.departmentId == department_id)
    
    # Get all downtime records
    downtimes = query.join(Machine).join(Department).all()
    
    # Calculate statistics
    total_downtime = sum(dt.duration or 0 for dt in downtimes)
    frequency = len(downtimes)
    avg_downtime = total_downtime / frequency if frequency > 0 else 0
    
    # Group by machine
    machine_stats = {}
    for dt in downtimes:
        machine = dt.machine
        if machine.id not in machine_stats:
            machine_stats[machine.id] = {
                'machineId': machine.id,
                'machineName': machine.name,
                'departmentId': machine.departmentId,
                'departmentName': machine.department.name if machine.department else None,
                'totalDowntime': 0,
                'frequency': 0,
                'avgDowntime': 0
            }
        machine_stats[machine.id]['totalDowntime'] += dt.duration or 0
        machine_stats[machine.id]['frequency'] += 1
    
    # Calculate averages for each machine
    for stats in machine_stats.values():
        if stats['frequency'] > 0:
            stats['avgDowntime'] = stats['totalDowntime'] / stats['frequency']
    
    # Group by department
    department_stats = {}
    for dt in downtimes:
        machine = dt.machine
        dept_id = machine.departmentId
        if dept_id not in department_stats:
            department = machine.department
            department_stats[dept_id] = {
                'departmentId': dept_id,
                'departmentName': department.name if department else None,
                'totalDowntime': 0,
                'frequency': 0,
                'avgDowntime': 0
            }
        department_stats[dept_id]['totalDowntime'] += dt.duration or 0
        department_stats[dept_id]['frequency'] += 1
    
    # Calculate averages for each department
    for stats in department_stats.values():
        if stats['frequency'] > 0:
            stats['avgDowntime'] = stats['totalDowntime'] / stats['frequency']
    
    return {
        'totalDowntimeHours': total_downtime,
        'totalDowntimeMinutes': total_downtime * 60,
        'frequency': frequency,
        'avgDowntimeHours': avg_downtime,
        'avgDowntimeMinutes': avg_downtime * 60,
        'byMachine': list(machine_stats.values()),
        'byDepartment': list(department_stats.values())
    }


def calculate_maintenance_costs(
    db: Session,
    machine_id: Optional[int] = None,
    maintenance_type_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Calculate maintenance costs from inventory transactions and labor.
    
    Returns:
        Dictionary with total costs, costs by machine, costs by maintenance type,
        and detailed breakdown (parts vs labor).
    """
    # Get OUT transactions for maintenance
    query = db.query(InventoryTransaction).filter(
        InventoryTransaction.transactionType == 'OUT',
        InventoryTransaction.referenceType == 'MAINTENANCE_WORK'
    )
    
    if start_date:
        query = query.filter(InventoryTransaction.transactionDate >= start_date)
    
    if end_date:
        query = query.filter(InventoryTransaction.transactionDate <= end_date)
    
    transactions = query.all()
    
    # Calculate total parts cost
    total_parts_cost = sum(tx.totalValue or 0 for tx in transactions)
    
    # Get maintenance work records for labor costs
    work_query = db.query(MaintenanceWork)
    
    if machine_id:
        work_query = work_query.filter(MaintenanceWork.machineId == machine_id)
    
    if maintenance_type_id:
        work_query = work_query.filter(MaintenanceWork.maintenanceTypeId == maintenance_type_id)
    
    if start_date:
        work_query = work_query.filter(MaintenanceWork.startTime >= start_date)
    
    if end_date:
        work_query = work_query.filter(MaintenanceWork.endTime <= end_date)
    
    work_records = work_query.all()
    
    # Calculate total labor cost
    total_labor_cost = sum(work.laborCost or 0 for work in work_records)
    total_cost = total_parts_cost + total_labor_cost
    
    # Group by machine
    machine_costs = {}
    for work in work_records:
        machine = work.machine
        if machine.id not in machine_costs:
            machine_costs[machine.id] = {
                'machineId': machine.id,
                'machineName': machine.name,
                'partsCost': 0,
                'laborCost': 0,
                'totalCost': 0,
                'maintenanceCount': 0
            }
        machine_costs[machine.id]['laborCost'] += work.laborCost or 0
        machine_costs[machine.id]['maintenanceCount'] += 1
    
    # Add parts costs from transactions
    for tx in transactions:
        if tx.referenceNumber:
            # Try to get maintenance work from reference
            work = db.query(MaintenanceWork).filter_by(id=int(tx.referenceNumber)).first()
            if work and work.machineId:
                if work.machineId not in machine_costs:
                    machine = work.machine
                    machine_costs[work.machineId] = {
                        'machineId': machine.id,
                        'machineName': machine.name,
                        'partsCost': 0,
                        'laborCost': 0,
                        'totalCost': 0,
                        'maintenanceCount': 0
                    }
                machine_costs[work.machineId]['partsCost'] += tx.totalValue or 0
    
    # Calculate totals for each machine
    for stats in machine_costs.values():
        stats['totalCost'] = stats['partsCost'] + stats['laborCost']
    
    # Group by maintenance type
    type_costs = {}
    for work in work_records:
        if work.maintenanceTypeId:
            maint_type = work.maintenanceType
            if maint_type.id not in type_costs:
                type_costs[maint_type.id] = {
                    'maintenanceTypeId': maint_type.id,
                    'maintenanceTypeName': maint_type.name,
                    'partsCost': 0,
                    'laborCost': 0,
                    'totalCost': 0,
                    'maintenanceCount': 0
                }
            type_costs[maint_type.id]['laborCost'] += work.laborCost or 0
            type_costs[maint_type.id]['maintenanceCount'] += 1
    
    # Add parts costs by type
    for tx in transactions:
        if tx.referenceNumber:
            work = db.query(MaintenanceWork).filter_by(id=int(tx.referenceNumber)).first()
            if work and work.maintenanceTypeId:
                if work.maintenanceTypeId not in type_costs:
                    maint_type = work.maintenanceType
                    type_costs[work.maintenanceTypeId] = {
                        'maintenanceTypeId': maint_type.id,
                        'maintenanceTypeName': maint_type.name,
                        'partsCost': 0,
                        'laborCost': 0,
                        'totalCost': 0,
                        'maintenanceCount': 0
                    }
                type_costs[work.maintenanceTypeId]['partsCost'] += tx.totalValue or 0
    
    # Calculate totals for each type
    for stats in type_costs.values():
        stats['totalCost'] = stats['partsCost'] + stats['laborCost']
    
    return {
        'totalPartsCost': total_parts_cost,
        'totalLaborCost': total_labor_cost,
        'totalCost': total_cost,
        'byMachine': list(machine_costs.values()),
        'byMaintenanceType': list(type_costs.values())
    }


def analyze_failure_patterns(
    db: Session,
    machine_id: Optional[int] = None,
    department_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    failure_category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze failure patterns by grouping maintenance requests by failure codes.
    
    Returns:
        Dictionary with failure patterns, frequency counts, average resolution times,
        and recurring issues identification.
    """
    # Get maintenance requests with failure codes
    query = db.query(MaintenanceRequest).join(FailureCode).filter(
        MaintenanceRequest.failureCodeId.isnot(None)
    )
    
    # Apply filters
    if machine_id:
        query = query.filter(MaintenanceRequest.machineId == machine_id)
    
    if start_date:
        query = query.filter(MaintenanceRequest.requestedDate >= start_date)
    
    if end_date:
        query = query.filter(MaintenanceRequest.requestedDate <= end_date)
    
    if failure_category:
        query = query.filter(FailureCode.category == failure_category)
    
    # If filtering by department, join with Machine table
    if department_id:
        query = query.join(Machine).filter(Machine.departmentId == department_id)
    
    requests = query.all()
    
    # Group by failure code
    failure_patterns = {}
    for request in requests:
        failure_code = request.failureCode
        code_id = failure_code.id
        
        if code_id not in failure_patterns:
            failure_patterns[code_id] = {
                'failureCodeId': failure_code.id,
                'failureCode': failure_code.code,
                'failureDescription': failure_code.description,
                'failureCategory': failure_code.category,
                'frequency': 0,
                'affectedMachines': set(),
                'totalResolutionTime': 0,
                'avgResolutionTimeMinutes': 0,
                'resolutionCount': 0
            }
        
        failure_patterns[code_id]['frequency'] += 1
        failure_patterns[code_id]['affectedMachines'].add(request.machineId)
        
        # Calculate resolution time if work completed
        if request.status == 'COMPLETED' and request.maintenanceWorks:
            work = request.maintenanceWorks[0]  # Get first work record
            if work.startTime and work.endTime:
                resolution_time = (work.endTime - request.requestedDate).total_seconds() / 60
                failure_patterns[code_id]['totalResolutionTime'] += resolution_time
                failure_patterns[code_id]['resolutionCount'] += 1
    
    # Convert sets to lists and calculate averages
    for pattern in failure_patterns.values():
        pattern['affectedMachineCount'] = len(pattern['affectedMachines'])
        pattern['affectedMachines'] = list(pattern['affectedMachines'])
        if pattern['resolutionCount'] > 0:
            pattern['avgResolutionTimeMinutes'] = pattern['totalResolutionTime'] / pattern['resolutionCount']
    
    # Sort by frequency (most common first)
    sorted_patterns = sorted(
        failure_patterns.values(),
        key=lambda x: x['frequency'],
        reverse=True
    )
    
    # Identify recurring issues (top 10 by frequency)
    recurring_issues = sorted_patterns[:10] if len(sorted_patterns) >= 10 else sorted_patterns
    
    return {
        'totalFailures': len(requests),
        'uniqueFailureCodes': len(failure_patterns),
        'failurePatterns': sorted_patterns,
        'recurringIssues': recurring_issues
    }


# =============================================================================
# Inventory Analysis Functions
# =============================================================================

def get_stock_levels(
    db: Session,
    group_number: Optional[str] = None,
    group_name: Optional[str] = None,
    location: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get current stock levels for spare parts.
    
    Returns:
        List of dictionaries with part information and stock levels.
    """
    query = (
        db.query(SparePart)
        .options(joinedload(SparePart.category))
        .outerjoin(SparePartCategory)
        .filter(SparePart.isActive == True)
    )
    
    # Apply filters
    if group_number:
        query = query.filter(SparePartCategory.code == group_number)
    
    if group_name:
        query = query.filter(SparePartCategory.name == group_name)
    
    if location:
        query = query.filter(SparePart.location == location)
    
    parts = query.all()
    
    result = []
    for part in parts:
        result.append({
            'id': part.id,
            'partNumber': part.partNumber,
            'partName': part.partName,
            'description': part.description,
            'categoryNumber': part.category.code if part.category else None,
            'categoryName': part.category.name if part.category else None,
            'quantity': part.currentStock,
            'minQuantity': part.minimumStock,
            'maxQuantity': part.maximumStock,
            'unitPrice': part.unitPrice,
            'location': part.location,
            'status': _calculate_stock_status(part.currentStock, part.minimumStock, part.maximumStock)
        })
    
    return result


def get_consumption_trends(
    db: Session,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    machine_id: Optional[int] = None,
    group_number: Optional[str] = None,
    location: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get consumption trends for spare parts from transactions.
    
    Returns:
        Dictionary with consumption data and trend series.
    """
    # Get OUT transactions for consumption
    query = db.query(InventoryTransaction).filter(
        InventoryTransaction.transactionType == 'OUT'
    )
    
    if date_from:
        query = query.filter(InventoryTransaction.transactionDate >= date_from)
    
    if date_to:
        query = query.filter(InventoryTransaction.transactionDate <= date_to)
    
    # Filter by machine if provided (via referenceNumber)
    if machine_id:
        # This is a simplified approach - in a real system, you'd join through maintenance requests
        pass
    
    transactions = (
        query.join(InventoryTransaction.sparePart)
        .outerjoin(SparePartCategory)
        .options(joinedload(InventoryTransaction.sparePart).joinedload(SparePart.category))
        .all()
    )
    
    # Apply additional filters
    if group_number:
        transactions = [t for t in transactions if (t.sparePart.category.code if t.sparePart.category else None) == group_number]
    
    if location:
        transactions = [t for t in transactions if t.sparePart.location == location]
    
    # Group by spare part
    part_consumption = {}
    total_consumption = 0
    
    for tx in transactions:
        part = tx.sparePart
        part_id = part.id
        
        if part_id not in part_consumption:
            part_consumption[part_id] = {
                'partId': part.id,
                'partNumber': part.partNumber,
                'partName': part.partName,
                'categoryNumber': part.category.code if part.category else None,
                'categoryName': part.category.name if part.category else None,
                'location': part.location,
                'quantityConsumed': 0,
                'totalValue': 0
            }
        
        part_consumption[part_id]['quantityConsumed'] += tx.quantity
        part_consumption[part_id]['totalValue'] += tx.totalValue or 0
        total_consumption += tx.quantity
    
    return {
        'totalConsumption': total_consumption,
        'byPart': list(part_consumption.values()),
        'transactionCount': len(transactions)
    }


def calculate_inventory_valuation(
    db: Session,
    group_number: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculate current inventory valuation.
    
    Returns:
        Dictionary with valuation data grouped by category.
    """
    query = (
        db.query(SparePart)
        .options(joinedload(SparePart.category))
        .outerjoin(SparePartCategory)
        .filter(SparePart.isActive == True)
    )
    
    if group_number:
        query = query.filter(SparePartCategory.code == group_number)
    
    parts = query.all()
    
    total_valuation = 0
    by_group = {}
    
    for part in parts:
        valuation = (part.currentStock or 0) * (part.unitPrice or 0)
        total_valuation += valuation
        
        group_key = (part.category.code if part.category else None) or 'Other'
        group_name = (part.category.name if part.category else None) or 'Other'
        
        if group_key not in by_group:
            by_group[group_key] = {
                'groupNumber': group_key,
                'groupName': group_name,
                'totalValuation': 0,
                'partCount': 0
            }
        
        by_group[group_key]['totalValuation'] += valuation
        by_group[group_key]['partCount'] += 1
    
    return {
        'totalValuation': total_valuation,
        'byGroup': list(by_group.values())
    }


def get_reorder_report(
    db: Session,
    group_number: Optional[str] = None,
    location: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Identify parts that need reordering (current quantity < minimum quantity).
    
    Returns:
        List of dictionaries with part information and reorder suggestions.
    """
    query = (
        db.query(SparePart)
        .options(joinedload(SparePart.category))
        .outerjoin(SparePartCategory)
        .filter(
        SparePart.isActive == True,
        SparePart.currentStock < SparePart.minimumStock
        )
    )
    
    if group_number:
        query = query.filter(SparePartCategory.code == group_number)
    
    if location:
        query = query.filter(SparePart.location == location)
    
    parts = query.all()
    
    result = []
    for part in parts:
        suggested_qty = part.minimumStock * 2  # Suggest reorder to 2x minimum
        shortfall = part.minimumStock - part.currentStock
        
        result.append({
            'id': part.id,
            'partNumber': part.partNumber,
            'partName': part.partName,
            'categoryNumber': part.category.code if part.category else None,
            'categoryName': part.category.name if part.category else None,
            'location': part.location,
            'currentQuantity': part.currentStock,
            'minQuantity': part.minimumStock,
            'shortfall': shortfall,
            'suggestedReorderQty': suggested_qty,
            'unitPrice': part.unitPrice,
            'estimatedCost': suggested_qty * (part.unitPrice or 0)
        })
    
    # Sort by severity (largest shortfall first)
    result.sort(key=lambda x: x['shortfall'], reverse=True)
    
    return result


def _calculate_stock_status(current: int, minimum: int, maximum: Optional[int]) -> str:
    """Calculate stock status based on quantities."""
    if current < minimum:
        return 'CRITICAL'
    elif current < minimum * 1.5:
        return 'LOW'
    elif maximum and current > maximum:
        return 'EXCESS'
    else:
        return 'ADEQUATE'


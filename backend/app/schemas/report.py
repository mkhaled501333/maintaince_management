"""
Report schemas for maintenance analytics and reporting.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


# =============================================================================
# Inventory Report Schemas
# =============================================================================

class StockLevelItem(BaseModel):
    id: int
    partNumber: str
    partName: str
    description: Optional[str]
    categoryNumber: Optional[str]
    categoryName: Optional[str]
    quantity: int
    minQuantity: int
    maxQuantity: Optional[int]
    unitPrice: Optional[float]
    location: Optional[str]
    status: str  # CRITICAL, LOW, ADEQUATE, EXCESS

class StockLevelsReportResponse(BaseModel):
    items: List[StockLevelItem]
    totalItems: int
    criticalCount: int
    lowStockCount: int


class ConsumptionItem(BaseModel):
    partId: int
    partNumber: str
    partName: str
    categoryNumber: Optional[str]
    categoryName: Optional[str]
    location: Optional[str]
    quantityConsumed: int
    totalValue: float

class ConsumptionReportResponse(BaseModel):
    totalConsumption: int
    byPart: List[ConsumptionItem]
    transactionCount: int


class ValuationByGroup(BaseModel):
    groupNumber: str
    groupName: str
    totalValuation: float
    partCount: int

class ValuationReportResponse(BaseModel):
    totalValuation: float
    byGroup: List[ValuationByGroup]


class ReorderItem(BaseModel):
    id: int
    partNumber: str
    partName: str
    categoryNumber: Optional[str]
    categoryName: Optional[str]
    location: Optional[str]
    currentQuantity: int
    minQuantity: int
    shortfall: int
    suggestedReorderQty: int
    unitPrice: Optional[float]
    estimatedCost: float

class ReorderReportResponse(BaseModel):
    items: List[ReorderItem]
    totalItems: int


# =============================================================================
# Maintenance Report Schemas
# =============================================================================

# Downtime Report Schemas
class MachineDowntimeStats(BaseModel):
    machineId: int
    machineName: str
    departmentId: int
    departmentName: Optional[str]
    totalDowntime: float
    frequency: int
    avgDowntime: float

class DepartmentDowntimeStats(BaseModel):
    departmentId: int
    departmentName: Optional[str]
    totalDowntime: float
    frequency: int
    avgDowntime: float

class DowntimeReportResponse(BaseModel):
    totalDowntimeHours: float
    totalDowntimeMinutes: float
    frequency: int
    avgDowntimeHours: float
    avgDowntimeMinutes: float
    byMachine: List[MachineDowntimeStats]
    byDepartment: List[DepartmentDowntimeStats]


# Maintenance Cost Report Schemas
class MachineCostStats(BaseModel):
    machineId: int
    machineName: str
    partsCost: float
    laborCost: float
    totalCost: float
    maintenanceCount: int

class MaintenanceTypeCostStats(BaseModel):
    maintenanceTypeId: int
    maintenanceTypeName: str
    partsCost: float
    laborCost: float
    totalCost: float
    maintenanceCount: int

class MaintenanceCostReportResponse(BaseModel):
    totalPartsCost: float
    totalLaborCost: float
    totalCost: float
    byMachine: List[MachineCostStats]
    byMaintenanceType: List[MaintenanceTypeCostStats]


# Failure Analysis Report Schemas
class FailurePattern(BaseModel):
    failureCodeId: int
    failureCode: str
    failureDescription: str
    failureCategory: Optional[str]
    frequency: int
    affectedMachineCount: int
    affectedMachines: List[int]
    avgResolutionTimeMinutes: float
    resolutionCount: int

class FailureAnalysisReportResponse(BaseModel):
    totalFailures: int
    uniqueFailureCodes: int
    failurePatterns: List[FailurePattern]
    recurringIssues: List[FailurePattern]


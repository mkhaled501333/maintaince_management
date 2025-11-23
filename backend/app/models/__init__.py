# Import all models to ensure they are registered with SQLAlchemy
from app.models.base import BaseModel
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.machine import Machine
from app.models.maintenance_request import MaintenanceRequest, RequestPriority, RequestStatus
from app.models.maintenance_work import MaintenanceWork, WorkStatus
from app.models.spare_part_category import SparePartCategory
from app.models.spare_part import SparePart
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.models.attachment import Attachment
from app.models.failure_code import FailureCode
from app.models.maintenance_type import MaintenanceType
from app.models.machine_spare_part import MachineSparePart
from app.models.machine_downtime import MachineDowntime
from app.models.activity_log import ActivityLog
from app.models.preventive_maintenance_task import PreventiveMaintenanceTask
from app.models.preventive_maintenance_log import PreventiveMaintenanceLog
from app.models.spare_parts_request import SparePartsRequest, SparePartsRequestStatus

# Export all models
__all__ = [
    "BaseModel",
    "User",
    "UserRole", 
    "Department",
    "Machine",
    "MaintenanceRequest",
    "RequestPriority",
    "RequestStatus",
    "MaintenanceWork",
    "WorkStatus",
    "SparePartCategory",
    "SparePart",
    "InventoryTransaction",
    "TransactionType",
    "Attachment",
    "FailureCode",
    "MaintenanceType",
    "MachineSparePart",
    "MachineDowntime",
    "ActivityLog",
    "PreventiveMaintenanceTask",
    "PreventiveMaintenanceLog",
    "SparePartsRequest",
    "SparePartsRequestStatus",
]
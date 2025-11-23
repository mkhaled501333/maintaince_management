from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    users,
    departments,
    machines,
    maintenance_requests,
    maintenance_work,
    failure_codes,
    maintenance_types,
    spare_parts,
    spare_part_categories,
    inventory_transactions,
    spare_parts_requests,
    attachments,
    activity_logs,
    reports,
    inventory_reports,
)

api_router = APIRouter()

# Include health check endpoint
api_router.include_router(health.router, prefix="/health", tags=["health"])

# Include authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include user management endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Include department management endpoints
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])

# Include machine management endpoints
api_router.include_router(machines.router, prefix="/machines", tags=["machines"])

# Include maintenance request endpoints
api_router.include_router(maintenance_requests.router, prefix="/maintenance-requests", tags=["maintenance-requests"])

# Include maintenance work endpoints
api_router.include_router(maintenance_work.router, prefix="/maintenance-work", tags=["maintenance-work"])

# Include failure codes endpoints
api_router.include_router(failure_codes.router, prefix="/failure-codes", tags=["failure-codes"])

# Include maintenance types endpoints
api_router.include_router(maintenance_types.router, prefix="/maintenance-types", tags=["maintenance-types"])

# Include spare parts endpoints
api_router.include_router(spare_parts.router, prefix="/spare-parts", tags=["spare-parts"])

# Include spare part categories endpoints
api_router.include_router(spare_part_categories.router, prefix="/spare-part-categories", tags=["spare-part-categories"])

# Include inventory transactions endpoints
api_router.include_router(inventory_transactions.router, prefix="/inventory-transactions", tags=["inventory-transactions"])

# Include spare parts requests endpoints
api_router.include_router(spare_parts_requests.router, prefix="/spare-parts-requests", tags=["spare-parts-requests"])

# Include attachments endpoints
api_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])

# Include activity logs endpoints
api_router.include_router(activity_logs.router, prefix="/activity-logs", tags=["activity-logs"])

# Include reports endpoints
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])

# Include inventory reports endpoints
api_router.include_router(inventory_reports.router, prefix="/reports", tags=["inventory-reports"])

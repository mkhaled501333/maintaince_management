from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def health_check():
    return {"status": "healthy", "service": "maintenance-management-api"}

@router.get("/detailed")
async def detailed_health_check():
    return {
        "status": "healthy",
        "service": "maintenance-management-api",
        "version": "1.0.0",
        "database": "connected",  # This will be updated when we add DB health checks
    }

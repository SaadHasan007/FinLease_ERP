"""Health check endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_db

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """Liveness probe — confirms the application is running."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/health/readiness")
async def readiness_check(db: AsyncSession = Depends(get_db)) -> dict:
    """Readiness probe — confirms database connectivity."""
    checks = {"database": "unhealthy"}
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception:
        pass

    overall = "healthy" if all(v == "healthy" for v in checks.values()) else "unhealthy"
    return {"status": overall, "checks": checks}

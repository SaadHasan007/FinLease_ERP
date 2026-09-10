"""API endpoints for AI services."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

from app.core.dependencies import get_db, require_role

from app.services.ai_service import AIService
from app.models.user import User

router = APIRouter()

@router.post("/credit-risk/{application_id}", response_model=Dict[str, Any])
async def assess_credit_risk(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "MANAGER", "RISK_ANALYST"]))
):
    """Assess credit risk using AI models."""
    service = AIService(db)
    try:
        result = await service.assess_credit_risk(application_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/forecast/cash-flow", response_model=List[Dict[str, Any]])
async def forecast_cash_flows(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "MANAGER", "RISK_ANALYST"]))
):
    """Forecast future cash flows."""
    service = AIService(db)
    try:
        result = await service.forecast_cash_flows()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

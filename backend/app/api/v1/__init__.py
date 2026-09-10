"""API v1 router aggregation."""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.users import router as users_router
from app.api.v1.customers import router as customers_router
from app.api.v1.assets import router as assets_router
from app.api.v1.applications import router as applications_router
from app.api.v1.contracts import router as contracts_router
from app.api.v1.payments import router as payments_router
from app.api.v1.accounting import router as accounting_router
from app.api.v1.collections import router as collections_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.ai import router as ai_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router, tags=["Health"])
api_v1_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(users_router, prefix="/users", tags=["Users"])
api_v1_router.include_router(applications_router, prefix="/applications", tags=["Applications"])
api_v1_router.include_router(contracts_router, prefix="/contracts", tags=["Contracts"])
api_v1_router.include_router(payments_router, prefix="/payments", tags=["Payments"])
api_v1_router.include_router(customers_router, prefix="/customers", tags=["customers"])
api_v1_router.include_router(assets_router, prefix="/assets", tags=["assets"])
api_v1_router.include_router(accounting_router, prefix="/accounting", tags=["Accounting"])
api_v1_router.include_router(collections_router, prefix="/collections", tags=["Collections"])
api_v1_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_v1_router.include_router(ai_router, prefix="/ai", tags=["AI & Machine Learning"])

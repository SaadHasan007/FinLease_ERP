"""Centralized exception hierarchy for FinLease."""
from typing import Any

from fastapi import Request, status
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        code: str = "SYS_500",
        message: str = "An internal error occurred.",
        details: list[dict[str, Any]] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found."""

    def __init__(self, entity: str, entity_id: Any = None) -> None:
        detail = f"{entity} not found"
        if entity_id:
            detail = f"{entity} with id '{entity_id}' not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code=f"{entity.upper()[:4]}_001",
            message=detail,
        )


class UnauthorizedException(AppException):
    """Authentication failure."""

    def __init__(self, message: str = "Invalid credentials.") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="AUTH_001",
            message=message,
        )


class ForbiddenException(AppException):
    """Authorization failure."""

    def __init__(self, message: str = "Insufficient permissions.") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="AUTH_003",
            message=message,
        )


class ValidationException(AppException):
    """Business validation failure."""

    def __init__(
        self,
        message: str = "Validation failed.",
        details: list[dict[str, Any]] | None = None,
        code: str = "VALIDATION_ERROR",
    ) -> None:
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=code,
            message=message,
            details=details,
        )


class ConflictException(AppException):
    """Resource conflict (duplicate, stale version, etc.)."""

    def __init__(self, message: str = "Resource conflict.", code: str = "CONFLICT") -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code=code,
            message=message,
        )


class BusinessRuleException(AppException):
    """Business rule violation."""

    def __init__(self, message: str, code: str = "BUSINESS_RULE") -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code=code,
            message=message,
        )


# ---------------------------------------------------------------------------
# Global exception handlers — register in main.py
# ---------------------------------------------------------------------------

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle all custom AppException subclasses."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled exceptions — never leak stack traces."""
    import logging
    logger = logging.getLogger("finlease")
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "SYS_500",
                "message": "An internal server error occurred.",
                "details": [],
            },
        },
    )

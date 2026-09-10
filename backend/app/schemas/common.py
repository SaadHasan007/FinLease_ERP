"""Shared response schemas and pagination utilities."""
from typing import Any, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Pagination metadata included in list responses."""
    page: int = Field(ge=1, description="Current page number")
    limit: int = Field(ge=1, le=100, description="Items per page")
    total: int = Field(ge=0, description="Total items across all pages")
    total_pages: int = Field(ge=0, description="Total number of pages")


class SuccessResponse(BaseModel):
    """Standard successful response."""
    success: bool = True
    data: Any = None
    meta: PaginationMeta | None = None


class ErrorDetail(BaseModel):
    """Individual error detail."""
    field: str | None = None
    issue: str


class ErrorBody(BaseModel):
    """Error body within the response envelope."""
    code: str
    message: str
    details: list[ErrorDetail] = []


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: ErrorBody


class MessageResponse(BaseModel):
    """Simple message response."""
    success: bool = True
    message: str


class PaginationParams(BaseModel):
    """Query parameters for pagination."""
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit

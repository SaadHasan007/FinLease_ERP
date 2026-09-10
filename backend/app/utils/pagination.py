"""Pagination utilities."""
import math
from typing import Any, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.common import PaginationMeta

T = TypeVar("T")


async def paginate(
    session: AsyncSession,
    query: Select,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Any], PaginationMeta]:
    """Apply pagination to a SQLAlchemy query and return results + metadata."""
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Apply offset/limit
    offset = (page - 1) * limit
    paginated_query = query.offset(offset).limit(limit)
    result = await session.execute(paginated_query)
    items = list(result.scalars().all())

    meta = PaginationMeta(
        page=page,
        limit=limit,
        total=total,
        total_pages=math.ceil(total / limit) if limit > 0 else 0,
    )
    return items, meta

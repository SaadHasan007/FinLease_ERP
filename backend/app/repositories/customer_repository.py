from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository
from app.models.customer import Customer

class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, session: AsyncSession):
        super().__init__(Customer, session)

    async def get_by_email(self, email: str) -> Customer | None:
        """Find customer by email."""
        result = await self.session.execute(
            select(Customer).where(Customer.email == email, Customer.is_deleted == False)  # noqa: E712
        )
        return result.scalar_one_or_none()

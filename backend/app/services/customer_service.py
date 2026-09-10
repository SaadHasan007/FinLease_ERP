from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.repositories.customer_repository import CustomerRepository

class CustomerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = CustomerRepository(Customer, session)

    async def get(self, id: UUID) -> Optional[Customer]:
        return await self.repository.get_by_id( id)

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[Customer]:
        return await self.repository.get_all( skip=skip, limit=limit)

    async def create(self, obj_in: CustomerCreate) -> Customer:
        return await self.repository.create( obj_in=obj_in)

    async def update(self, db_obj: Customer, obj_in: CustomerUpdate) -> Customer:
        return await self.repository.update( db_obj=db_obj, obj_in=obj_in)

    async def delete(self, id: UUID) -> Optional[Customer]:
        return await self.repository.delete( id=id)


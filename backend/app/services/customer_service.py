from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.repositories.customer_repository import CustomerRepository

class CustomerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = CustomerRepository(session)

    async def get(self, id: UUID) -> Optional[Customer]:
        return await self.repository.get_by_id(id)

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[Customer]:
        return await self.repository.get_all(offset=skip, limit=limit)

    async def create(self, obj_in: CustomerCreate) -> Customer:
        existing = await self.repository.get_by_email(obj_in.email)
        if existing:
            raise ConflictException(
                message=f"Customer with email '{obj_in.email}' already exists.",
                code="CUSTOMER_001",
            )
        db_obj = Customer(**obj_in.model_dump(exclude_unset=True))
        return await self.repository.create(entity=db_obj)

    async def update(self, id: UUID, obj_in: CustomerUpdate) -> Optional[Customer]:
        db_obj = await self.get(id)
        if not db_obj:
            return None
        if obj_in.email and obj_in.email != db_obj.email:
            existing = await self.repository.get_by_email(obj_in.email)
            if existing and existing.id != id:
                raise ConflictException(
                    message=f"Customer with email '{obj_in.email}' already exists.",
                    code="CUSTOMER_001",
                )
        for key, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, key, value)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, id: UUID) -> Optional[Customer]:
        db_obj = await self.get(id)
        if not db_obj:
            return None
        success = await self.repository.soft_delete(entity_id=id)
        return db_obj if success else None


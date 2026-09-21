"""Create a self-contained SQLite database for local development."""
import asyncio
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.core.security import hash_password
from app.models.base import Base
from app.models.user import Role, User
import app.db.base  # noqa: F401 - register all models with Base.metadata

DATABASE_URL = "sqlite+aiosqlite:///./.finlease-local.db"


async def bootstrap() -> None:
    engine = create_async_engine(DATABASE_URL)
    sqlite_defaults = []
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if column.server_default is not None:
                sqlite_defaults.append((column, column.server_default))
                column.server_default = None

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        role = (
            await session.execute(select(Role).where(Role.name == "SUPER_ADMIN"))
        ).scalar_one_or_none()
        if role is None:
            role = Role(
                name="SUPER_ADMIN",
                description="Full system access",
                is_system=True,
            )
            session.add(role)
            await session.flush()

        user = (
            await session.execute(
                select(User).where(User.email == "admin@finlease.com")
            )
        ).scalar_one_or_none()
        if user is None:
            user = User(
                email="admin@finlease.com",
                password_hash=hash_password("Admin@123!"),
                first_name="Super",
                last_name="Admin",
                status="ACTIVE",
                roles=[role],
            )
            session.add(user)
        await session.commit()

    await engine.dispose()
    for column, server_default in sqlite_defaults:
        column.server_default = server_default
    print("Local SQLite database ready: admin@finlease.com")


if __name__ == "__main__":
    asyncio.run(bootstrap())

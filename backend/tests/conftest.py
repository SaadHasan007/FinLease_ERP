"""Global test fixtures for FinLease backend tests."""
import asyncio
import os
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.session import get_async_session
from app.main import app
from app.models.base import Base
from app.models.user import Role, User

# SQLite keeps the BDD suite self-contained. Set TEST_DATABASE_URL to use a
# PostgreSQL test database when production-specific database behavior is needed.
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite+aiosqlite:///./.pytest-finlease.db",
)
test_engine_kwargs = {"echo": False}
if TEST_DATABASE_URL.startswith("sqlite"):
    test_engine_kwargs["connect_args"] = {"check_same_thread": False}
test_engine = create_async_engine(TEST_DATABASE_URL, **test_engine_kwargs)
test_session_factory = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Create all tables before tests and drop after."""
    sqlite_defaults = []
    if TEST_DATABASE_URL.startswith("sqlite"):
        for table in Base.metadata.tables.values():
            for column in table.columns:
                if column.server_default is not None:
                    sqlite_defaults.append((column, column.server_default))
                    column.server_default = None
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()
    for column, server_default in sqlite_defaults:
        column.server_default = server_default


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional test database session (rolled back after test)."""
    async with test_session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP test client with overridden DB session."""

    async def _override_get_session():
        yield db_session

    app.dependency_overrides[get_async_session] = _override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def seed_roles(db_session: AsyncSession) -> list[Role]:
    """Seed default roles into the test database."""
    role_names = [
        "SUPER_ADMIN", "FINANCE_OFFICER", "CREDIT_OFFICER",
        "LEASING_OFFICER", "COLLECTIONS_OFFICER", "ACCOUNTANT",
        "MANAGER", "CUSTOMER",
    ]
    roles = []
    for name in role_names:
        role = Role(name=name, description=f"{name} role", is_system=True)
        db_session.add(role)
        roles.append(role)
    await db_session.flush()
    return roles


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession, seed_roles: list[Role]) -> User:
    """Create an admin user for testing."""
    admin_role = next(r for r in seed_roles if r.name == "SUPER_ADMIN")
    user = User(
        email="admin@finlease.com",
        password_hash=hash_password("Admin@123!"),
        first_name="Test",
        last_name="Admin",
        status="ACTIVE",
    )
    user.roles = [admin_role]
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
def admin_token(admin_user: User) -> str:
    """Generate a valid JWT access token for the admin user."""
    return create_access_token({
        "sub": str(admin_user.id),
        "email": admin_user.email,
        "roles": admin_user.role_names,
    })


@pytest_asyncio.fixture
def admin_headers(admin_token: str) -> dict[str, str]:
    """Authorization headers for admin user."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture
def superuser_token_headers(admin_headers: dict[str, str]) -> dict[str, str]:
    """Alias fixture for superuser / admin headers."""
    return admin_headers


@pytest_asyncio.fixture
async def normal_user(db_session: AsyncSession, seed_roles: list[Role]) -> User:
    """Create a standard user with CUSTOMER role for testing permissions."""
    customer_role = next(r for r in seed_roles if r.name == "CUSTOMER")
    user = User(
        email="customer@finlease.com",
        password_hash=hash_password("Customer@123!"),
        first_name="Normal",
        last_name="Customer",
        status="ACTIVE",
    )
    user.roles = [customer_role]
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
def normal_user_token_headers(normal_user: User) -> dict[str, str]:
    """Authorization headers for normal user."""
    token = create_access_token({
        "sub": str(normal_user.id),
        "email": normal_user.email,
        "roles": normal_user.role_names,
    })
    return {"Authorization": f"Bearer {token}"}

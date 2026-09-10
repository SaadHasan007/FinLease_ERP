"""Global test fixtures for FinLease backend tests."""
import asyncio
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

# Use a test database URL
TEST_DATABASE_URL = settings.DATABASE_URL.replace("/finlease", "/finlease_test")
if "localhost:5432" in TEST_DATABASE_URL:
    TEST_DATABASE_URL = TEST_DATABASE_URL.replace("localhost:5432", "localhost:5433")

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
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
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


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
        email="admin@finlease.test",
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

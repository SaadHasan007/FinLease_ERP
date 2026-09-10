"""Tests for authentication API endpoints."""
import pytest
from httpx import AsyncClient

from app.models.user import Role, User


@pytest.mark.api
class TestAuthRegister:
    """Registration endpoint tests."""

    @pytest.mark.asyncio
    async def test_register_valid_user(
        self, client: AsyncClient, seed_roles: list[Role]
    ) -> None:
        """Registration with valid data should succeed."""
        response = await client.post("/api/v1/auth/register", json={
            "email": "newuser@finlease.test",
            "password": "Str0ng!Pass",
            "first_name": "New",
            "last_name": "User",
            "role_names": ["CUSTOMER"],
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == "newuser@finlease.test"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self, client: AsyncClient, admin_user: User
    ) -> None:
        """Registration with existing email should return 409."""
        response = await client.post("/api/v1/auth/register", json={
            "email": admin_user.email,
            "password": "Str0ng!Pass",
            "first_name": "Dup",
            "last_name": "User",
            "role_names": ["CUSTOMER"],
        })
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_weak_password(
        self, client: AsyncClient, seed_roles: list[Role]
    ) -> None:
        """Registration with weak password should fail validation."""
        response = await client.post("/api/v1/auth/register", json={
            "email": "weak@finlease.test",
            "password": "weak",
            "first_name": "Weak",
            "last_name": "User",
            "role_names": ["CUSTOMER"],
        })
        assert response.status_code == 422


@pytest.mark.api
class TestAuthLogin:
    """Login endpoint tests."""

    @pytest.mark.asyncio
    async def test_login_valid_credentials(
        self, client: AsyncClient, admin_user: User
    ) -> None:
        """Login with valid credentials should return tokens."""
        response = await client.post("/api/v1/auth/login", json={
            "email": "admin@finlease.test",
            "password": "Admin@123!",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]

    @pytest.mark.asyncio
    async def test_login_invalid_password(
        self, client: AsyncClient, admin_user: User
    ) -> None:
        """Login with wrong password should return 401."""
        response = await client.post("/api/v1/auth/login", json={
            "email": "admin@finlease.test",
            "password": "WrongPassword1!",
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_email(
        self, client: AsyncClient, seed_roles: list[Role]
    ) -> None:
        """Login with non-existent email should return 401."""
        response = await client.post("/api/v1/auth/login", json={
            "email": "nobody@finlease.test",
            "password": "Admin@123!",
        })
        assert response.status_code == 401


@pytest.mark.api
class TestAuthMe:
    """Current user profile endpoint tests."""

    @pytest.mark.asyncio
    async def test_me_with_valid_token(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """GET /auth/me with valid token should return user profile."""
        response = await client.get("/api/v1/auth/me", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == "admin@finlease.test"

    @pytest.mark.asyncio
    async def test_me_without_token(self, client: AsyncClient) -> None:
        """GET /auth/me without token should return 422 or 401."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code in (401, 422)

    @pytest.mark.asyncio
    async def test_me_with_invalid_token(self, client: AsyncClient) -> None:
        """GET /auth/me with invalid token should return 401."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

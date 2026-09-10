"""Smoke tests — critical authentication path."""
import pytest
from httpx import AsyncClient

from app.models.user import Role


@pytest.mark.smoke
class TestSmokeAuth:
    """Smoke tests for the authentication critical path."""

    @pytest.mark.asyncio
    async def test_smoke_health(self, client: AsyncClient) -> None:
        """SMOKE: Health endpoint responds."""
        response = await client.get("/api/v1/health")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_smoke_register_login_me(
        self, client: AsyncClient, seed_roles: list[Role]
    ) -> None:
        """SMOKE: Full auth flow — register → login → get profile."""
        # 1. Register
        reg_response = await client.post("/api/v1/auth/register", json={
            "email": "smoke@finlease.test",
            "password": "Sm0ke!Test",
            "first_name": "Smoke",
            "last_name": "User",
            "role_names": ["CUSTOMER"],
        })
        assert reg_response.status_code == 201, f"Register failed: {reg_response.text}"

        # 2. Login
        login_response = await client.post("/api/v1/auth/login", json={
            "email": "smoke@finlease.test",
            "password": "Sm0ke!Test",
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        tokens = login_response.json()["data"]
        assert "access_token" in tokens

        # 3. Get profile
        me_response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        assert me_response.status_code == 200, f"Me failed: {me_response.text}"
        profile = me_response.json()["data"]
        assert profile["email"] == "smoke@finlease.test"
        assert any(r["name"] == "CUSTOMER" for r in profile["roles"])

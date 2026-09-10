"""Tests for health check endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.api
class TestHealthEndpoints:
    """Health check API tests."""

    @pytest.mark.asyncio
    async def test_health_returns_200(self, client: AsyncClient) -> None:
        """Health endpoint should return 200 with app info."""
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "FinLease"
        assert "version" in data

    @pytest.mark.asyncio
    async def test_readiness_returns_db_status(self, client: AsyncClient) -> None:
        """Readiness endpoint should check database connectivity."""
        response = await client.get("/api/v1/health/readiness")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "checks" in data
        assert "database" in data["checks"]

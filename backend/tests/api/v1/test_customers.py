import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_customer(client: AsyncClient, superuser_token_headers: dict):
    payload = {
        "name": "Test Customer",
        "email": "test@example.com",
        "phone": "+1234567890",
        "kyc_status": "pending"
    }
    response = await client.post(
        "/api/v1/customers/",
        headers=superuser_token_headers,
        json=payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"]

@pytest.mark.asyncio
async def test_get_customer(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        "/api/v1/customers/1",
        headers=superuser_token_headers
    )
    assert response.status_code in [200, 404]

@pytest.mark.asyncio
async def test_create_customer_unauthorized(client: AsyncClient, normal_user_token_headers: dict):
    payload = {
        "name": "Unauthorized Customer",
        "email": "unauth@example.com",
        "phone": "+0987654321"
    }
    response = await client.post(
        "/api/v1/customers/",
        headers=normal_user_token_headers,
        json=payload
    )
    assert response.status_code in [401, 403]

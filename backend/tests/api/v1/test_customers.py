import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_customer(client: AsyncClient, superuser_token_headers: dict):
    payload = {
        "customer_type": "INDIVIDUAL",
        "first_name": "Test",
        "last_name": "Customer",
        "email": "test.customer@example.com",
        "phone": "+1234567890",
        "status": "ACTIVE",
        "risk_category": "LOW"
    }
    response = await client.post(
        "/api/v1/customers/",
        headers=superuser_token_headers,
        json=payload
    )
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == payload["first_name"]
    assert data["email"] == payload["email"]

@pytest.mark.asyncio
async def test_get_customer(client: AsyncClient, superuser_token_headers: dict):
    payload = {
        "customer_type": "INDIVIDUAL",
        "first_name": "Get",
        "last_name": "Customer",
        "email": "get.customer@example.com",
        "phone": "+1987654321",
        "status": "ACTIVE",
        "risk_category": "LOW"
    }
    create_res = await client.post(
        "/api/v1/customers/",
        headers=superuser_token_headers,
        json=payload
    )
    assert create_res.status_code == 201
    cust_id = create_res.json()["id"]

    response = await client.get(
        f"/api/v1/customers/{cust_id}",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    assert response.json()["email"] == payload["email"]

@pytest.mark.asyncio
async def test_create_customer_unauthorized(client: AsyncClient, normal_user_token_headers: dict):
    payload = {
        "customer_type": "INDIVIDUAL",
        "first_name": "Unauthorized",
        "last_name": "Customer",
        "email": "unauth@example.com",
        "phone": "+0987654321"
    }
    response = await client.post(
        "/api/v1/customers/",
        headers=normal_user_token_headers,
        json=payload
    )
    assert response.status_code in [401, 403]


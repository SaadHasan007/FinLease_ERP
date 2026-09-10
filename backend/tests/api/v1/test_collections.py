import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_collection_case(client: AsyncClient, superuser_token_headers: dict):
    payload = {
        "contract_id": 1,
        "amount_due": 500.0,
        "status": "open"
    }
    response = await client.post(
        "/api/v1/collections/cases/",
        headers=superuser_token_headers,
        json=payload
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["amount_due"]) == 500.0

@pytest.mark.asyncio
async def test_escalate_collection_case(client: AsyncClient, superuser_token_headers: dict):
    response = await client.post(
        "/api/v1/collections/cases/1/escalate",
        headers=superuser_token_headers
    )
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        assert response.json()["status"] == "escalated"

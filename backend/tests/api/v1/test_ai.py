import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_credit_risk_assessment(client: AsyncClient, superuser_token_headers: dict):
    payload = {
        "customer_data": {
            "income": 100000,
            "debt": 20000,
            "credit_score": 750
        }
    }
    response = await client.post(
        "/api/v1/ai/credit-risk/",
        headers=superuser_token_headers,
        json=payload
    )
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "recommendation" in data

@pytest.mark.asyncio
async def test_cash_flow_forecast(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        "/api/v1/ai/cash-flow-forecast",
        headers=superuser_token_headers,
        params={"months": 6}
    )
    assert response.status_code == 200
    data = response.json()
    assert "forecast" in data
    assert isinstance(data["forecast"], list)

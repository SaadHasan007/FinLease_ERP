import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_credit_risk_assessment(client: AsyncClient, superuser_token_headers: dict):
    # 1. Customer
    cust_res = await client.post(
        "/api/v1/customers/",
        headers=superuser_token_headers,
        json={
            "customer_type": "INDIVIDUAL",
            "first_name": "AI",
            "last_name": "Applicant",
            "email": "ai.applicant@example.com",
        }
    )
    cust_id = cust_res.json()["id"]

    # 2. Application
    app_res = await client.post(
        "/api/v1/applications/",
        headers=superuser_token_headers,
        json={
            "customer_id": cust_id,
            "requested_amount": 25000,
            "down_payment": 2500,
            "tenure_months": 24,
        }
    )
    app_id = app_res.json()["id"]

    response = await client.post(
        f"/api/v1/ai/credit-risk/{app_id}",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "credit_score" in data
    assert "probability_of_default" in data
    assert "risk_level" in data

@pytest.mark.asyncio
async def test_cash_flow_forecast(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        "/api/v1/ai/forecast/cash-flow",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "expected_inflow" in data[0]


import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_collection_case(client: AsyncClient, superuser_token_headers: dict):
    # 1. Customer
    cust_res = await client.post(
        "/api/v1/customers/",
        headers=superuser_token_headers,
        json={
            "customer_type": "INDIVIDUAL",
            "first_name": "Coll",
            "last_name": "User",
            "email": "coll.user@example.com",
        }
    )
    cust_id = cust_res.json()["id"]

    # 2. Application
    app_res = await client.post(
        "/api/v1/applications/",
        headers=superuser_token_headers,
        json={
            "customer_id": cust_id,
            "requested_amount": 10000,
            "down_payment": 1000,
            "tenure_months": 12,
        }
    )
    app_id = app_res.json()["id"]

    # 3. Contract
    contract_res = await client.post(
        "/api/v1/contracts/",
        headers=superuser_token_headers,
        json={
            "application_id": app_id,
            "principal_amount": 10000,
            "interest_rate": 0.05,
            "tenure_months": 12,
            "status": "ACTIVE",
            "start_date": "2026-09-01",
            "end_date": "2027-09-01",
        }
    )
    contract_id = contract_res.json()["id"]

    payload = {
        "contract_id": contract_id,
        "outstanding_amount": "500.0000",
        "status": "OPEN"
    }
    response = await client.post(
        "/api/v1/collections/cases",
        headers=superuser_token_headers,
        json=payload
    )
    assert response.status_code == 201
    data = response.json()
    assert float(data["outstanding_amount"]) == 500.0

@pytest.mark.asyncio
async def test_escalate_collection_case(client: AsyncClient, superuser_token_headers: dict):
    # Fetch existing case or create one
    cases_res = await client.get("/api/v1/collections/cases", headers=superuser_token_headers)
    cases = cases_res.json()
    if cases:
        case_id = cases[0]["id"]
        response = await client.patch(
            f"/api/v1/collections/cases/{case_id}",
            headers=superuser_token_headers,
            json={"status": "ESCALATED"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ESCALATED"


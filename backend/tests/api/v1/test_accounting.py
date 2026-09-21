import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_post_journal_entry_balanced(client: AsyncClient, superuser_token_headers: dict):
    # Create two accounts
    acc1_res = await client.post(
        "/api/v1/accounting/accounts",
        headers=superuser_token_headers,
        json={"code": "1010_TST", "name": "Cash Test", "account_type": "ASSET"}
    )
    assert acc1_res.status_code in (201, 409)
    acc1_id = acc1_res.json()["id"] if acc1_res.status_code == 201 else (await client.get("/api/v1/accounting/accounts", headers=superuser_token_headers)).json()[0]["id"]

    acc2_res = await client.post(
        "/api/v1/accounting/accounts",
        headers=superuser_token_headers,
        json={"code": "2010_TST", "name": "Payable Test", "account_type": "LIABILITY"}
    )
    assert acc2_res.status_code in (201, 409)
    acc2_id = acc2_res.json()["id"] if acc2_res.status_code == 201 else (await client.get("/api/v1/accounting/accounts", headers=superuser_token_headers)).json()[1]["id"]

    payload = {
        "date": "2026-09-10",
        "description": "Test Balanced Entry",
        "lines": [
            {"account_id": acc1_id, "debit": "100.0000", "credit": "0.0000"},
            {"account_id": acc2_id, "debit": "0.0000", "credit": "100.0000"}
        ]
    }
    response = await client.post(
        "/api/v1/accounting/journal-entries",
        headers=superuser_token_headers,
        json=payload
    )
    assert response.status_code == 201
    assert response.json()["description"] == payload["description"]

@pytest.mark.asyncio
async def test_post_journal_entry_unbalanced(client: AsyncClient, superuser_token_headers: dict):
    acc_res = await client.get("/api/v1/accounting/accounts", headers=superuser_token_headers)
    accounts = acc_res.json()
    if len(accounts) < 2:
        acc1 = await client.post("/api/v1/accounting/accounts", headers=superuser_token_headers, json={"code": "1020_UNB", "name": "A1", "account_type": "ASSET"})
        acc2 = await client.post("/api/v1/accounting/accounts", headers=superuser_token_headers, json={"code": "2020_UNB", "name": "A2", "account_type": "LIABILITY"})
        acc1_id, acc2_id = acc1.json()["id"], acc2.json()["id"]
    else:
        acc1_id, acc2_id = accounts[0]["id"], accounts[1]["id"]

    payload = {
        "date": "2026-09-10",
        "description": "Test Unbalanced Entry",
        "lines": [
            {"account_id": acc1_id, "debit": "100.0000", "credit": "0.0000"},
            {"account_id": acc2_id, "debit": "0.0000", "credit": "50.0000"}
        ]
    }
    response = await client.post(
        "/api/v1/accounting/journal-entries",
        headers=superuser_token_headers,
        json=payload
    )
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_get_trial_balance(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        "/api/v1/accounting/trial-balance",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


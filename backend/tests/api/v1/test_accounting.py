import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_post_journal_entry_balanced(client: AsyncClient, superuser_token_headers: dict):
    payload = {
        "date": "2026-09-10",
        "description": "Test Balanced Entry",
        "lines": [
            {"account_id": 1, "debit": 100.0, "credit": 0.0},
            {"account_id": 2, "debit": 0.0, "credit": 100.0}
        ]
    }
    response = await client.post(
        "/api/v1/accounting/journal-entries/",
        headers=superuser_token_headers,
        json=payload
    )
    assert response.status_code == 200
    assert response.json()["description"] == payload["description"]

@pytest.mark.asyncio
async def test_post_journal_entry_unbalanced(client: AsyncClient, superuser_token_headers: dict):
    payload = {
        "date": "2026-09-10",
        "description": "Test Unbalanced Entry",
        "lines": [
            {"account_id": 1, "debit": 100.0, "credit": 0.0},
            {"account_id": 2, "debit": 0.0, "credit": 50.0}
        ]
    }
    response = await client.post(
        "/api/v1/accounting/journal-entries/",
        headers=superuser_token_headers,
        json=payload
    )
    # The API should return 400 for an unbalanced journal entry
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_get_trial_balance(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        "/api/v1/accounting/trial-balance",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

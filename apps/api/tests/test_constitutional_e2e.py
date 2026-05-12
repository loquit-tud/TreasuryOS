"""End-to-end API tests: vault → proposal → evaluate → execution-record."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


def _constitution() -> dict:
    return {
        "stable_reserve_min_pct": 20.0,
        "max_drawdown_pct": 25.0,
        "rwa_exposure_max_pct": 30.0,
        "leverage_allowed": False,
        "emergency": {"volatility_threshold_pct": 15.0, "action": "DE_RISK"},
    }


def _proposal_compliant() -> dict:
    return {
        "action": "REBALANCE",
        "amount_pct": 10.0,
        "rationale": "Test rebalance for constitutional e2e flow.",
        "expected_risk_delta": -0.5,
        "expected_yield_delta": 0.1,
        "proposed_stable_reserve_pct": 25.0,
        "proposed_drawdown_pct": 10.0,
        "proposed_rwa_exposure_pct": 15.0,
        "proposed_leverage_enabled": False,
    }


def _proposal_reject_stable() -> dict:
    p = _proposal_compliant()
    p["proposed_stable_reserve_pct"] = 5.0
    return p


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_db(client: TestClient) -> None:
    response = client.get("/health/db")
    assert response.status_code == 200
    body = response.json()
    assert body["database_reachable"] is True
    assert body["tables"]["vaults"] is True
    assert body["tables"]["constitution_versions"] is True


def test_constitutional_flow_allow_and_execute_record(client: TestClient) -> None:
    vault_res = client.post(
        "/vaults",
        json={"name": "E2E Vault", "constitution": _constitution()},
    )
    assert vault_res.status_code == 200
    vault = vault_res.json()
    vault_id = vault["id"]
    assert vault["constitution_hash"]

    prop_res = client.post(
        f"/proposals/vault/{vault_id}",
        json=_proposal_compliant(),
    )
    assert prop_res.status_code == 200
    proposal_id = prop_res.json()["id"]

    dec_res = client.post(f"/proposals/{proposal_id}/evaluate")
    assert dec_res.status_code == 200
    decision = dec_res.json()
    assert decision["decision"] == "ALLOW"
    assert not decision["violated_rules"]

    prop_get = client.get(f"/proposals/vault/{vault_id}")
    assert prop_get.status_code == 200
    proposals = prop_get.json()
    assert any(p["id"] == proposal_id and p["status"] == "ALLOW" for p in proposals)

    fake_tx = "0x" + "ab" * 32
    exec_res = client.post(
        f"/proposals/{proposal_id}/execution-record",
        json={"tx_hash": fake_tx},
    )
    assert exec_res.status_code == 200
    body = exec_res.json()
    assert body["tx_hash"] == fake_tx
    assert body["status"] == "logged"

    prop_get2 = client.get(f"/proposals/vault/{vault_id}")
    assert any(p["id"] == proposal_id and p["status"] == "EXECUTED" for p in prop_get2.json())


def test_evaluate_reject_violates_stable_floor(client: TestClient) -> None:
    vault_res = client.post(
        "/vaults",
        json={"name": "Reject Vault", "constitution": _constitution()},
    )
    assert vault_res.status_code == 200
    vault_id = vault_res.json()["id"]

    prop_res = client.post(
        f"/proposals/vault/{vault_id}",
        json=_proposal_reject_stable(),
    )
    assert prop_res.status_code == 200
    proposal_id = prop_res.json()["id"]

    dec_res = client.post(f"/proposals/{proposal_id}/evaluate")
    assert dec_res.status_code == 200
    decision = dec_res.json()
    assert decision["decision"] == "REJECT"
    assert "stable_reserve_min_pct" in decision["violated_rules"]


def test_create_proposal_unknown_vault(client: TestClient) -> None:
    res = client.post(
        "/proposals/vault/vault_nonexistent000",
        json=_proposal_compliant(),
    )
    assert res.status_code == 404


def test_execution_record_without_tx_when_chain_disabled(client: TestClient) -> None:
    vault_res = client.post(
        "/vaults",
        json={"name": "Chain Off Vault", "constitution": _constitution()},
    )
    vault_id = vault_res.json()["id"]
    prop_res = client.post(f"/proposals/vault/{vault_id}", json=_proposal_compliant())
    proposal_id = prop_res.json()["id"]
    client.post(f"/proposals/{proposal_id}/evaluate")

    res = client.post(f"/proposals/{proposal_id}/execution-record", json={})
    assert res.status_code == 400
    assert "Blockchain not configured" in res.json()["detail"]

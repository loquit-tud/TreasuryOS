from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.db_models import LedgerEntryRecord, ProposalRecord, VaultRecord
from app.schemas.models import LedgerEntry
from app.services.event_feed import fetch_recent_decisions
from app.services.mappers import to_ledger_entry_schema

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/vault/{vault_id}/ledger", response_model=list[LedgerEntry])
def get_ledger(vault_id: str, db: Session = Depends(get_db)) -> list[LedgerEntry]:
    records = db.scalars(
        select(LedgerEntryRecord)
        .where(LedgerEntryRecord.vault_id == vault_id)
        .order_by(LedgerEntryRecord.timestamp.desc())
    ).all()
    return [to_ledger_entry_schema(item) for item in records]


@router.get("/decisions/recent")
def get_recent_decision_events(limit: int = Query(50, ge=1, le=500)) -> dict[str, Any]:
    """Latest constitutional decisions from the Redis stream (empty if REDIS_URL unset)."""
    events, redis_enabled = fetch_recent_decisions(limit=limit)
    return {"redis_enabled": redis_enabled, "count": len(events), "events": events}


@router.get("/vault/{vault_id}/health")
def get_health(vault_id: str, db: Session = Depends(get_db)) -> dict[str, int | str]:
    vault = db.get(VaultRecord, vault_id)
    if vault is None:
        return {"status": "not_found"}

    total = db.scalar(
        select(func.count()).select_from(ProposalRecord).where(ProposalRecord.vault_id == vault_id)
    )
    rejected = db.scalar(
        select(func.count())
        .select_from(ProposalRecord)
        .where(ProposalRecord.vault_id == vault_id, ProposalRecord.status == "REJECT")
    )

    return {
        "status": "healthy",
        "health_score": vault.health_score,
        "risk_score": vault.risk_score,
        "proposal_count": total or 0,
        "rejection_count": rejected or 0,
    }

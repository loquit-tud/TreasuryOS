from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.db_models import ConstitutionVersionRecord, LedgerEntryRecord, ProposalRecord, VaultRecord

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.get("/proposal/{proposal_id}")
def evidence_for_proposal(proposal_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    proposal = db.get(ProposalRecord, proposal_id)
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal not found")

    vault = db.get(VaultRecord, proposal.vault_id)
    if vault is None:
        raise HTTPException(status_code=404, detail="Vault not found")

    ledger = db.scalars(
        select(LedgerEntryRecord)
        .where(LedgerEntryRecord.proposal_id == proposal_id)
        .order_by(desc(LedgerEntryRecord.timestamp))
    ).first()

    const_versions = db.scalars(
        select(ConstitutionVersionRecord)
        .where(ConstitutionVersionRecord.vault_id == vault.id)
        .order_by(desc(ConstitutionVersionRecord.created_at))
        .limit(10)
    ).all()

    return {
        "vault": {
            "id": vault.id,
            "name": vault.name,
            "constitution_hash": vault.constitution_hash,
            "chain_status": vault.chain_status,
        },
        "proposal": {
            "id": proposal.id,
            "vault_id": proposal.vault_id,
            "payload": proposal.payload,
            "status": proposal.status,
            "reasons": proposal.reasons,
            "violated_rules": proposal.violated_rules,
            "created_at": proposal.created_at.isoformat(),
        },
        "ledger_entry": None
        if ledger is None
        else {
            "id": ledger.id,
            "verdict": ledger.verdict,
            "reason": ledger.reason,
            "policy_hash": ledger.policy_hash,
            "execution_status": ledger.execution_status,
            "tx_hash": ledger.tx_hash,
            "timestamp": ledger.timestamp.isoformat(),
        },
        "constitution_versions": [
            {
                "id": cv.id,
                "vault_id": cv.vault_id,
                "constitution_hash": cv.constitution_hash,
                "actor": cv.actor,
                "request_id": cv.request_id,
                "created_at": cv.created_at.isoformat(),
            }
            for cv in const_versions
        ],
    }


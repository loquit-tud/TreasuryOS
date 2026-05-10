from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.db_models import LedgerEntryRecord, ProposalRecord, VaultRecord
from app.schemas.models import Constitution, Decision, ExecutionRecordUpdate, Proposal, ProposalCreate
from app.services.blockchain import blockchain_enabled, log_treasury_action
from app.services.constitution_engine import evaluate_proposal
from app.services.event_feed import publish_decision_event
from app.services.mappers import to_proposal_schema

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.post("/vault/{vault_id}", response_model=Proposal)
def create_proposal(
    vault_id: str, payload: ProposalCreate, db: Session = Depends(get_db)
) -> Proposal:
    vault = db.get(VaultRecord, vault_id)
    if vault is None:
        raise HTTPException(status_code=404, detail="Vault not found")

    proposal_id = f"prop_{uuid4().hex[:10]}"
    proposal_record = ProposalRecord(
        id=proposal_id,
        vault_id=vault_id,
        payload=payload.model_dump(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(proposal_record)
    db.commit()
    db.refresh(proposal_record)
    return to_proposal_schema(proposal_record)


@router.post("/{proposal_id}/evaluate", response_model=Decision)
def evaluate(proposal_id: str, db: Session = Depends(get_db)) -> Decision:
    proposal_record = db.get(ProposalRecord, proposal_id)
    if proposal_record is None:
        raise HTTPException(status_code=404, detail="Proposal not found")

    vault_record = db.get(VaultRecord, proposal_record.vault_id)
    if vault_record is None:
        raise HTTPException(status_code=404, detail="Vault not found")

    proposal_payload = ProposalCreate(**proposal_record.payload)
    decision = evaluate_proposal(Constitution(**vault_record.constitution), proposal_payload)
    proposal_record.status = decision.decision
    proposal_record.reasons = decision.reasons
    proposal_record.violated_rules = decision.violated_rules

    db.add(
        LedgerEntryRecord(
            id=f"ledger_{uuid4().hex[:10]}",
            vault_id=proposal_record.vault_id,
            proposal_id=proposal_record.id,
            action=proposal_payload.action,
            verdict=decision.decision,
            reason="; ".join(decision.reasons),
            policy_hash=vault_record.constitution_hash,
            execution_status="CHAIN_READY" if decision.decision == "ALLOW" else "OFFCHAIN_ONLY",
            timestamp=datetime.now(timezone.utc),
        )
    )
    db.commit()
    publish_decision_event(
        vault_id=proposal_record.vault_id,
        proposal_id=proposal_record.id,
        verdict=decision.decision,
        reasons=decision.reasons,
    )
    return decision


@router.get("/vault/{vault_id}")
def list_vault_proposals(vault_id: str, db: Session = Depends(get_db)) -> list[Proposal]:
    records = db.scalars(
        select(ProposalRecord).where(ProposalRecord.vault_id == vault_id).order_by(ProposalRecord.created_at.desc())
    ).all()
    return [to_proposal_schema(item) for item in records]


@router.post("/{proposal_id}/execution-record")
def log_execution_record(
    proposal_id: str, payload: ExecutionRecordUpdate, db: Session = Depends(get_db)
) -> dict[str, str]:
    proposal_record = db.get(ProposalRecord, proposal_id)
    if proposal_record is None:
        raise HTTPException(status_code=404, detail="Proposal not found")

    ledger_record = db.scalars(
        select(LedgerEntryRecord)
        .where(LedgerEntryRecord.proposal_id == proposal_id)
        .order_by(desc(LedgerEntryRecord.timestamp))
    ).first()
    if ledger_record is None:
        raise HTTPException(status_code=404, detail="Ledger entry not found for proposal")

    tx_hash = payload.tx_hash
    if tx_hash is None:
        if not blockchain_enabled():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Blockchain not configured. Provide tx_hash manually or set "
                    "MANTLE_RPC_URL, EXECUTION_LOG_CONTRACT, TREASURY_EXECUTOR_PRIVATE_KEY/TREASURY_EXECUTOR_MNEMONIC."
                ),
            )
        try:
            tx_hash = log_treasury_action(
                vault_id=proposal_record.vault_id,
                proposal_id=proposal_id,
                policy_hash=ledger_record.policy_hash,
                verdict=ledger_record.verdict,
                reason=ledger_record.reason,
            )
        except RuntimeError as error:
            raise HTTPException(status_code=502, detail=str(error)) from error

    ledger_record.execution_status = "ONCHAIN_LOGGED"
    ledger_record.tx_hash = tx_hash
    proposal_record.status = "EXECUTED"

    vault_record = db.get(VaultRecord, proposal_record.vault_id)
    if vault_record is not None:
        vault_record.chain_status = "ONCHAIN_LOGGED"

    db.commit()
    return {"status": "logged", "proposal_id": proposal_id, "tx_hash": tx_hash}

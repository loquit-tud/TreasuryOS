from app.db_models import LedgerEntryRecord, ProposalRecord, SimulationRecord, VaultRecord
from app.schemas.models import LedgerEntry, Proposal, SimulationResult, Vault


def to_vault_schema(record: VaultRecord) -> Vault:
    return Vault(
        id=record.id,
        name=record.name,
        constitution=record.constitution,
        constitution_hash=record.constitution_hash or "0x" + "0" * 64,
        chain_status=record.chain_status or "OFFCHAIN_ONLY",
        health_score=record.health_score,
        risk_score=record.risk_score,
        created_at=record.created_at,
    )


def to_proposal_schema(record: ProposalRecord) -> Proposal:
    return Proposal(
        id=record.id,
        vault_id=record.vault_id,
        payload=record.payload,
        status=record.status,
        reasons=record.reasons,
        violated_rules=record.violated_rules,
        created_at=record.created_at,
    )


def to_simulation_schema(record: SimulationRecord) -> SimulationResult:
    return SimulationResult(
        proposal_id=record.proposal_id,
        scenario=record.scenario,
        drawdown_pct=record.drawdown_pct,
        survival_score=record.survival_score,
        policy_compliance=record.policy_compliance,
        details=record.details,
        created_at=record.created_at,
    )


def to_ledger_entry_schema(record: LedgerEntryRecord) -> LedgerEntry:
    return LedgerEntry(
        id=record.id,
        vault_id=record.vault_id,
        proposal_id=record.proposal_id,
        action=record.action,
        verdict=record.verdict,
        reason=record.reason,
        policy_hash=record.policy_hash or "0x" + "0" * 64,
        execution_status=record.execution_status or "OFFCHAIN_ONLY",
        tx_hash=record.tx_hash,
        timestamp=record.timestamp,
    )

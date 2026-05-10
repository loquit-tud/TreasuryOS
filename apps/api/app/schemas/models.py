from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class EmergencyRule(BaseModel):
    volatility_threshold_pct: float = Field(ge=0, le=100)
    action: Literal["DE_RISK", "PAUSE"]


class Constitution(BaseModel):
    stable_reserve_min_pct: float = Field(ge=0, le=100)
    max_drawdown_pct: float = Field(ge=0, le=100)
    rwa_exposure_max_pct: float = Field(ge=0, le=100)
    leverage_allowed: bool = False
    emergency: EmergencyRule


class VaultCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    constitution: Constitution


class Vault(BaseModel):
    id: str
    name: str
    constitution: Constitution
    constitution_hash: str
    chain_status: Literal["OFFCHAIN_ONLY", "CHAIN_READY", "ONCHAIN_LOGGED"] = "OFFCHAIN_ONLY"
    health_score: int = 94
    risk_score: int = 91
    created_at: datetime


class ProposalCreate(BaseModel):
    action: Literal["REBALANCE", "SWAP", "HEDGE"]
    amount_pct: float = Field(gt=0, le=100)
    rationale: str = Field(min_length=10, max_length=1000)
    expected_risk_delta: float
    expected_yield_delta: float
    proposed_stable_reserve_pct: float = Field(ge=0, le=100)
    proposed_drawdown_pct: float = Field(ge=0, le=100)
    proposed_rwa_exposure_pct: float = Field(ge=0, le=100)
    proposed_leverage_enabled: bool


class Proposal(BaseModel):
    id: str
    vault_id: str
    payload: ProposalCreate
    status: Literal["PENDING", "ALLOW", "REJECT", "EXECUTED"] = "PENDING"
    reasons: List[str] = []
    violated_rules: List[str] = []
    created_at: datetime


class Decision(BaseModel):
    decision: Literal["ALLOW", "REJECT", "ESCALATE"]
    reasons: List[str]
    violated_rules: List[str]


class SimulationRequest(BaseModel):
    scenario: Literal["BLACK_SWAN", "VOLATILITY_SPIKE", "LIQUIDITY_CRUNCH"]
    shock_strength_pct: float = Field(gt=0, le=100)


class SimulationResult(BaseModel):
    proposal_id: str
    scenario: str
    drawdown_pct: float
    survival_score: int
    policy_compliance: int
    details: Dict[str, str]
    created_at: datetime


class LedgerEntry(BaseModel):
    id: str
    vault_id: str
    proposal_id: str
    action: str
    verdict: Literal["ALLOW", "REJECT", "EXECUTED"]
    reason: str
    policy_hash: str
    execution_status: Literal["OFFCHAIN_ONLY", "CHAIN_READY", "ONCHAIN_LOGGED"]
    tx_hash: Optional[str] = None
    timestamp: datetime


class ExecutionRecordUpdate(BaseModel):
    tx_hash: Optional[str] = Field(default=None, min_length=10, max_length=120)

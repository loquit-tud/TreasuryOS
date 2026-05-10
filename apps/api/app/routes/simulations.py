from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.db_models import ProposalRecord, SimulationRecord
from app.schemas.models import SimulationRequest, SimulationResult
from app.services.mappers import to_simulation_schema

router = APIRouter(prefix="/simulations", tags=["simulations"])


@router.post("/proposal/{proposal_id}", response_model=SimulationResult)
def run_simulation(
    proposal_id: str, payload: SimulationRequest, db: Session = Depends(get_db)
) -> SimulationResult:
    proposal = db.get(ProposalRecord, proposal_id)
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal not found")

    drawdown = round(payload.shock_strength_pct * 0.18, 2)
    survival_score = max(30, int(100 - drawdown))
    policy_compliance = 100 if proposal.status == "ALLOW" else 92

    simulation_record = SimulationRecord(
        id=f"sim_{uuid4().hex[:10]}",
        proposal_id=proposal_id,
        scenario=payload.scenario,
        drawdown_pct=drawdown,
        survival_score=survival_score,
        policy_compliance=policy_compliance,
        details={
            "explainability": "Policy layer a limitat mutarile care ar fi redus rezerva stabila.",
            "capital_response": "Rebalansare defensiva catre active lichide.",
        },
        created_at=datetime.now(timezone.utc),
    )
    db.add(simulation_record)
    db.commit()
    db.refresh(simulation_record)
    return to_simulation_schema(simulation_record)


@router.get("/vault/{vault_id}", response_model=list[SimulationResult])
def list_vault_simulations(vault_id: str, db: Session = Depends(get_db)) -> list[SimulationResult]:
    records = db.scalars(
        select(SimulationRecord)
        .join(ProposalRecord, SimulationRecord.proposal_id == ProposalRecord.id)
        .where(ProposalRecord.vault_id == vault_id)
        .order_by(SimulationRecord.created_at.desc())
    ).all()
    return [to_simulation_schema(item) for item in records]

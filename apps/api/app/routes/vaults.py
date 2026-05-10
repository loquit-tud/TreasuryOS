from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.db_models import VaultRecord
from app.schemas.models import Constitution, Vault, VaultCreate
from app.services.hashing import constitution_hash
from app.services.mappers import to_vault_schema

router = APIRouter(prefix="/vaults", tags=["vaults"])


@router.post("", response_model=Vault)
def create_vault(payload: VaultCreate, db: Session = Depends(get_db)) -> Vault:
    vault_id = f"vault_{uuid4().hex[:10]}"
    record = VaultRecord(
        id=vault_id,
        name=payload.name,
        constitution=payload.constitution.model_dump(),
        constitution_hash=constitution_hash(payload.constitution.model_dump()),
        chain_status="CHAIN_READY",
        created_at=datetime.now(timezone.utc),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return to_vault_schema(record)


@router.get("/{vault_id}", response_model=Vault)
def get_vault(vault_id: str, db: Session = Depends(get_db)) -> Vault:
    record = db.get(VaultRecord, vault_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Vault not found")
    return to_vault_schema(record)


@router.put("/{vault_id}/constitution", response_model=Vault)
def update_constitution(
    vault_id: str, constitution: Constitution, db: Session = Depends(get_db)
) -> Vault:
    record = db.get(VaultRecord, vault_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Vault not found")

    record.constitution = constitution.model_dump()
    record.constitution_hash = constitution_hash(constitution.model_dump())
    record.chain_status = "CHAIN_READY"
    db.commit()
    db.refresh(record)
    return to_vault_schema(record)

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.audit import auth_subject, request_id
from app.db_models import ConstitutionVersionRecord, VaultRecord
from app.schemas.models import Constitution, Vault, VaultCreate
from app.services.hashing import constitution_hash
from app.services.mappers import to_vault_schema

router = APIRouter(prefix="/vaults", tags=["vaults"])


@router.post("", response_model=Vault)
def create_vault(payload: VaultCreate, request: Request, db: Session = Depends(get_db)) -> Vault:
    vault_id = f"vault_{uuid4().hex[:10]}"
    c = payload.constitution.model_dump()
    c_hash = constitution_hash(c)
    record = VaultRecord(
        id=vault_id,
        name=payload.name,
        constitution=c,
        constitution_hash=c_hash,
        chain_status="CHAIN_READY",
        created_at=datetime.now(timezone.utc),
    )
    db.add(record)
    db.add(
        ConstitutionVersionRecord(
            id=f"cv_{uuid4().hex[:10]}",
            vault_id=vault_id,
            constitution=c,
            constitution_hash=c_hash,
            actor=auth_subject(request),
            request_id=request_id(request),
            created_at=datetime.now(timezone.utc),
        )
    )
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
    vault_id: str, constitution: Constitution, request: Request, db: Session = Depends(get_db)
) -> Vault:
    record = db.get(VaultRecord, vault_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Vault not found")

    c = constitution.model_dump()
    c_hash = constitution_hash(c)
    record.constitution = c
    record.constitution_hash = c_hash
    record.chain_status = "CHAIN_READY"
    db.add(
        ConstitutionVersionRecord(
            id=f"cv_{uuid4().hex[:10]}",
            vault_id=vault_id,
            constitution=c,
            constitution_hash=c_hash,
            actor=auth_subject(request),
            request_id=request_id(request),
            created_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    db.refresh(record)
    return to_vault_schema(record)

import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.audit import auth_subject, request_id
from app.db_models import ConstitutionVersionRecord, VaultRecord
from app.schemas.models import Constitution, Vault, VaultCreate
from app.services.hashing import constitution_hash
from app.services.mappers import to_vault_schema

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vaults", tags=["vaults"])


def _sqlalchemy_diag(exc: SQLAlchemyError, *, extended: bool) -> str:
    parts: list[str] = [exc.__class__.__name__]
    orig = getattr(exc, "orig", None)
    if orig is not None:
        parts.append(str(orig).strip()[:420])
    else:
        msg = str(exc).strip()
        if msg:
            parts.append(msg[:420])
    out = " — ".join(p for p in parts if p)
    if extended:
        raw = str(orig if orig is not None else exc).strip()
        if len(raw) > 420:
            out += f" | …{raw[420:920]}"
    return out[:900]


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
    try:
        db.add(record)
        db.flush()
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
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("create_vault failed (database)")
        diag = _sqlalchemy_diag(exc, extended=get_settings().expose_db_error_detail)
        detail = (
            "Database write failed (vault bootstrap). "
            f"Postgres/SQLAlchemy: {diag}. "
            "If this is opaque, set EXPOSE_DB_ERROR_DETAIL=true for a longer fragment."
        )[:1200]
        raise HTTPException(status_code=503, detail=detail) from None


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
    try:
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
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("update_constitution failed (database)")
        diag = _sqlalchemy_diag(exc, extended=get_settings().expose_db_error_detail)
        detail = (
            "Database write failed (constitution update). "
            f"Postgres/SQLAlchemy: {diag}. "
            "Set EXPOSE_DB_ERROR_DETAIL=true for a longer fragment."
        )[:1200]
        raise HTTPException(status_code=503, detail=detail) from None

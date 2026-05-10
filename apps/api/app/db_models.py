from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class VaultRecord(Base):
    __tablename__ = "vaults"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    constitution: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    constitution_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    chain_status: Mapped[str | None] = mapped_column(String(20), default="OFFCHAIN_ONLY", nullable=True)
    health_score: Mapped[int] = mapped_column(Integer, default=94, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, default=91, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    proposals: Mapped[list["ProposalRecord"]] = relationship(back_populates="vault", cascade="all, delete-orphan")


class ProposalRecord(Base):
    __tablename__ = "proposals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vault_id: Mapped[str] = mapped_column(ForeignKey("vaults.id", ondelete="CASCADE"), nullable=False, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    reasons: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    violated_rules: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    vault: Mapped["VaultRecord"] = relationship(back_populates="proposals")
    simulations: Mapped[list["SimulationRecord"]] = relationship(
        back_populates="proposal", cascade="all, delete-orphan"
    )


class SimulationRecord(Base):
    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    proposal_id: Mapped[str] = mapped_column(
        ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scenario: Mapped[str] = mapped_column(String(64), nullable=False)
    drawdown_pct: Mapped[float] = mapped_column(nullable=False)
    survival_score: Mapped[int] = mapped_column(Integer, nullable=False)
    policy_compliance: Mapped[int] = mapped_column(Integer, nullable=False)
    details: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    proposal: Mapped["ProposalRecord"] = relationship(back_populates="simulations")


class LedgerEntryRecord(Base):
    __tablename__ = "ledger_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vault_id: Mapped[str] = mapped_column(ForeignKey("vaults.id", ondelete="CASCADE"), nullable=False, index=True)
    proposal_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    verdict: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[str] = mapped_column(String(1024), nullable=False)
    policy_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    execution_status: Mapped[str | None] = mapped_column(String(20), default="OFFCHAIN_ONLY", nullable=True)
    tx_hash: Mapped[str | None] = mapped_column(String(120), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class ConstitutionVersionRecord(Base):
    __tablename__ = "constitution_versions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vault_id: Mapped[str] = mapped_column(
        ForeignKey("vaults.id", ondelete="CASCADE"), nullable=False, index=True
    )
    constitution: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    constitution_hash: Mapped[str] = mapped_column(String(66), nullable=False, index=True)
    actor: Mapped[str] = mapped_column(String(80), nullable=False, default="public")
    request_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

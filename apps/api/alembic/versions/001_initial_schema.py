"""Initial TreasuryOS schema.

Revision ID: 001_initial
Revises:
Create Date: 2026-05-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vaults",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("constitution", sa.JSON(), nullable=False),
        sa.Column("constitution_hash", sa.String(length=66), nullable=True),
        sa.Column("chain_status", sa.String(length=20), nullable=True),
        sa.Column("health_score", sa.Integer(), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "proposals",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("vault_id", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("reasons", sa.JSON(), nullable=False),
        sa.Column("violated_rules", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["vault_id"], ["vaults.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_proposals_vault_id"), "proposals", ["vault_id"], unique=False)
    op.create_table(
        "simulations",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("proposal_id", sa.String(length=64), nullable=False),
        sa.Column("scenario", sa.String(length=64), nullable=False),
        sa.Column("drawdown_pct", sa.Float(), nullable=False),
        sa.Column("survival_score", sa.Integer(), nullable=False),
        sa.Column("policy_compliance", sa.Integer(), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["proposal_id"], ["proposals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_simulations_proposal_id"), "simulations", ["proposal_id"], unique=False)
    op.create_table(
        "ledger_entries",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("vault_id", sa.String(length=64), nullable=False),
        sa.Column("proposal_id", sa.String(length=64), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("verdict", sa.String(length=20), nullable=False),
        sa.Column("reason", sa.String(length=1024), nullable=False),
        sa.Column("policy_hash", sa.String(length=66), nullable=True),
        sa.Column("execution_status", sa.String(length=20), nullable=True),
        sa.Column("tx_hash", sa.String(length=120), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["vault_id"], ["vaults.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ledger_entries_vault_id"), "ledger_entries", ["vault_id"], unique=False)
    op.create_index(op.f("ix_ledger_entries_proposal_id"), "ledger_entries", ["proposal_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ledger_entries_proposal_id"), table_name="ledger_entries")
    op.drop_index(op.f("ix_ledger_entries_vault_id"), table_name="ledger_entries")
    op.drop_table("ledger_entries")
    op.drop_index(op.f("ix_simulations_proposal_id"), table_name="simulations")
    op.drop_table("simulations")
    op.drop_index(op.f("ix_proposals_vault_id"), table_name="proposals")
    op.drop_table("proposals")
    op.drop_table("vaults")

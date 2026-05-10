"""Add constitution_versions audit log.

Revision ID: 002_constitution_versions
Revises: 001_initial
Create Date: 2026-05-10

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "002_constitution_versions"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_names(bind) -> set[str]:
    return set(inspect(bind).get_table_names())


def _index_names(bind, table: str) -> set[str]:
    return {ix["name"] for ix in inspect(bind).get_indexes(table)}


def upgrade() -> None:
    bind = op.get_bind()
    tables = _table_names(bind)

    if "constitution_versions" not in tables:
        op.create_table(
            "constitution_versions",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("vault_id", sa.String(length=64), nullable=False),
            sa.Column("constitution", sa.JSON(), nullable=False),
            sa.Column("constitution_hash", sa.String(length=66), nullable=False),
            sa.Column("actor", sa.String(length=80), nullable=False),
            sa.Column("request_id", sa.String(length=80), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["vault_id"], ["vaults.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    tables = _table_names(bind)
    if "constitution_versions" in tables:
        if "ix_constitution_versions_vault_id" not in _index_names(bind, "constitution_versions"):
            op.create_index(
                op.f("ix_constitution_versions_vault_id"),
                "constitution_versions",
                ["vault_id"],
                unique=False,
            )
        if "ix_constitution_versions_constitution_hash" not in _index_names(bind, "constitution_versions"):
            op.create_index(
                op.f("ix_constitution_versions_constitution_hash"),
                "constitution_versions",
                ["constitution_hash"],
                unique=False,
            )


def downgrade() -> None:
    op.drop_index(op.f("ix_constitution_versions_constitution_hash"), table_name="constitution_versions")
    op.drop_index(op.f("ix_constitution_versions_vault_id"), table_name="constitution_versions")
    op.drop_table("constitution_versions")


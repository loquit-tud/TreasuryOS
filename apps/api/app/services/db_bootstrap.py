import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.db_models import ConstitutionVersionRecord

logger = logging.getLogger(__name__)


def ensure_constitution_versions_table(engine: Engine) -> None:
    """
    Idempotent safety net after Alembic.

    If production DB was created before migration 002, or alembic_version drifted,
    POST /vaults would 500 on insert into constitution_versions. Creating the
    table here matches revision 002_constitution_versions.
    """
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "constitution_versions" in tables:
        return
    if "vaults" not in tables:
        logger.warning("ensure_constitution_versions_table: vaults missing; skip DDL")
        return

    # Prefer explicit DDL on PostgreSQL — some hosted builds failed silently with
    # Declarative Table.create(); IF NOT EXISTS matches Alembic 002 semantics.
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS constitution_versions (
                        id VARCHAR(64) PRIMARY KEY,
                        vault_id VARCHAR(64) NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
                        constitution JSON NOT NULL,
                        constitution_hash VARCHAR(66) NOT NULL,
                        actor VARCHAR(80) NOT NULL,
                        request_id VARCHAR(80) NULL,
                        created_at TIMESTAMPTZ NOT NULL
                    );
                    """
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_constitution_versions_vault_id "
                    "ON constitution_versions (vault_id);"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_constitution_versions_constitution_hash "
                    "ON constitution_versions (constitution_hash);"
                )
            )
    else:
        ConstitutionVersionRecord.__table__.create(bind=engine, checkfirst=True)

    logger.warning(
        "Created missing table constitution_versions (schema self-heal). "
        "Confirm `alembic upgrade head` on deploy."
    )


def ensure_runtime_columns(engine: Engine) -> None:
    inspector = inspect(engine)

    if "vaults" in inspector.get_table_names():
        vault_columns = {column["name"] for column in inspector.get_columns("vaults")}
        with engine.begin() as conn:
            if "constitution_hash" not in vault_columns:
                conn.execute(text("ALTER TABLE vaults ADD COLUMN constitution_hash VARCHAR(66)"))
            if "chain_status" not in vault_columns:
                conn.execute(text("ALTER TABLE vaults ADD COLUMN chain_status VARCHAR(20)"))
            # Legacy DBs sometimes predate full 001 vault columns — ORM insert requires these.
            if "health_score" not in vault_columns:
                conn.execute(
                    text("ALTER TABLE vaults ADD COLUMN health_score INTEGER NOT NULL DEFAULT 94")
                )
            if "risk_score" not in vault_columns:
                conn.execute(
                    text("ALTER TABLE vaults ADD COLUMN risk_score INTEGER NOT NULL DEFAULT 91")
                )

    if "ledger_entries" in inspector.get_table_names():
        ledger_columns = {column["name"] for column in inspector.get_columns("ledger_entries")}
        with engine.begin() as conn:
            if "policy_hash" not in ledger_columns:
                conn.execute(text("ALTER TABLE ledger_entries ADD COLUMN policy_hash VARCHAR(66)"))
            if "execution_status" not in ledger_columns:
                conn.execute(text("ALTER TABLE ledger_entries ADD COLUMN execution_status VARCHAR(20)"))
            if "tx_hash" not in ledger_columns:
                conn.execute(text("ALTER TABLE ledger_entries ADD COLUMN tx_hash VARCHAR(120)"))

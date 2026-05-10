from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_runtime_columns(engine: Engine) -> None:
    inspector = inspect(engine)

    if "vaults" in inspector.get_table_names():
        vault_columns = {column["name"] for column in inspector.get_columns("vaults")}
        with engine.begin() as conn:
            if "constitution_hash" not in vault_columns:
                conn.execute(text("ALTER TABLE vaults ADD COLUMN constitution_hash VARCHAR(66)"))
            if "chain_status" not in vault_columns:
                conn.execute(text("ALTER TABLE vaults ADD COLUMN chain_status VARCHAR(20)"))

    if "ledger_entries" in inspector.get_table_names():
        ledger_columns = {column["name"] for column in inspector.get_columns("ledger_entries")}
        with engine.begin() as conn:
            if "policy_hash" not in ledger_columns:
                conn.execute(text("ALTER TABLE ledger_entries ADD COLUMN policy_hash VARCHAR(66)"))
            if "execution_status" not in ledger_columns:
                conn.execute(text("ALTER TABLE ledger_entries ADD COLUMN execution_status VARCHAR(20)"))
            if "tx_hash" not in ledger_columns:
                conn.execute(text("ALTER TABLE ledger_entries ADD COLUMN tx_hash VARCHAR(120)"))

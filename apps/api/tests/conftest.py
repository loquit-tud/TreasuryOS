"""Pytest setup: SQLite file DB + test env before any `app.*` import."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Must run before importing app (db binds engine at import time).
_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".sqlite3")
_tmp.close()
_sqlite_url = "sqlite:///" + Path(_tmp.name).as_posix()

os.environ["DATABASE_URL"] = _sqlite_url
os.environ["APP_ENV"] = "test"
os.environ["AUTO_CREATE_SCHEMA"] = "false"
os.environ.pop("REDIS_URL", None)
os.environ.pop("MANTLE_RPC_URL", None)
os.environ.pop("EXECUTION_LOG_CONTRACT", None)
os.environ.pop("TREASURY_EXECUTOR_PRIVATE_KEY", None)
os.environ.pop("TREASURY_EXECUTOR_MNEMONIC", None)
os.environ.pop("MANTLE_CHAIN_ID", None)

"""Run Alembic migrations programmatically (Docker / Railway startup)."""

import os
import subprocess
import sys
from pathlib import Path


def _api_root() -> Path:
    # app/services/migrations.py -> parents[2] == apps/api
    return Path(__file__).resolve().parents[2]


def run_alembic_upgrade() -> None:
    """Apply all pending migrations. Idempotent; safe to call on every process start."""
    api_root = _api_root()
    env = os.environ.copy()
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=api_root,
        check=True,
        env=env,
    )

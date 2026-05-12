import asyncio
from contextlib import asynccontextmanager

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import engine
from app.db_models import Base
from app.routes.monitoring import router as monitoring_router
from app.routes.evidence import router as evidence_router
from app.routes.proposals import router as proposals_router
from app.routes.simulations import router as simulations_router
from app.routes.vaults import router as vaults_router
from app.services.db_bootstrap import ensure_constitution_versions_table, ensure_runtime_columns
from app.services.migrations import run_alembic_upgrade
from app.observability import elapsed_ms, get_or_create_request_id, log_request, start_timer
from app.security import require_api_key


def _bootstrap_schema_sync() -> None:
    settings = get_settings()
    if not settings.should_auto_create_schema:
        return
    Base.metadata.create_all(bind=engine)
    ensure_runtime_columns(engine)
    ensure_constitution_versions_table(engine)


def _schema_safety_net_sync() -> None:
    """Runs in every environment after Alembic: patch legacy columns + missing 002 table."""
    ensure_runtime_columns(engine)
    ensure_constitution_versions_table(engine)


def _dispose_engine_sync() -> None:
    engine.dispose()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Migrations first (production + dev): Alembic is the source of truth for schema versioning.
    await asyncio.to_thread(run_alembic_upgrade)
    # Production + dev: idempotent DDL fixes (legacy vaults columns, constitution_versions if missing).
    await asyncio.to_thread(_schema_safety_net_sync)
    # Dev/test: optional create_all + runtime column patches if enabled.
    await asyncio.to_thread(_bootstrap_schema_sync)
    yield
    await asyncio.to_thread(_dispose_engine_sync)


settings = get_settings()

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="TreasuryOS API",
    version="0.1.0",
    description="Constitutional finance backend for TreasuryOS MVP.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_id_and_logging_middleware(request: Request, call_next):
    rid = get_or_create_request_id(request)
    request.state.request_id = rid
    t0 = start_timer()
    response = await call_next(request)
    response.headers["X-Request-Id"] = rid
    await log_request(request, response, elapsed_ms(t0), rid)
    return response

@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    # Public endpoints.
    if request.url.path in ("/health", "/health/db", "/docs", "/openapi.json", "/redoc"):
        return await call_next(request)
    require_api_key(request)
    return await call_next(request)

app.include_router(vaults_router)
app.include_router(proposals_router)
app.include_router(simulations_router)
app.include_router(monitoring_router)
app.include_router(evidence_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "treasuryos-api"}


@app.get("/health/db")
def health_db() -> dict[str, object]:
    """
    DB reachability + critical tables (public). Same auth as /health — not a substitute
    for full monitoring; exposes only booleans / error class for hackathon debugging.
    """
    from sqlalchemy import inspect as sa_inspect, text

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        inv = sa_inspect(engine)
        names = set(inv.get_table_names())
        body: dict[str, object] = {
            "status": "ok",
            "database_reachable": True,
            "tables": {
                "vaults": "vaults" in names,
                "constitution_versions": "constitution_versions" in names,
            },
        }
        if "vaults" not in names or "constitution_versions" not in names:
            body["status"] = "degraded"
        return body
    except Exception as exc:
        logging.getLogger(__name__).warning("health_db failed: %s", exc, exc_info=True)
        return {
            "status": "error",
            "database_reachable": False,
            "error_type": type(exc).__name__,
            "message": str(exc)[:280],
        }

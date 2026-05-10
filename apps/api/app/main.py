import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import engine
from app.db_models import Base
from app.routes.monitoring import router as monitoring_router
from app.routes.proposals import router as proposals_router
from app.routes.simulations import router as simulations_router
from app.routes.vaults import router as vaults_router
from app.services.db_bootstrap import ensure_runtime_columns


def _bootstrap_schema_sync() -> None:
    settings = get_settings()
    if not settings.should_auto_create_schema:
        return
    Base.metadata.create_all(bind=engine)
    ensure_runtime_columns(engine)


def _dispose_engine_sync() -> None:
    engine.dispose()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Avoid blocking the event loop during sync DDL (create_all / inspect).
    await asyncio.to_thread(_bootstrap_schema_sync)
    yield
    await asyncio.to_thread(_dispose_engine_sync)


settings = get_settings()

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

app.include_router(vaults_router)
app.include_router(proposals_router)
app.include_router(simulations_router)
app.include_router(monitoring_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "treasuryos-api"}

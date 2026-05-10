# TreasuryOS

Constitutional Finance for Autonomous Capital.

## Current status

Initial scaffold is ready with:
- `apps/web` (`Next.js 16 + Tailwind`) and first pages:
  - `/` (landing)
  - `/dashboard`
  - `/constitution`
- `apps/api` (`FastAPI`) and deterministic Constitution Engine flow on PostgreSQL:
  - create vault
  - create proposal
  - evaluate proposal (`ALLOW/REJECT`)
  - run simulation
  - inspect monitoring ledger

## Run frontend

```bash
cd apps/web
npm install
npm run dev
```

## Run backend

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/treasuryos
uvicorn app.main:app --reload --port 8000
```

Optional real on-chain execution logging (Mantle mainnet — matches `apps/api/.env.example`):

```bash
set MANTLE_RPC_URL=https://rpc.mantle.xyz
set MANTLE_CHAIN_ID=5000
set EXECUTION_LOG_CONTRACT=0xA22ebFf573BedA62202490A87eCE31C7c91462b9
set TREASURY_EXECUTOR_PRIVATE_KEY=<private_key>
# or
set TREASURY_EXECUTOR_MNEMONIC="word1 word2 ... word12"
```

**Railway:** set the same variable names under the API service (Root Directory `apps/api`). Add `DATABASE_URL`, `APP_ENV`, `CORS_ALLOW_ORIGINS` for production.

## Run Postgres + Redis (Docker)

```bash
cd infra
docker compose -f compose.yml up -d
```

## API tests (constitutional e2e)

```bash
cd apps/api
python -m pip install -r requirements.txt
python -m pytest tests/ -v
```

**CI:** on push/PR to `main`/`master`, GitHub Actions runs the same tests (`.github/workflows/ci.yml`).

## API quick checks

Swagger docs:
- `http://127.0.0.1:8000/docs`

Health:
- `GET /health`
- `POST /proposals/{proposal_id}/execution-record` (without `tx_hash` will send a real transaction when blockchain env vars are set)

## Next build targets

1. ~~Add SQLAlchemy migrations (Alembic) for schema versioning.~~ **Done:** `alembic upgrade head` runs on API startup; baseline revision `001_initial`.
2. ~~Add Redis event feed for decision streaming.~~ **Done:** set `REDIS_URL` → decisions appended on evaluate; `GET /monitoring/decisions/recent`.
3. ~~Add simulation charts with Recharts + Framer Motion transitions.~~ **Done:** `/simulations` — `ComposedChart` (survivability, compliance, drawdown axis) + motion KPIs / sections, `prefers-reduced-motion` respected.
4. ~~Wire `packages/contracts` deployments to Mantle mainnet.~~ **Done:** Hardhat networks `mantle` / `mantleSepolia`; `npm run deploy:mantle` writes `deployments/mantle.json`; API env `EXECUTION_LOG_CONTRACT` + `MANTLE_CHAIN_ID` (default chain id in Python aligned to **5000**). See `packages/contracts/README.md`.
5. ~~Add end-to-end tests for constitutional enforcement flow.~~ **Done:** `cd apps/api && python -m pytest tests/ -v` — SQLite + Alembic on startup; vault → proposal → evaluate (ALLOW/REJECT) → `execution-record` (manual `tx_hash` with chain disabled).

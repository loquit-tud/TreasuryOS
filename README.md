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

Optional real on-chain execution logging (Mantle):

```bash
set MANTLE_RPC_URL=<mantle_rpc_url>
set MANTLE_CHAIN_ID=5000
set EXECUTION_LOG_CONTRACT=<deployed_execution_log_address>
set TREASURY_EXECUTOR_PRIVATE_KEY=<private_key>
# or
set TREASURY_EXECUTOR_MNEMONIC="word1 word2 ... word12"
```

## Run Postgres + Redis (Docker)

```bash
cd infra
docker compose -f compose.yml up -d
```

## API quick checks

Swagger docs:
- `http://127.0.0.1:8000/docs`

Health:
- `GET /health`
- `POST /proposals/{proposal_id}/execution-record` (without `tx_hash` will send a real transaction when blockchain env vars are set)

## Next build targets

1. ~~Add SQLAlchemy migrations (Alembic) for schema versioning.~~ **Done:** `alembic upgrade head` runs on API startup; baseline revision `001_initial`.
2. ~~Add Redis event feed for decision streaming.~~ **Done:** set `REDIS_URL` → decisions appended on evaluate; `GET /monitoring/decisions/recent`.
3. Add simulation charts with Recharts + Framer Motion transitions.
4. Wire `packages/contracts/src` deployments to Mantle mainnet.
5. Add end-to-end tests for constitutional enforcement flow.

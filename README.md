# TreasuryOS

**Constitutional risk layer for autonomous treasuries on Mantle.**

TreasuryOS is a constitutional risk layer for autonomous treasuries on Mantle. AI proposes capital actions. TreasuryOS stress-tests them against treasury law. Unsafe actions are blocked, safe actions are allowed, and decisions can be proven on-chain.

> **Suggested GitHub “About” description:** Constitutional risk layer for autonomous treasuries on Mantle — AI proposes; treasury law allows or blocks; decisions auditable on-chain.

## Judge-ready links

| What | Where |
|------|--------|
| **Live app** | [treasuryos-web-production.up.railway.app](https://treasuryos-web-production.up.railway.app/) |
| **API health** | [treasuryos-backend-production.up.railway.app/health](https://treasuryos-backend-production.up.railway.app/health) |
| **Repository** | [github.com/loquit-tud/TreasuryOS](https://github.com/loquit-tud/TreasuryOS) |
| **On-chain proof** | `packages/contracts` — deploy + verify steps in [`packages/contracts/README.md`](packages/contracts/README.md) |
| **DoraHacks / demo video** | _(add submission URL and video link when published)_ |

**60s demo path:** open the live app → **Live mission control** (`/dashboard`) or **Guided crisis run** (`/demo`).

## What this is (and is not)

- **Is:** A **policy engine** for autonomous treasuries: bind a vault constitution, submit capital intents, get deterministic **ALLOW / REJECT**, run stress simulations, export evidence, and optionally log attestations on Mantle via `ExecutionLog`.
- **Is not:** A lending product, invoice factoring, or credit-line app. Constitutional fields like *non-stable sleeve* caps are **risk limits**, not claims about tokenized real-world receivables.

## Repository layout

- `apps/web` — Next.js UI (landing, dashboard, constitution, simulations, guided demo).
- `apps/api` — FastAPI Constitution Engine, PostgreSQL, optional Mantle execution logging.
- `packages/contracts` — minimal on-chain audit surface (registry + execution log).
- `infra` — Docker Compose for Postgres (and full stack).

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

**Railway:** set the same variable names on the API service (root directory `apps/api`). Add `DATABASE_URL`, `APP_ENV`, `CORS_ALLOW_ORIGINS` for production.

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

## Self-host (Docker)

```bash
cd infra
docker compose -f compose.full.yml up --build
```

See `SELF_HOST.md` for details.

## Production checklist (minimum)

- **Auth**: set `API_KEYS` on the API service and `BACKEND_API_KEY` on the web service.
- **CORS**: `APP_ENV=production` requires explicit `CORS_ALLOW_ORIGINS` (no wildcard).
- **Migrations**: API runs `alembic upgrade head` on startup; ensure DB is reachable during deploy.
- **Observability**: use `X-Request-Id` to trace a single request through Railway logs (JSON per request).
- **Evidence**: `GET /evidence/proposal/{proposal_id}` returns an audit pack (vault, proposal, ledger, constitution versions).
- **On-chain verification**: `GET /monitoring/onchain/execution-log/{tx_hash}` decodes `ExecutionLog` events (read-only).

## API quick checks

- Swagger: `http://127.0.0.1:8000/docs`
- Health: `GET /health`
- `POST /proposals/{proposal_id}/execution-record` (with chain env configured, can submit a real Mantle tx)

## Build history (internal)

1. ~~SQLAlchemy migrations (Alembic)~~ — **Done:** `alembic upgrade head` on API startup; baseline `001_initial`.
2. ~~Redis event feed~~ — **Done:** `REDIS_URL` → decisions on evaluate; `GET /monitoring/decisions/recent`.
3. ~~Simulation charts~~ — **Done:** `/simulations` with Recharts + motion, `prefers-reduced-motion` respected.
4. ~~Contracts on Mantle~~ — **Done:** Hardhat `mantle` / `mantleSepolia`; `npm run deploy:mantle` → `deployments/mantle.json`; API env `EXECUTION_LOG_CONTRACT` + `MANTLE_CHAIN_ID=5000`. See `packages/contracts/README.md`.
5. ~~Constitutional e2e tests~~ — **Done:** `cd apps/api && python -m pytest tests/ -v`.

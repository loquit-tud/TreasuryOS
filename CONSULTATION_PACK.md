# TreasuryOS — Pachet consultanță (trimite acest fișier + screenshot-uri)

**Nu atașa niciodată** `apps/api/.env`, `packages/contracts/.env` sau chei private.

---

## 1. Structură proiect (monorepo)

```
TreasuryOS/
├── README.md, BUILD_PLAN.md
├── apps/
│   ├── api/                    # FastAPI + SQLAlchemy + Alembic
│   │   ├── app/
│   │   │   ├── main.py         # FastAPI app, lifespan, CORS din Settings
│   │   │   ├── config.py       # pydantic-settings (APP_ENV, DATABASE_URL, CORS)
│   │   │   ├── db.py           # engine + SessionLocal
│   │   │   ├── db_models.py    # Vault, Proposal, Simulation, Ledger
│   │   │   ├── routes/         # vaults, proposals, simulations, monitoring
│   │   │   ├── schemas/        # Pydantic API models
│   │   │   └── services/       # constitution_engine, blockchain, mappers, hashing, db_bootstrap
│   │   ├── alembic/            # migrații (001_initial_schema)
│   │   ├── requirements.txt, Procfile, alembic.ini
│   │   └── .env.example
│   └── web/                    # Next.js 15 (App Router)
│       ├── app/                # pages: /, /dashboard, /demo, /constitution, /simulations
│       ├── app/api/proxy/      # same-origin proxy → FastAPI (runtime BACKEND_API_URL)
│       ├── components/         # landing, capital map, law panel, capital flow
│       ├── lib/                # api client, zustand store, constitutional-preview
│       ├── next.config.ts      # standalone, headers, rewrites (build-time API_URL)
│       ├── Dockerfile
│       └── package.json
├── packages/contracts/         # Hardhat: VaultRegistry, ConstitutionRegistry, ExecutionLog
└── infra/compose.yml           # opțional
```

---

## 2. Dashboard — screenshot-uri (le faci tu, 2 minute)

**Nu pot genera pixeli reali din UI aici**; deschide în browser și fă 3–4 capturi (PNG):

| # | URL live | Ce să capturezi |
|---|----------|-----------------|
| 1 | `https://treasuryos-web-production.up.railway.app/` | Landing + „Live capital map” |
| 2 | `https://treasuryos-web-production.up.railway.app/dashboard` | Terminal: survivability, integrity, capital flow, feed |
| 3 | `https://treasuryos-web-production.up.railway.app/demo` | Crisis simulator + secvență |
| 4 | `https://treasuryos-web-production.up.railway.app/constitution` | Law sliders + commit |

Local: `cd apps/web && npm run dev` → `http://localhost:3000/dashboard`.

Atașează fișierele: `01-landing.png`, `02-dashboard.png`, etc.

---

## 3. package.json (frontend `apps/web`)

Vezi fișierul `apps/web/package.json` din repo — sau copiază din mesajul consultantului (versiunea ta curentă include Next 15.x, React 19.x, Recharts 2.x, Zustand, Framer Motion).

---

## 4. Arhitectură backend

- **Framework:** FastAPI, `uvicorn`.
- **Config:** `app/config.py` — `APP_ENV`, `DATABASE_URL`, `CORS_ALLOW_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `AUTO_CREATE_SCHEMA`; validare la pornire (ex. producție fără CORS wildcard).
- **Lifecycle:** `lifespan` în `main.py` — bootstrap schema doar dacă `should_auto_create_schema` (dev/test); DDL sync rulează în `asyncio.to_thread`; la shutdown `engine.dispose()`.
- **DB:** SQLAlchemy 2 + `SessionLocal`; modele în `db_models.py`. Migrații: **Alembic** (`alembic/versions/001_initial_schema.py`). În producție: `alembic upgrade head` (nu te baza doar pe `create_all`).
- **Rute:**
  - `vaults` — creare vault, update constituție
  - `proposals` — creare, evaluare (Constitution Engine), execution-record (opțional tx on-chain)
  - `simulations` — scenarii stress
  - `monitoring` — ledger, health
- **Domeniu:** `services/constitution_engine.py` — reguli deterministe ALLOW/REJECT; `services/blockchain.py` — Mantle + `ExecutionLog` dacă env complet.
- **Contracte Solidity:** `packages/contracts` — deploy separat (Hardhat).

```mermaid
flowchart LR
  Browser[Browser] --> Next[Next.js]
  Next -->|"/api/proxy/*"| Proxy[Route Handler]
  Proxy --> API[FastAPI]
  API --> DB[(PostgreSQL / SQLite dev)]
  API -->|opțional| Chain[Mantle RPC]
```

---

## 5. Ce funcționează live (verificat HTTP)

**Verified** la momentul generării acestui pachet (status HTTP):

| Resursă | URL | Rezultat |
|---------|-----|----------|
| API health | `https://treasuryos-backend-production.up.railway.app/health` | **200** — `{"status":"ok","service":"treasuryos-api"}` |
| Web | `https://treasuryos-web-production.up.railway.app/` | **200** |
| Proxy → API | `https://treasuryos-web-production.up.railway.app/api/proxy/health` | **200** — același JSON ca API |

**Plan / de verificat manual:** flow complet „bind vault → proposal → evaluate → simulate → execution record” în UI; tranzacții on-chain depind de variabilele din `apps/api` (RPC, contract, executor key) — nu le publica.

---

## Cum trimiți pachetul

1. Acest fișier: `CONSULTATION_PACK.md`
2. Folder cu **screenshot-uri** (secțiunea 2)
3. Opțional: export `apps/web/package.json` și `apps/api/requirements.txt` dacă vor detalii de versiuni backend

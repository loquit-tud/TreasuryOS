# Self-host TreasuryOS (local)

This repo is a monorepo. The quickest way to run the full stack locally is Docker Compose.

## Prereqs

- Docker Desktop (Compose v2)

## Run

From repo root:

```bash
cd infra
docker compose -f compose.full.yml up --build
```

Then open:

- Web: `http://localhost:3000`
- API: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Notes

- Default API auth in the compose file sets:
  - `API_KEYS=local-dev-key`
  - Web proxy injects the key via `BACKEND_API_KEY`
- Database is persisted in the `treasuryos_pg_data` volume.


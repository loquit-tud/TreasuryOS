# TreasuryOS - Build Plan (MVP)

Acest document este ghidul nostru de executie pentru a construi un MVP cinematic de `TreasuryOS`:
**"AI proposes. Constitution approves."**

Obiectivul principal:
- Sa demonstram clar ca AI-ul nu poate executa capital direct.
- Sa demonstram ca `Constitution Engine` (determinist) aproba sau blocheaza actiuni.
- Sa avem un demo memorabil: simulare de criza + survivability + audit trail.

---

## 1) Product Definition (ce livram)

### Success criterion (single source of truth)
Un utilizator poate:
1. crea un vault,
2. defini o constitutie financiara,
3. vedea o propunere AI,
4. rula simulare de risc,
5. primi verdict `ALLOW/REJECT`,
6. vedea logul deciziei (si optional proof on-chain).

### Ce NU construim in MVP
- Chatbot generic.
- Zeci de strategii.
- On-chain logic complexa.
- UI de tip "crypto casino".

---

## 2) Technical Stack

### Frontend
- `Next.js 15` (App Router)
- `TailwindCSS`
- `Framer Motion` (animatii subtile, institutionale)
- `Zustand` (state management)
- `Recharts` (risk/simulation charts)

### Backend
- `FastAPI` (Python)
- `PostgreSQL` (state + audit)
- `Redis` (jobs + event feed)

### Blockchain (minimal)
- `Solidity`:
  - Vault Registry
  - Constitution Hash
  - Execution/Event Records
  - Reputation Snapshot

---

## 3) Repository Structure

```text
treasuryos/
  apps/
    web/
    api/
    worker/
  packages/
    contracts/
    policy-engine/
    simulator/
    shared-types/
  docs/
    architecture.md
    demo-script.md
  infra/
    docker/
```

---

## 4) Core Modules (MVP scope)

1. `Constitution Engine` (deterministic, no LLM in decisioning)
2. `Simulation Engine` (3 scenarii de risc)
3. `Proposal/Evaluation Flow` (AI proposal -> policy check -> verdict)
4. `Monitoring Terminal` (dashboard + feed + ledger)
5. `Execution Layer` (mock sau real tx pentru demo)

---

## 5) Database Schema (minimum)

### `vaults`
- id
- name
- constitution_version
- risk_score
- health_score
- created_at

### `constitutions`
- id
- vault_id
- version
- policy_json
- policy_hash
- created_at

### `proposals`
- id
- vault_id
- action
- rationale
- expected_risk_delta
- expected_yield_delta
- status (pending/allowed/rejected/executed)
- rejection_reason
- created_at

### `simulations`
- id
- proposal_id
- scenario
- drawdown
- survival_score
- result_json
- created_at

### `treasury_actions`
- id
- vault_id
- proposal_id
- action
- approved
- tx_hash
- timestamp

---

## 6) API Endpoints (MVP)

- `POST /vaults`
- `POST /vaults/{id}/constitution`
- `POST /vaults/{id}/proposals`
- `POST /proposals/{id}/evaluate`
- `POST /proposals/{id}/simulate`
- `POST /proposals/{id}/execute`
- `GET /vaults/{id}/ledger`
- `GET /vaults/{id}/health`

---

## 7) UI/UX Direction

### Visual language
- Institutional terminal feel (nu "crypto neon").
- Dark palette:
  - Background: `#060816`
  - Panels: `#0F172A`
  - Accent: `#06b6d4`
  - Danger: `#ef4444`
  - Success: `#10b981`
- Typography:
  - Headlines: `Inter Tight`
  - Data: `JetBrains Mono`

### Main screens
1. Dashboard
2. Constitution Panel
3. AI Decision Feed
4. Stress Simulator
5. Decision Ledger

---

## 8) Demo Flow (obligatoriu)

1. User creeaza vault.
2. User sets the constitution.
3. AI propune o mutare riscanta.
4. Constitution Engine blocheaza mutarea.
5. User ruleaza "Black Swan Simulation".
6. Vault supravietuieste in limitele regulilor.
7. User vede explicatia "WHY" + ledger-ul actiunilor.

Acesta este momentul central al demo-ului.

---

## 9) Delivery Plan (7 zile)

### Ziua 1
- Setup monorepo + baze proiect.
- DB schema initiala.

### Ziua 2
- FastAPI endpoints de baza.
- CRUD vault + constitution.

### Ziua 3
- Constitution Engine (determinist).
- Reguli + validari.

### Ziua 4
- Proposal flow + AI Decision Feed (mock data initial).

### Ziua 5
- Simulation Engine (3 scenarii).
- Graphuri + survivability score.

### Ziua 6
- Ledger + execution logs (mock/real tx).
- Polish UI + motion.

### Ziua 7
- Demo script + seed data + test end-to-end.
- Video 2-3 minute.

---

## 10) Definition of Done (MVP)

MVP este gata cand:
- Exista 1 vault complet functional in demo.
- Exista 1 constitutie editabila.
- Exista minim 1 proposal `REJECTED` de constitution.
- Exista minim 1 simulation cu `survival_score`.
- Exista ledger vizual al deciziilor.
- The full flow runs end-to-end without interruptions in the demo.

---

## 11) Next Step (imediat dupa acest document)

Pornim implementarea in ordinea:
1. scaffold backend (`FastAPI`)
2. model DB + migrari
3. constitution evaluator
4. paginile `dashboard` + `constitution`
5. proposal + simulation + ledger


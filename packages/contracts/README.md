# TreasuryOS Contracts (Minimal On-chain Layer)

This folder contains the minimal smart contract layer for TreasuryOS:

- `VaultRegistry.sol`: registers vault identity + active constitution hash
- `ConstitutionRegistry.sol`: stores latest policy hash snapshot
- `ExecutionLog.sol`: emits execution and decision events

## Design principle

On-chain is used for proof and audit, not heavy compute:
- keep policy simulation and AI orchestration off-chain
- log hashes/events on-chain for verifiability

## How to verify (Mantle mainnet deploy)

1. `cd packages/contracts && npm install && npm run compile`
2. Copy `.env.example` → `.env` and set **`DEPLOYER_PRIVATE_KEY`** (or **`DEPLOYER_MNEMONIC`**) with an account funded on Mantle (**native MNT** for gas).
3. Ensure **`MANTLE_MAINNET_RPC_URL`** (default in Hardhat is `https://rpc.mantle.xyz` if unset).
4. Deploy: **`npm run deploy:mantle`**
5. Read `deployments/mantle.json` (gitignored) — copy **`executionLog`** into **`EXECUTION_LOG_CONTRACT`** on the API.
6. On **`apps/api`** / Railway set: **`MANTLE_RPC_URL`**, **`MANTLE_CHAIN_ID=5000`**, **`EXECUTION_LOG_CONTRACT`**, **`TREASURY_EXECUTOR_PRIVATE_KEY`** (or mnemonic). Same RPC as Mantle mainnet.
7. Call **`POST /proposals/{id}/execution-record`** with empty body when chain is configured — API submits **`logAction`** on `ExecutionLog`.

Sepolia testnet: `npm run deploy:mantle-sepolia`, use **`MANTLE_CHAIN_ID=5003`** and that network’s RPC.

### Quickstart (local compile only)

```bash
npm install
npm run compile
```

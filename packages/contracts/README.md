# TreasuryOS Contracts (Minimal On-chain Layer)

This folder contains the minimal smart contract layer for TreasuryOS:

- `VaultRegistry.sol`: registers vault identity + active constitution hash
- `ConstitutionRegistry.sol`: stores latest policy hash snapshot
- `ExecutionLog.sol`: emits execution and decision events

## Design principle

On-chain is used for proof and audit, not heavy compute:
- keep policy simulation and AI orchestration off-chain
- log hashes/events on-chain for verifiability

## Suggested next step

Hardhat is already configured in this folder.

### Quickstart

```bash
npm install
npm run compile
```

Create `.env` from `.env.example` and provide:
- `DEPLOYER_PRIVATE_KEY` **or** `DEPLOYER_MNEMONIC`
- `MANTLE_MAINNET_RPC_URL`

Deploy to Mantle Mainnet:

```bash
npm run deploy:mantle
```

Then set backend env vars in `apps/api`:
- `MANTLE_RPC_URL`
- `MANTLE_CHAIN_ID=5000`
- `EXECUTION_LOG_CONTRACT=<deployed address>`
- `TREASURY_EXECUTOR_PRIVATE_KEY`

After these are set, `POST /proposals/{proposal_id}/execution-record` can emit a real `TreasuryAction` event.

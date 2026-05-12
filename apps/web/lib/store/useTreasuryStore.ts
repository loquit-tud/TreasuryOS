"use client";

import { create } from "zustand";

import {
  type Constitution,
  type Decision,
  type LedgerEntry,
  type Proposal,
  type ProposalPayload,
  type SimulationResult,
  type Vault,
  createProposal,
  createVault,
  defaultConstitution,
  evaluateProposal,
  fetchHealth,
  fetchLedger,
  fetchSimulationHistory,
  logExecutionRecord,
  simulateProposal,
  updateConstitution,
} from "@/lib/api";

type HealthState = {
  status: string;
  health_score?: number;
  risk_score?: number;
  proposal_count?: number;
  rejection_count?: number;
};

type TreasuryState = {
  vault: Vault | null;
  proposal: Proposal | null;
  decision: Decision | null;
  simulation: SimulationResult | null;
  simulationHistory: SimulationResult[];
  ledger: LedgerEntry[];
  health: HealthState | null;
  isLoading: boolean;
  error: string | null;
  initializeDemo: () => Promise<void>;
  createCompliantProposal: () => Promise<void>;
  runEvaluation: () => Promise<void>;
  runBlackSwan: () => Promise<void>;
  markExecutionLogged: () => Promise<void>;
  refreshLedger: () => Promise<void>;
  refreshSimulationHistory: () => Promise<void>;
  saveConstitution: (constitution: Constitution) => Promise<void>;
  /** Full judge path: vault → REJECT risky intent → shock → ALLOW compliant → execution log (matches /demo sequence). */
  runJudgeDemo90s: () => Promise<void>;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const defaultProposalPayload = {
  action: "REBALANCE" as const,
  amount_pct: 25,
  rationale:
    "Volatility regime changed and yield spread increased. Proposed reallocation aims higher carry.",
  expected_risk_delta: 1.8,
  expected_yield_delta: 0.9,
  proposed_stable_reserve_pct: 34,
  proposed_drawdown_pct: 6.1,
  proposed_rwa_exposure_pct: 65,
  proposed_leverage_enabled: false,
};

const compliantProposalPayload: ProposalPayload = {
  action: "REBALANCE",
  amount_pct: 12,
  rationale: "Defensive rebalance that preserves reserve requirements and drawdown limits.",
  expected_risk_delta: -0.6,
  expected_yield_delta: 0.3,
  proposed_stable_reserve_pct: 44,
  proposed_drawdown_pct: 3.1,
  proposed_rwa_exposure_pct: 52,
  proposed_leverage_enabled: false,
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

export const useTreasuryStore = create<TreasuryState>((set, get) => ({
  vault: null,
  proposal: null,
  decision: null,
  simulation: null,
  simulationHistory: [],
  ledger: [],
  health: null,
  isLoading: false,
  error: null,

  initializeDemo: async () => {
    set({ isLoading: true, error: null });
    try {
      const vault = await createVault("Mantle Conservative Yield Vault", defaultConstitution);
      const proposal = await createProposal(vault.id, defaultProposalPayload);
      const health = await fetchHealth(vault.id);
      set({ vault, proposal, health, decision: null, simulation: null });
      await get().refreshLedger();
      await get().refreshSimulationHistory();
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  runEvaluation: async () => {
    const proposal = get().proposal;
    const vault = get().vault;
    if (!proposal || !vault) {
      set({ error: "Initialize demo flow before evaluation." });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const decision = await evaluateProposal(proposal.id);
      const health = await fetchHealth(vault.id);
      set({ decision, health });
      await get().refreshLedger();
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  createCompliantProposal: async () => {
    const vault = get().vault;
    if (!vault) {
      set({ error: "Initialize demo flow before creating a compliant proposal." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const proposal = await createProposal(vault.id, compliantProposalPayload);
      set({ proposal, decision: null, simulation: null });
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  runBlackSwan: async () => {
    const proposal = get().proposal;
    if (!proposal) {
      set({ error: "Create a proposal before running simulation." });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const simulation = await simulateProposal(proposal.id);
      set({ simulation });
      await get().refreshSimulationHistory();
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  markExecutionLogged: async () => {
    const proposal = get().proposal;
    const vault = get().vault;
    if (!proposal || !vault) {
      set({ error: "Initialize and evaluate a proposal first." });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      await logExecutionRecord(proposal.id);
      set({
        vault: { ...vault, chain_status: "ONCHAIN_LOGGED" },
        proposal: { ...proposal, status: "EXECUTED" },
      });
      await get().refreshLedger();
      const health = await fetchHealth(vault.id);
      set({ health });
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshLedger: async () => {
    const vault = get().vault;
    if (!vault) {
      return;
    }

    try {
      const ledger = await fetchLedger(vault.id);
      set({ ledger });
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }
  },

  refreshSimulationHistory: async () => {
    const vault = get().vault;
    if (!vault) {
      return;
    }

    try {
      const simulationHistory = await fetchSimulationHistory(vault.id);
      set({ simulationHistory });
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }
  },

  saveConstitution: async (constitution) => {
    const vault = get().vault;
    if (!vault) {
      set({ error: "Activate a vault first to arm the constitution." });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const updatedVault = await updateConstitution(vault.id, constitution);
      set({ vault: updatedVault });
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  runJudgeDemo90s: async () => {
    const run = get();
    set({ isLoading: true, error: null });
    try {
      await run.initializeDemo();
      await sleep(400);
      let st = get();
      if (!st.vault || !st.proposal) {
        throw new Error(st.error || "Demo init failed — check API connectivity.");
      }

      await run.runEvaluation();
      st = get();
      if (st.decision?.decision !== "REJECT") {
        throw new Error(
          st.error ||
            `Expected REJECT on aggressive proposal, got ${st.decision?.decision ?? "NONE"}.`
        );
      }

      await run.runBlackSwan();
      await sleep(600);

      await run.createCompliantProposal();
      st = get();
      if (!st.proposal) {
        throw new Error(st.error || "Failed to create compliant proposal.");
      }

      await run.runEvaluation();
      await sleep(500);
      st = get();
      if (st.decision?.decision !== "ALLOW") {
        throw new Error(
          st.error ||
            `Expected ALLOW on compliant proposal, got ${st.decision?.decision ?? "NONE"}.`
        );
      }

      await run.markExecutionLogged();
      await sleep(300);
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },
}));

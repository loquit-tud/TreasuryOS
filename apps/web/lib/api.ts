const API_BASE_URL = "/api/proxy";

export type Constitution = {
  stable_reserve_min_pct: number;
  max_drawdown_pct: number;
  rwa_exposure_max_pct: number;
  leverage_allowed: boolean;
  emergency: {
    volatility_threshold_pct: number;
    action: "DE_RISK" | "PAUSE";
  };
};

export type Vault = {
  id: string;
  name: string;
  constitution: Constitution;
  constitution_hash: string;
  chain_status: "OFFCHAIN_ONLY" | "CHAIN_READY" | "ONCHAIN_LOGGED";
  health_score: number;
  risk_score: number;
  created_at: string;
};

export type ProposalPayload = {
  action: "REBALANCE" | "SWAP" | "HEDGE";
  amount_pct: number;
  rationale: string;
  expected_risk_delta: number;
  expected_yield_delta: number;
  proposed_stable_reserve_pct: number;
  proposed_drawdown_pct: number;
  proposed_rwa_exposure_pct: number;
  proposed_leverage_enabled: boolean;
};

export type Proposal = {
  id: string;
  vault_id: string;
  payload: ProposalPayload;
  status: "PENDING" | "ALLOW" | "REJECT" | "EXECUTED";
  reasons: string[];
  violated_rules: string[];
  created_at: string;
};

export type Decision = {
  decision: "ALLOW" | "REJECT" | "ESCALATE";
  reasons: string[];
  violated_rules: string[];
};

export type SimulationResult = {
  proposal_id: string;
  scenario: string;
  drawdown_pct: number;
  survival_score: number;
  policy_compliance: number;
  details: Record<string, string>;
  created_at: string;
};

export type LedgerEntry = {
  id: string;
  vault_id: string;
  proposal_id: string;
  action: string;
  verdict: "ALLOW" | "REJECT" | "EXECUTED";
  reason: string;
  policy_hash: string;
  execution_status: "OFFCHAIN_ONLY" | "CHAIN_READY" | "ONCHAIN_LOGGED";
  tx_hash?: string | null;
  timestamp: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const raw = await response.text();
    let detail = raw.trim();
    try {
      const parsed = JSON.parse(raw) as { detail?: unknown; error?: string; message?: string };
      if (parsed.detail != null) {
        detail =
          typeof parsed.detail === "string"
            ? parsed.detail
            : JSON.stringify(parsed.detail);
      } else if (parsed.message) {
        detail = parsed.message;
      } else if (parsed.error) {
        detail = parsed.error;
      }
    } catch {
      /* keep raw body */
    }
    if (!detail) detail = response.statusText || "Unknown error";
    throw new Error(`API ${response.status}: ${detail.slice(0, 800)}`);
  }

  return response.json() as Promise<T>;
}

export const defaultConstitution: Constitution = {
  stable_reserve_min_pct: 40,
  max_drawdown_pct: 5,
  rwa_exposure_max_pct: 60,
  leverage_allowed: false,
  emergency: {
    volatility_threshold_pct: 30,
    action: "DE_RISK",
  },
};

export function createVault(name: string, constitution: Constitution): Promise<Vault> {
  return request<Vault>("/vaults", {
    method: "POST",
    body: JSON.stringify({ name, constitution }),
  });
}

export function updateConstitution(vaultId: string, constitution: Constitution): Promise<Vault> {
  return request<Vault>(`/vaults/${vaultId}/constitution`, {
    method: "PUT",
    body: JSON.stringify(constitution),
  });
}

export function createProposal(vaultId: string, payload: ProposalPayload): Promise<Proposal> {
  return request<Proposal>(`/proposals/vault/${vaultId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function evaluateProposal(proposalId: string): Promise<Decision> {
  return request<Decision>(`/proposals/${proposalId}/evaluate`, { method: "POST" });
}

export function logExecutionRecord(
  proposalId: string,
  txHash?: string
): Promise<{ status: string; tx_hash: string }> {
  return request<{ status: string; tx_hash: string }>(`/proposals/${proposalId}/execution-record`, {
    method: "POST",
    body: JSON.stringify({ tx_hash: txHash ?? null }),
  });
}

export function simulateProposal(proposalId: string): Promise<SimulationResult> {
  return request<SimulationResult>(`/simulations/proposal/${proposalId}`, {
    method: "POST",
    body: JSON.stringify({ scenario: "BLACK_SWAN", shock_strength_pct: 22 }),
  });
}

export function fetchSimulationHistory(vaultId: string): Promise<SimulationResult[]> {
  return request<SimulationResult[]>(`/simulations/vault/${vaultId}`);
}

export function fetchLedger(vaultId: string): Promise<LedgerEntry[]> {
  return request<LedgerEntry[]>(`/monitoring/vault/${vaultId}/ledger`);
}

export function fetchHealth(vaultId: string): Promise<{
  status: string;
  health_score?: number;
  risk_score?: number;
  proposal_count?: number;
  rejection_count?: number;
}> {
  return request(`/monitoring/vault/${vaultId}/health`);
}

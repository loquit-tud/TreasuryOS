/** Client-side heuristic for instant “economic game” feedback (not on-chain). */
export type LawPreviewParams = {
  stable_reserve_min_pct: number;
  max_drawdown_pct: number;
  rwa_exposure_max_pct: number;
  leverage_allowed: boolean;
};

export type LawPreviewResult = {
  survivability: number;
  risk: number;
  fragility: number;
  label: "HIGH" | "MODERATE" | "ELEVATED" | "CRITICAL";
};

export function previewLawImpact(p: LawPreviewParams): LawPreviewResult {
  let fragility = 8;
  fragility += p.leverage_allowed ? 32 : 0;
  fragility += Math.max(0, 48 - p.stable_reserve_min_pct) * 0.55;
  fragility += p.rwa_exposure_max_pct * 0.14;
  fragility += p.max_drawdown_pct * 2.4;

  const survivability = Math.round(Math.max(0, Math.min(100, 100 - fragility)));
  const risk = Math.round(Math.max(0, Math.min(100, fragility * 0.9 + 12)));
  const fragilityScore = Math.round(Math.max(0, Math.min(100, fragility)));

  let label: LawPreviewResult["label"] = "MODERATE";
  if (survivability >= 82) label = "HIGH";
  else if (survivability >= 62) label = "MODERATE";
  else if (survivability >= 42) label = "ELEVATED";
  else label = "CRITICAL";

  return { survivability, risk, fragility: fragilityScore, label };
}

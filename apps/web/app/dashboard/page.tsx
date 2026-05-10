"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import Link from "next/link";

/** React Flow touches DOM/window — must not SSR (Docker/Linux builds fail otherwise). */
const CapitalOrganismFlow = dynamic(
  () =>
    import("@/components/capital-organism-flow").then((mod) => mod.CapitalOrganismFlow),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(420px,55vh)] min-h-[300px] items-center justify-center rounded-md border border-white/[0.06] bg-[#050814] font-mono text-xs text-slate-600">
        Initializing capital graph…
      </div>
    ),
  }
);
import {
  ConstitutionalNegotiationFeed,
  type NegotiationLine,
} from "@/components/constitutional-negotiation-feed";
import { previewLawImpact } from "@/lib/constitutional-preview";
import { useTreasuryStore } from "@/lib/store/useTreasuryStore";

export default function DashboardPage() {
  const {
    vault,
    proposal,
    decision,
    simulation,
    ledger,
    health,
    isLoading,
    error,
    initializeDemo,
    createCompliantProposal,
    runEvaluation,
    runBlackSwan,
    markExecutionLogged,
  } = useTreasuryStore();

  const lawPreview = useMemo(() => {
    if (!vault) return null;
    return previewLawImpact({
      stable_reserve_min_pct: vault.constitution.stable_reserve_min_pct,
      max_drawdown_pct: vault.constitution.max_drawdown_pct,
      rwa_exposure_max_pct: vault.constitution.rwa_exposure_max_pct,
      leverage_allowed: vault.constitution.leverage_allowed,
    });
  }, [vault]);

  const survivability = simulation?.survival_score ?? lawPreview?.survivability ?? null;
  const survivabilitySub = simulation
    ? "Vault remains compliant under modeled crisis conditions."
    : vault
      ? "Baseline from encoded law — inject shock for a live survivability read."
      : "No governed vault bound — initialize to begin telemetry.";

  const stressActive = Boolean(simulation && simulation.drawdown_pct > 7);
  const defensivePulse = decision?.decision === "ALLOW";
  const blockPulse = decision?.decision === "REJECT";

  const integrityRows = useMemo(() => {
    if (!vault) {
      return [
        { ok: false, text: "Liquidity mandate — no vault bound" },
        { ok: false, text: "Drawdown limits — awaiting constitution" },
        { ok: false, text: "Leverage policy — unknown" },
      ];
    }
    const c = vault.constitution;
    const reserveBreached =
      proposal &&
      proposal.payload.proposed_stable_reserve_pct < c.stable_reserve_min_pct;
    const drawdownBreached =
      proposal && proposal.payload.proposed_drawdown_pct > c.max_drawdown_pct;
    const leverageBreached =
      proposal && proposal.payload.proposed_leverage_enabled && !c.leverage_allowed;

    return [
      {
        ok: !reserveBreached,
        text: reserveBreached
          ? "Stable reserve mandate — VIOLATED by active proposal"
          : "Liquidity mandate enforced",
      },
      {
        ok: !drawdownBreached,
        text: drawdownBreached
          ? "Drawdown ceiling — VIOLATED by active proposal"
          : "Drawdown limits respected",
      },
      {
        ok: !leverageBreached,
        text: leverageBreached
          ? "Leverage — REJECTED under constitution"
          : c.leverage_allowed
            ? "Leverage — permitted under law (elevated fragility)"
            : "Aggressive leverage rejected by policy",
      },
    ];
  }, [vault, proposal]);

  const riskEvents = useMemo(() => {
    const rows: string[] = [];
    if (!vault) {
      rows.push("No active vault — risk plane not instrumented.");
      return rows;
    }
    if (simulation) {
      rows.push(
        `Stress path modeled: drawdown ${simulation.drawdown_pct.toFixed(1)}% · survival score ${simulation.survival_score}.`
      );
    } else {
      rows.push("Pressure nominal — no shock injected. Constitutional guard idle.");
    }
    if (decision?.decision === "REJECT") {
      rows.push("Constitutional lock: AI structure blocked — survivability preserved.");
    }
    if (decision?.decision === "ALLOW") {
      rows.push("Constitution cleared defensive realignment.");
    }
    return rows;
  }, [vault, simulation, decision]);

  const negotiationLines = useMemo((): NegotiationLine[] => {
    if (!vault) {
      return [];
    }
    const lines: NegotiationLine[] = [];
    lines.push({
      role: "SYSTEM",
      text: "Correlation book unstable — monitoring reserve drift and leverage requests.",
    });
    if (proposal) {
      lines.push({
        role: "AI",
        text: `${proposal.payload.action} · ${proposal.payload.amount_pct}% — ${proposal.payload.rationale.slice(0, 96)}${proposal.payload.rationale.length > 96 ? "…" : ""}`,
      });
    }
    if (decision) {
      if (decision.decision === "REJECT") {
        lines.push({
          role: "CONSTITUTION",
          text: `Rejected. ${decision.reasons[0] ?? "Policy violation."}`,
        });
      } else if (decision.decision === "ALLOW") {
        lines.push({
          role: "CONSTITUTION",
          text: `Cleared. ${decision.reasons[0] ?? "Compliant with encoded mandates."}`,
        });
      }
    } else if (proposal) {
      lines.push({ role: "CONSTITUTION", text: "Pending evaluation — law not yet invoked." });
    }
    if (simulation) {
      lines.push({
        role: "STRESS",
        text: `Black swan path · survivability ${simulation.survival_score} · compliance ${simulation.policy_compliance}.`,
      });
    }
    return lines;
  }, [vault, proposal, decision, simulation]);

  const constitutionActive = Boolean(vault);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10 md:px-10">
      {/* Top bar — branding is law, not “dashboard” */}
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs ${
              constitutionActive
                ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-300"
                : "border-slate-700 bg-slate-900/50 text-slate-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${constitutionActive ? "bg-emerald-400 constitution-status-pulse" : "bg-slate-600"}`}
              aria-hidden
            />
            Constitution status: {constitutionActive ? "ACTIVE" : "STANDBY"}
          </div>
          <p className="font-mono text-[10px] text-slate-600">
            {vault ? `${vault.id}` : "No binding"}
          </p>
        </div>
        <Link href="/demo" className="font-mono text-xs text-rose-400/90 underline-offset-4 hover:underline">
          Run black swan →
        </Link>
      </header>

      {/* Main character — survivability */}
      <section className="relative overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-[#0a1020] to-[#060816] p-6 md:p-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-500/80">Survivability index</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:gap-10">
          <p className="font-mono text-6xl font-semibold tabular-nums leading-none text-cyan-300 md:text-8xl lg:text-9xl">
            {survivability !== null ? survivability : "—"}
            <span className="ml-1 align-top text-3xl font-medium text-slate-600 md:text-4xl">/100</span>
          </p>
          <div className="max-w-md pb-1">
            <p className="text-base font-medium leading-snug text-slate-200">THIS SYSTEM SURVIVES.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{survivabilitySub}</p>
          </div>
        </div>
        {health ? (
          <p className="mt-8 font-mono text-[10px] text-slate-600">
            proposals {health.proposal_count ?? 0} · constitutional rejects {health.rejection_count ?? 0}
          </p>
        ) : null}
      </section>

      <section className="panel p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Constitution integrity</h2>
        <ul className="mt-5 space-y-3 font-mono text-sm">
          {integrityRows.map((row) => (
            <li
              key={row.text}
              className={row.ok ? "text-emerald-400/95" : "text-rose-400/95"}
            >
              {row.ok ? "✓ " : "✕ "}
              {row.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
            Constitutional capital organism
          </h2>
          <Link href="/simulations" className="text-xs text-cyan-500/90 underline-offset-4 hover:underline">
            Stress lab →
          </Link>
        </div>
        <CapitalOrganismFlow
          stressActive={stressActive}
          defensivePulse={defensivePulse}
          blockPulse={blockPulse}
        />
      </section>

      <section className="panel p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Active risk events</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {riskEvents.map((line) => (
            <li key={line} className="border-l-2 border-amber-500/25 pl-3">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel border-cyan-500/15 bg-[#080c1c] p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-rose-400/60">
          Ongoing constitutional negotiation
        </h2>
        <div className="mt-4">
          <ConstitutionalNegotiationFeed liveLines={negotiationLines} />
        </div>
      </section>

      <section className="panel-subtle p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Operations</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void initializeDemo()}
            disabled={isLoading}
            className="rounded-md border border-white/[0.1] px-3 py-2 font-mono text-xs text-slate-300 hover:border-cyan-500/40 disabled:opacity-50"
          >
            Bind demo vault
          </button>
          <button
            type="button"
            onClick={() => void createCompliantProposal()}
            disabled={isLoading || !vault}
            className="rounded-md border border-white/[0.1] px-3 py-2 font-mono text-xs text-slate-300 hover:border-cyan-500/40 disabled:opacity-50"
          >
            Compliant proposal
          </button>
          <button
            type="button"
            onClick={() => void runEvaluation()}
            disabled={isLoading || !proposal}
            className="rounded-md border border-white/[0.1] px-3 py-2 font-mono text-xs text-slate-300 hover:border-cyan-500/40 disabled:opacity-50"
          >
            Evaluate
          </button>
          <button
            type="button"
            onClick={() => void runBlackSwan()}
            disabled={isLoading || !proposal}
            className="rounded-md border border-rose-500/20 px-3 py-2 font-mono text-xs text-rose-200/90 hover:border-rose-500/50 disabled:opacity-50"
          >
            Inject shock
          </button>
          <button
            type="button"
            onClick={() => void markExecutionLogged()}
            disabled={isLoading || !proposal || !decision || decision.decision !== "ALLOW"}
            className="rounded-md border border-emerald-500/25 px-3 py-2 font-mono text-xs text-emerald-300/90 hover:border-emerald-500/50 disabled:opacity-50"
          >
            Log execution
          </button>
        </div>
        {error ? <p className="mt-3 font-mono text-xs text-rose-400">{error}</p> : null}
      </section>

      <section className="pb-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Recent determinations</h2>
        <div className="mt-3 space-y-2">
          {ledger.length === 0 ? (
            <p className="text-sm text-slate-600">No ledger rows yet.</p>
          ) : (
            ledger.slice(0, 4).map((entry) => (
              <p key={entry.id} className="font-mono text-xs text-slate-500">
                {entry.verdict} · {entry.action} · {entry.reason.slice(0, 100)}
                {entry.reason.length > 100 ? "…" : ""}
              </p>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

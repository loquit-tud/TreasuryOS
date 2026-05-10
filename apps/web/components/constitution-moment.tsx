"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Moment = {
  ts: string;
  label: string;
  detail: string;
  tone: "system" | "ai" | "law" | "stress";
};

const toneStyle: Record<Moment["tone"], string> = {
  system: "border-white/[0.08] text-slate-200",
  ai: "border-amber-500/25 text-amber-100",
  law: "border-cyan-500/20 text-cyan-100",
  stress: "border-rose-500/35 text-rose-100",
};

export function ConstitutionMoment({
  vaultId,
  proposalId,
  verdict,
  reason,
  stressActive,
}: {
  vaultId?: string;
  proposalId?: string;
  verdict?: "ALLOW" | "REJECT" | "ESCALATE" | "PENDING";
  reason?: string;
  stressActive: boolean;
}) {
  const reduceMotion = useReducedMotion();

  const moments = useMemo((): Moment[] => {
    if (!vaultId) return [];
    const now = new Date();
    const t = (offsetSec: number) =>
      new Date(now.getTime() + offsetSec * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const out: Moment[] = [
      {
        ts: t(-12),
        label: "Vault online",
        detail: `Autonomous vault armed (${vaultId}).`,
        tone: "system",
      },
    ];

    if (proposalId) {
      out.push({
        ts: t(-7),
        label: "Capital intent broadcast",
        detail: `AI submits structure (${proposalId}).`,
        tone: "ai",
      });
    }

    if (stressActive) {
      out.push({
        ts: t(-4),
        label: "Systemic pressure rising",
        detail: "Shock injected — liquidity thinning, drawdown curve steepening.",
        tone: "stress",
      });
    }

    if (verdict && verdict !== "PENDING") {
      out.push({
        ts: t(0),
        label: verdict === "REJECT" ? "CONSTITUTION ENFORCED" : "Constitution cleared",
        detail: reason || (verdict === "REJECT" ? "Policy violation blocked." : "Compliant path authorized."),
        tone: "law",
      });
    } else if (proposalId) {
      out.push({
        ts: t(0),
        label: "Awaiting constitutional review",
        detail: "Law not yet invoked.",
        tone: "law",
      });
    }

    return out.slice(-5);
  }, [vaultId, proposalId, verdict, reason, stressActive]);

  const lock = verdict === "REJECT";
  const clear = verdict === "ALLOW";

  return (
    <section className="panel border-white/[0.08] bg-[#060918] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">Constitution moment</p>
          <p className="mt-2 text-sm text-slate-300">
            A single scene judges remember: pressure rises, AI reaches, law intervenes, capital survives.
          </p>
        </div>
        <AnimatePresence>
          {lock || clear ? (
            <motion.div
              key={lock ? "lock" : "clear"}
              initial={reduceMotion ? false : { opacity: 0, y: -6 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              className={`rounded-md border px-3 py-2 font-mono text-xs ${
                lock
                  ? "border-rose-500/45 bg-rose-950/35 text-rose-100 constitutional-rejection-pulse"
                  : "border-emerald-500/35 bg-emerald-950/25 text-emerald-200"
              }`}
            >
              {lock ? "CONSTITUTION ENFORCED" : "CONSTITUTION CLEARED"}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-5 space-y-2 font-mono text-xs">
        {moments.length === 0 ? (
          <p className="text-slate-600">Activate a vault to start the narrative timeline.</p>
        ) : (
          moments.map((m) => (
            <div key={`${m.ts}-${m.label}`} className={`flex gap-3 border-l-2 pl-3 ${toneStyle[m.tone]}`}>
              <span className="w-14 shrink-0 text-[10px] uppercase tracking-wider text-slate-500">{m.ts}</span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] opacity-90">{m.label}</p>
                <p className="mt-1 text-[12px] text-slate-300/90">{m.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}


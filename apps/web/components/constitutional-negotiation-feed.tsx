"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type NegotiationLine = {
  role: "AI" | "CONSTITUTION" | "SYSTEM" | "STRESS";
  text: string;
};

const idleTension: NegotiationLine[] = [
  { role: "AI", text: "Increase exposure to yield-bearing sleeve — mETH carry attractive." },
  { role: "CONSTITUTION", text: "Rejected. Stable reserve threshold would be violated." },
  { role: "SYSTEM", text: "Negotiation channel open — awaiting compliant structure." },
  { role: "AI", text: "Propose +18% risk budget to capture term structure dislocation." },
  { role: "CONSTITUTION", text: "Rejected. Drawdown envelope exceeded under stress path." },
];

const roleStyle: Record<NegotiationLine["role"], string> = {
  AI: "text-amber-200/95 border-amber-500/25 bg-amber-950/20",
  CONSTITUTION: "text-cyan-100/95 border-cyan-500/20 bg-cyan-950/15",
  SYSTEM: "text-slate-400 border-white/[0.06] bg-transparent",
  STRESS: "text-rose-200/95 border-rose-500/30 bg-rose-950/20",
};

export function ConstitutionalNegotiationFeed({
  liveLines,
}: {
  /** When bound to a vault, merged with rotating tension so the feed never feels dead. */
  liveLines: NegotiationLine[];
}) {
  const reduceMotion = useReducedMotion();
  const [idleOffset, setIdleOffset] = useState(0);

  useEffect(() => {
    if (reduceMotion || liveLines.length > 0) return;
    const t = window.setInterval(() => setIdleOffset((o) => (o + 1) % idleTension.length), 3800);
    return () => window.clearInterval(t);
  }, [reduceMotion, liveLines.length]);

  const display = useMemo(() => {
    if (liveLines.length > 0) {
      return liveLines.slice(-8);
    }
    const out: NegotiationLine[] = [];
    for (let i = 0; i < 4; i++) {
      out.push(idleTension[(idleOffset + i) % idleTension.length]!);
    }
    return out;
  }, [liveLines, idleOffset]);

  return (
    <div className="space-y-2 font-mono text-[11px] leading-relaxed md:text-xs">
      <AnimatePresence initial={false} mode="popLayout">
        {display.map((line, idx) => (
          <motion.div
            key={`${liveLines.length > 0 ? "live" : "idle"}-${idleOffset}-${idx}-${line.role}`}
            layout
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-3 border-l-2 py-2 pl-3 pr-2 ${roleStyle[line.role]}`}
          >
            <span className="shrink-0 w-28 text-[10px] uppercase tracking-wider opacity-80">[{line.role}]</span>
            <span className="text-slate-200/95">{line.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {liveLines.length === 0 ? (
        <p className="pt-1 text-[10px] uppercase tracking-wider text-slate-600">Synthetic negotiation — bind vault for live feed</p>
      ) : null}
    </div>
  );
}

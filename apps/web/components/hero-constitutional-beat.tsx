"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Phase = "ai" | "violation" | "guard";

/**
 * The iconic moment: AI greed → constitutional block (red pulse) → guardian calm.
 * Loops for the hero — demonstrates before the user reads paragraphs.
 */
export function HeroConstitutionalBeat() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("ai");

  useEffect(() => {
    if (reduceMotion) return;
    const seq: Phase[] = ["ai", "violation", "guard"];
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % seq.length;
      setPhase(seq[i]!);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative mt-10 w-full max-w-xl border border-white/[0.1] bg-[#050814]/90 p-5 md:p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
        Live constitutional organism
      </p>

      <div className="relative mt-5 min-h-[140px]">
        <AnimatePresence mode="wait">
          {phase === "ai" ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400/90">
                AI proposal detected
              </p>
              <p className="font-mono text-lg text-amber-100 md:text-xl">+32% leverage expansion</p>
              <p className="text-sm text-amber-200/60">Recovery path — maximize carry under stress.</p>
            </motion.div>
          ) : null}

          {phase === "violation" ? (
            <motion.div
              key="violation"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="constitutional-rejection-pulse space-y-2 rounded-md border border-rose-500/50 bg-rose-950/40 px-4 py-3"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300">
                Constitution violation
              </p>
              <p className="font-mono text-xl text-rose-100 md:text-2xl">BLOCKED</p>
              <p className="text-sm text-rose-200/75">Survivability mandate — reserve floor breached.</p>
            </motion.div>
          ) : null}

          {phase === "guard" ? (
            <motion.div
              key="guard"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-500/90">
                Emergency preservation
              </p>
              <p className="font-mono text-lg text-slate-100 md:text-xl">Defensive liquidity posture</p>
              <p className="text-sm text-slate-400">Capital re-routed under encoded law — system survives.</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex gap-1.5">
        {(["ai", "violation", "guard"] as const).map((p) => (
          <span
            key={p}
            className={`h-1 flex-1 rounded-full transition-colors ${
              phase === p ? (p === "violation" ? "bg-rose-500" : "bg-cyan-400") : "bg-slate-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

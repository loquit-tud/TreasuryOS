"use client";

import Link from "next/link";
import { useState } from "react";

import { CapitalMapBackground } from "@/components/capital-map-background";
import { HeroConstitutionalBeat } from "@/components/hero-constitutional-beat";
import { InteractiveLawPanel } from "@/components/interactive-law-panel";
import type { LawPreviewParams } from "@/lib/constitutional-preview";
import { defaultConstitution } from "@/lib/api";

export function HomeLanding() {
  const [laws, setLaws] = useState<LawPreviewParams>({
    stable_reserve_min_pct: defaultConstitution.stable_reserve_min_pct,
    max_drawdown_pct: defaultConstitution.max_drawdown_pct,
    rwa_exposure_max_pct: defaultConstitution.rwa_exposure_max_pct,
    leverage_allowed: defaultConstitution.leverage_allowed,
  });

  return (
    <div className="flex min-h-full flex-col">
      {/* Demonstrate first — explain minimally */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <CapitalMapBackground />
        <div className="relative z-10 mx-auto flex min-h-[92vh] w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16 md:flex-row md:items-center md:px-10 md:py-20">
          <div className="max-w-xl flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">TreasuryOS</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.06] tracking-tight text-slate-50 md:text-5xl lg:text-6xl">
              Rules for money that runs itself.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-300 md:text-lg">
              <span className="font-medium text-slate-200">
                TreasuryOS connects to a live API:{" "}
              </span>
              an autonomous treasury submits <strong className="text-slate-100">capital intents</strong> (what it wants
              to do). Your <strong className="text-slate-100">vault constitution</strong> (risk limits written in advance)
              says <strong className="text-cyan-300/95">ALLOW</strong> or <strong className="text-rose-300/95">BLOCK</strong>.
              Under stress you run a crisis scenario and watch survivability react.
            </p>
            <p className="mt-6 text-lg font-medium text-slate-300 md:text-xl">
              AI pushes for return.{" "}
              <span className="text-cyan-400/95">The constitution decides if the system survives it.</span>
            </p>
            <div className="mt-8 rounded-lg border border-white/[0.08] bg-[#050814]/85 px-4 py-4 font-mono text-[11px] leading-relaxed text-slate-400 md:text-xs">
              <p className="uppercase tracking-[0.2em] text-slate-500">What you do here (≈60s)</p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-slate-300">
                <li>
                  Open <span className="text-slate-200">Live mission control</span> — bind a vault, see a risky intent,
                  invoke the constitution.
                </li>
                <li>
                  Hit <span className="text-rose-200/90">systemic shock</span> — the map and survivability pulse like a real
                  control room.
                </li>
                <li>
                  Optional: log an attestation on Mantle when the API is configured (otherwise it stays off-chain).
                </li>
              </ol>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary inline-block px-8 py-3.5 text-sm font-semibold">
                Live mission control
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center border border-rose-500/35 bg-rose-950/20 px-6 py-3.5 font-mono text-sm text-rose-200/90 transition hover:border-rose-400/60"
              >
                Guided crisis run (90s)
              </Link>
            </div>
          </div>
          <div className="w-full max-w-md flex-1 md:max-w-lg">
            <HeroConstitutionalBeat />
          </div>
        </div>
      </section>

      {/* One-line thesis */}
      <section className="border-y border-white/[0.06] bg-[#070a1a]/90 py-16 text-center">
        <p className="mx-auto max-w-2xl px-6 font-mono text-sm leading-relaxed text-slate-400 md:text-base">
          This is not a trading terminal. It is a <span className="text-slate-200">policy engine + live demo</span>: the
          same checks a human committee would argue about, encoded and enforced before execution.
        </p>
      </section>

      {/* Write law — economic tension */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20 md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Try the law before you ship it</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
          Move the sliders — see how survivability moves with your mandates.
        </h2>
        <div className="mt-10 panel p-6 md:p-10">
          <InteractiveLawPanel value={laws} onChange={setLaws} />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Commit to a vault in the{" "}
          <Link href="/constitution" className="text-cyan-400 underline-offset-4 hover:underline">
            law console
          </Link>
          .
        </p>
      </section>

      <footer className="border-t border-white/[0.06] py-10 text-center text-xs text-slate-600">
        <span className="font-mono">TreasuryOS</span>
        <span className="mx-3 text-slate-700">·</span>
        Governance layer for autonomous financial systems.
      </footer>
    </div>
  );
}

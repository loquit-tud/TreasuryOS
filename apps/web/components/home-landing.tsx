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
              Constitutional infrastructure for autonomous finance.
            </h1>
            <p className="mt-6 text-lg font-medium text-slate-300 md:text-xl">
              AI wants risk. <span className="text-cyan-400/95">Constitution enforces survival.</span>
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary inline-block px-8 py-3.5 text-sm">
                Enter operating surface
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center border border-rose-500/35 bg-rose-950/20 px-6 py-3.5 font-mono text-sm text-rose-200/90 transition hover:border-rose-400/60"
              >
                Black swan event →
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
          Autonomous capital without law becomes systemic risk. TreasuryOS is the governance layer — not another yield
          dashboard.
        </p>
      </section>

      {/* Write law — economic tension */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20 md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Instrument of government</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
          Draft mandates. Watch the system fight back.
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

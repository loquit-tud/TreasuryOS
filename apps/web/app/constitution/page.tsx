"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { InteractiveLawPanel } from "@/components/interactive-law-panel";
import type { Constitution } from "@/lib/api";
import { defaultConstitution } from "@/lib/api";
import type { LawPreviewParams } from "@/lib/constitutional-preview";
import { useTreasuryStore } from "@/lib/store/useTreasuryStore";

function toLawParams(c: Constitution): LawPreviewParams {
  return {
    stable_reserve_min_pct: c.stable_reserve_min_pct,
    max_drawdown_pct: c.max_drawdown_pct,
    rwa_exposure_max_pct: c.rwa_exposure_max_pct,
    leverage_allowed: c.leverage_allowed,
  };
}

function mergeLaw(into: Constitution, law: LawPreviewParams): Constitution {
  return {
    ...into,
    stable_reserve_min_pct: law.stable_reserve_min_pct,
    max_drawdown_pct: law.max_drawdown_pct,
    rwa_exposure_max_pct: law.rwa_exposure_max_pct,
    leverage_allowed: law.leverage_allowed,
  };
}

export default function ConstitutionPage() {
  const { vault, isLoading, error, saveConstitution } = useTreasuryStore();

  const [constitution, setConstitution] = useState<Constitution>(
    vault?.constitution ?? defaultConstitution
  );

  useEffect(() => {
    if (vault?.constitution) {
      setConstitution(vault.constitution);
    }
  }, [vault?.id, vault?.constitution_hash]); // eslint-disable-line react-hooks/exhaustive-deps -- sync binding only

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10 md:px-10">
      <header className="border-b border-white/[0.08] pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
          TreasuryOS · constitutional instrument
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">Instrument of capital law</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          These provisions are enforced as hard constraints on autonomous action — not advisory guidelines. Amendments
          require explicit commit to the bound vault.
        </p>
      </header>

      <section className="panel p-6 md:p-10">
        <div className="mb-8 border-b border-white/[0.06] pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-500/70">Article I</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-100">Operating parameters and survivability</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            The following sliders encode mandatory floors and ceilings. The Constitution Engine shall reject any
            proposal that would breach them, without exception.
          </p>
        </div>

        <InteractiveLawPanel value={toLawParams(constitution)} onChange={(law) => setConstitution((prev) => mergeLaw(prev, law))} />

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-8">
          <button
            type="button"
            disabled={isLoading || !vault}
            onClick={() => void saveConstitution(constitution)}
            className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
          >
            Ratify &amp; commit to vault
          </button>
          <button
            type="button"
            disabled={!vault}
            onClick={() => {
              if (vault?.constitution) setConstitution(vault.constitution);
            }}
            className="btn-secondary px-5 py-2.5 text-sm disabled:opacity-50"
          >
            Reload instrument from binding
          </button>
          <Link href="/dashboard" className="btn-secondary px-5 py-2.5 text-sm">
            Return to operating surface
          </Link>
        </div>
        {error ? <p className="mt-4 font-mono text-sm text-rose-400">{error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Article II</p>
          <h2 className="mt-2 text-sm font-semibold text-slate-200">Emergency clause</h2>
          <p className="mt-3 text-sm text-slate-400">
            Upon breach of volatility threshold {constitution.emergency.volatility_threshold_pct}%, the system shall
            invoke <span className="font-mono text-cyan-400/90">{constitution.emergency.action}</span> procedures as
            encoded.
          </p>
          <p className="mt-3 text-xs text-slate-600">Emergency parameters fixed in this build — extensible in later instruments.</p>
        </article>
        <article className="panel p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Seal of binding</p>
          <h2 className="mt-2 text-sm font-semibold text-slate-200">Vault attestation</h2>
          <p className="mt-3 font-mono text-xs text-slate-500">Bound entity</p>
          <p className="font-mono text-sm text-slate-300">{vault?.id ?? "— unbound —"}</p>
          <p className="mt-4 font-mono text-xs text-slate-500">Constitution hash (attested)</p>
          <p className="break-all font-mono text-xs text-cyan-500/80">{vault?.constitution_hash ?? "—"}</p>
        </article>
      </section>
    </main>
  );
}

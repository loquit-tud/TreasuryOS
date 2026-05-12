"use client";

import type { LawPreviewParams } from "@/lib/constitutional-preview";
import { previewLawImpact } from "@/lib/constitutional-preview";

type Props = {
  value: LawPreviewParams;
  onChange: (next: LawPreviewParams) => void;
};

function SliderRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium tracking-tight text-slate-200">{label}</span>
        <span className="font-mono text-sm tabular-nums text-cyan-400">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="law-slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

export function InteractiveLawPanel({ value, onChange }: Props) {
  const state = previewLawImpact(value);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <SliderRow
            label="Max drawdown"
            value={value.max_drawdown_pct}
            min={1}
            max={25}
            unit="%"
            onChange={(max_drawdown_pct) => onChange({ ...value, max_drawdown_pct })}
          />
          <SliderRow
            label="Stable reserve minimum"
            value={value.stable_reserve_min_pct}
            min={15}
            max={70}
            unit="%"
            onChange={(stable_reserve_min_pct) => onChange({ ...value, stable_reserve_min_pct })}
          />
          <SliderRow
            label="Illiquid / non-stable sleeve cap"
            value={value.rwa_exposure_max_pct}
            min={20}
            max={95}
            unit="%"
            onChange={(rwa_exposure_max_pct) => onChange({ ...value, rwa_exposure_max_pct })}
          />
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500">Leverage</p>
            <button
              type="button"
              onClick={() => onChange({ ...value, leverage_allowed: !value.leverage_allowed })}
              className={`mt-3 w-full rounded-lg border px-4 py-3 text-left font-mono text-sm transition ${
                value.leverage_allowed
                  ? "border-rose-500/50 bg-rose-950/30 text-rose-200"
                  : "border-white/[0.12] bg-slate-950/40 text-slate-400"
              }`}
            >
              {value.leverage_allowed ? "ENABLED — constitutional risk elevated" : "DISABLED — survivability preserved"}
            </button>
          </div>

          <div className="panel-subtle space-y-4 p-5">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500">Live system response</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Survivability</p>
                <p className="mt-1 font-mono text-2xl text-emerald-400 tabular-nums">{state.survivability}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Risk</p>
                <p className="mt-1 font-mono text-2xl text-amber-300 tabular-nums">{state.risk}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Fragility</p>
                <p className="mt-1 font-mono text-2xl text-slate-200 tabular-nums">{state.fragility}</p>
              </div>
            </div>
            <p className="text-center font-mono text-xs text-cyan-400/90">
              Vault survivability: <span className="text-slate-100">{state.label}</span>
            </p>
            <p className="text-center text-xs leading-relaxed text-slate-500">
              Modeled under stress — adjusts instantly as you rewrite capital law.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

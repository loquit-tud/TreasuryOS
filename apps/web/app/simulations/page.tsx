"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTreasuryStore } from "@/lib/store/useTreasuryStore";

export default function SimulationsPage() {
  const { simulationHistory, runBlackSwan, proposal, isLoading, error } = useTreasuryStore();

  const chartData = useMemo(
    () =>
      [...simulationHistory]
        .reverse()
        .map((item, index) => ({
          scenario: `${item.scenario}-${index + 1}`,
          survival: item.survival_score,
          drawdown: Number(item.drawdown_pct.toFixed(2)),
          compliance: item.policy_compliance,
        })),
    [simulationHistory]
  );

  const latest = simulationHistory[0];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-6 py-8 md:px-10">
      <header className="panel flex items-center justify-between px-5 py-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">Risk Flight Simulator</h1>
        <button
          type="button"
          onClick={() => void runBlackSwan()}
          disabled={!proposal || isLoading}
          className="btn-secondary border-amber-600/60 px-4 py-2 text-amber-200 hover:border-amber-400 disabled:opacity-50"
        >
          Simulate Black Swan Event
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-4">
          <p className="text-sm text-slate-400">Latest Survivability</p>
          <p className="mt-2 font-mono text-3xl text-emerald-400">{latest?.survival_score ?? "--"}</p>
        </article>
        <article className="panel p-4">
          <p className="text-sm text-slate-400">Latest Drawdown %</p>
          <p className="mt-2 font-mono text-3xl text-rose-300">{latest?.drawdown_pct ?? "--"}</p>
        </article>
        <article className="panel p-4">
          <p className="text-sm text-slate-400">Policy Compliance</p>
          <p className="mt-2 font-mono text-3xl text-amber-300">{latest?.policy_compliance ?? "--"}</p>
        </article>
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">Scenario Timeline</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-400">
            No scenarios recorded yet. Trigger simulation from dashboard flow first.
          </p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="survivalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="drawdownColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="scenario" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="survival"
                  stroke="#10b981"
                  fill="url(#survivalColor)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ef4444"
                  fill="url(#drawdownColor)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">Simulation Explainability</h2>
        {latest ? (
          <div className="space-y-2 text-sm text-slate-300">
            <p>[Scenario] {latest.scenario}</p>
            <p>[Reason] {latest.details.explainability}</p>
            <p>[Response] {latest.details.capital_response}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Explainability appears after first scenario run. Evaluate proposal and run simulation.
          </p>
        )}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>
    </main>
  );
}

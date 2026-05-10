"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";

import { SimulationScenarioChart, type ScenarioChartRow } from "@/components/simulation-scenario-chart";
import { useTreasuryStore } from "@/lib/store/useTreasuryStore";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "emerald" | "rose" | "amber";
}) {
  const reduce = useReducedMotion();
  const color =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "rose"
        ? "text-rose-300"
        : "text-amber-300";

  return (
    <motion.article
      variants={reduce ? undefined : item}
      className="panel relative overflow-hidden p-4"
      whileHover={reduce ? undefined : { scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent"
        aria-hidden
      />
      <p className="text-sm text-slate-400">{label}</p>
      <motion.p
        key={String(value)}
        initial={reduce ? false : { opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className={`mt-2 font-mono text-3xl ${color}`}
      >
        {value}
      </motion.p>
    </motion.article>
  );
}

export default function SimulationsPage() {
  const { simulationHistory, runBlackSwan, proposal, isLoading, error } = useTreasuryStore();
  const reduce = useReducedMotion();

  const chartData: ScenarioChartRow[] = useMemo(
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
    <motion.main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-6 py-8 md:px-10"
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.header
        className="panel flex items-center justify-between px-5 py-4"
        variants={reduce ? undefined : item}
        initial={reduce ? false : "hidden"}
        animate={reduce ? undefined : "show"}
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">Risk Flight Simulator</h1>
          <p className="mt-1 text-xs text-slate-500">
            Survivability & compliance vs drawdown — scenario timeline updates after each shock run.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={() => void runBlackSwan()}
          disabled={!proposal || isLoading}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          className="btn-secondary border-amber-600/60 px-4 py-2 text-amber-200 hover:border-amber-400 disabled:opacity-50"
        >
          Simulate Black Swan Event
        </motion.button>
      </motion.header>

      <motion.section
        className="grid gap-4 md:grid-cols-3"
        variants={reduce ? undefined : container}
        initial={reduce ? false : "hidden"}
        animate={reduce ? undefined : "show"}
      >
        <KpiCard label="Latest survivability" value={latest?.survival_score ?? "—"} accent="emerald" />
        <KpiCard label="Latest drawdown %" value={latest ? latest.drawdown_pct.toFixed(2) : "—"} accent="rose" />
        <KpiCard label="Policy compliance" value={latest?.policy_compliance ?? "—"} accent="amber" />
      </motion.section>

      <motion.section
        className="panel p-5"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <h2 className="mb-1 text-lg font-semibold text-slate-100">Scenario timeline</h2>
        <p className="mb-4 text-xs text-slate-500">
          Green: survivability · Amber: compliance score · Line: drawdown severity (%).
        </p>
        <SimulationScenarioChart data={chartData} key={chartData.length} />
      </motion.section>

      <motion.section
        className="panel p-5"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="mb-3 text-lg font-semibold text-slate-100">Simulation explainability</h2>
        {latest ? (
          <motion.div
            className="space-y-3 text-sm text-slate-300"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            key={latest.scenario + latest.details.explainability}
          >
            <p>
              <span className="font-mono text-xs uppercase tracking-wider text-slate-500">Scenario</span>
              <br />
              {latest.scenario}
            </p>
            <p>
              <span className="font-mono text-xs uppercase tracking-wider text-slate-500">Reason</span>
              <br />
              {latest.details.explainability}
            </p>
            <p>
              <span className="font-mono text-xs uppercase tracking-wider text-slate-500">Capital response</span>
              <br />
              {latest.details.capital_response}
            </p>
          </motion.div>
        ) : (
          <p className="text-sm text-slate-400">
            Explainability appears after first scenario run. Evaluate a proposal from the dashboard, then simulate.
          </p>
        )}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </motion.section>
    </motion.main>
  );
}

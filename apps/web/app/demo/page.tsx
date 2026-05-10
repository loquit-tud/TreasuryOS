"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  playConstitutionalClear,
  playConstitutionalLock,
  playStressPulse,
} from "@/lib/constitutional-sounds";
import { useTreasuryStore } from "@/lib/store/useTreasuryStore";

type DemoStepStatus = "pending" | "running" | "done" | "error";

type DemoStep = {
  id: string;
  title: string;
  detail: string;
  status: DemoStepStatus;
};

const initialSteps: DemoStep[] = [
  {
    id: "init",
    title: "Vault instantiated",
    detail: "Governed entity online — constitution hash bound.",
    status: "pending",
  },
  {
    id: "reject",
    title: "Aggressive recovery path",
    detail: "AI proposes leverage to claw back losses — law intervenes.",
    status: "pending",
  },
  {
    id: "allow",
    title: "Defensive realignment",
    detail: "Compliant proposal — reserves and drawdown within mandate.",
    status: "pending",
  },
  {
    id: "execute",
    title: "Execution & proof",
    detail: "Deterministic log — chain-ready attestation.",
    status: "pending",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function DemoPage() {
  const {
    vault,
    proposal,
    decision,
    simulation,
    ledger,
    error,
    isLoading,
    initializeDemo,
    runEvaluation,
    createCompliantProposal,
    runBlackSwan,
    markExecutionLogged,
  } = useTreasuryStore();

  const [steps, setSteps] = useState<DemoStep[]>(initialSteps);
  const [running, setRunning] = useState(false);
  const [scene, setScene] = useState("Standby — arm the black swan.");
  const [shaking, setShaking] = useState(false);

  const prevRejectStatus = useRef<DemoStepStatus | "">("");

  const capitalPreserved = useMemo(() => {
    const withConstitution = simulation?.drawdown_pct ?? 4.2;
    const withoutConstitution = 18.0;
    return Math.max(0, withoutConstitution - withConstitution).toFixed(1);
  }, [simulation]);

  const rejectBeat = steps.find((s) => s.id === "reject")?.status === "done";
  const allowStep = steps.find((s) => s.id === "allow");
  const tensionActive =
    rejectBeat && (allowStep?.status === "pending" || allowStep?.status === "running");

  const stressVisual =
    running && steps[0]?.status === "done" && steps[3]?.status !== "done" && steps[3]?.status !== "error";

  useEffect(() => {
    const r = steps.find((s) => s.id === "reject");
    const st = r?.status ?? "";
    if (prevRejectStatus.current === "running" && st === "done") {
      setShaking(true);
      const t = window.setTimeout(() => setShaking(false), 480);
      return () => window.clearTimeout(t);
    }
    prevRejectStatus.current = st;
  }, [steps]);

  const updateStep = (id: string, status: DemoStepStatus) => {
    setSteps((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const runDemo = async () => {
    setRunning(true);
    setScene("Institutional autonomous finance optimizes yield — nothing prevents catastrophe. Law does.");
    setSteps(initialSteps);
    prevRejectStatus.current = "";

    try {
      updateStep("init", "running");
      await initializeDemo();
      await sleep(500);

      const afterInit = useTreasuryStore.getState();
      if (!afterInit.vault || !afterInit.proposal) {
        throw new Error(afterInit.error || "Initialization failed. Verify backend availability.");
      }
      updateStep("init", "done");

      setScene("BLACK SWAN EVENT — model reaches for leverage.");
      updateStep("reject", "running");
      await runEvaluation();

      const afterReject = useTreasuryStore.getState();
      if (afterReject.decision?.decision !== "REJECT") {
        throw new Error(
          afterReject.error ||
            `Expected REJECT on aggressive proposal, got ${afterReject.decision?.decision ?? "NONE"}.`
        );
      }
      playConstitutionalLock();
      setScene("CONSTITUTION VIOLATION — survivability mandate. REJECTED.");
      playStressPulse();
      await runBlackSwan();
      await sleep(900);
      updateStep("reject", "done");
      await sleep(400);

      setScene("Defensive sleeve only — compliant path.");
      updateStep("allow", "running");
      await createCompliantProposal();
      const afterCompliantCreate = useTreasuryStore.getState();
      if (!afterCompliantCreate.proposal) {
        throw new Error(afterCompliantCreate.error || "Failed to create compliant proposal.");
      }
      await runEvaluation();
      await sleep(700);

      const afterAllow = useTreasuryStore.getState();
      if (afterAllow.decision?.decision !== "ALLOW") {
        throw new Error(
          afterAllow.error ||
            `Expected ALLOW on compliant proposal, got ${afterAllow.decision?.decision ?? "NONE"}.`
        );
      }
      playConstitutionalClear();
      updateStep("allow", "done");

      setScene("Execution proof — audit trail closes.");
      updateStep("execute", "running");
      await markExecutionLogged();
      await sleep(900);
      updateStep("execute", "done");

      setScene("Sequence complete — drama resolved by law, not optimism.");
    } catch (demoError) {
      const message = demoError instanceof Error ? demoError.message : "Unknown demo error";
      setScene(`Interrupted: ${message}`);
      setSteps((prev) =>
        prev.map((item) => (item.status === "running" ? { ...item, status: "error" } : item))
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      className={`flex min-h-full flex-1 flex-col ${stressVisual ? "demo-vignette demo-vignette--stress" : "demo-vignette"}`}
    >
      <main
        className={`mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10 md:px-10 ${shaking ? "demo-screen-shake" : ""}`}
      >
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-rose-500/80">Crisis simulator</p>
          <h1 className="mt-3 font-mono text-3xl font-bold tracking-tight text-slate-50 md:text-5xl">
            BLACK SWAN EVENT
          </h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-amber-500/70">
            Volatility · rejection · preservation
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
            If it feels polite, you lose. You should feel leverage hunger, a constitutional slap, then lawful
            execution.
          </p>
        </header>

        <AnimatePresence>
          {tensionActive ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="constitutional-rejection-pulse border border-rose-500/45 bg-rose-950/35 px-5 py-4"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300">Live beat</p>
              <p className="mt-2 font-mono text-sm text-rose-100">
                AI PROPOSAL DETECTED — +32% leverage expansion
              </p>
              <p className="mt-2 font-mono text-lg text-rose-200">CONSTITUTION VIOLATION — BLOCKED</p>
              <p className="mt-1 text-sm text-rose-200/70">Survivability mandate · reserve floor intact.</p>
              <p className="mt-3 text-xs text-rose-300/60">Emergency preservation protocol — active.</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className="panel flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => void runDemo()}
            disabled={running || isLoading}
            className="border border-rose-500/40 bg-rose-600/90 px-6 py-3 font-mono text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
          >
            {running ? "EVENT IN PROGRESS…" : "ARM BLACK SWAN SEQUENCE"}
          </button>
          <p className="max-w-xl font-mono text-xs leading-relaxed text-cyan-500/90 md:text-right">{scene}</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="panel p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Sequence</h2>
            <div className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  layout
                  className={`border px-4 py-3 ${
                    step.status === "running"
                      ? "border-amber-500/35 bg-amber-950/15"
                      : step.status === "error"
                        ? "border-rose-500/35 bg-rose-950/15"
                        : step.status === "done"
                          ? "border-white/[0.06] bg-[#0a1020]"
                          : "border-white/[0.04] bg-transparent opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-100">
                      {index + 1}. {step.title}
                    </p>
                    <span
                      className={`shrink-0 font-mono text-[10px] uppercase ${
                        step.status === "done"
                          ? "text-emerald-400"
                          : step.status === "running"
                            ? "text-amber-300"
                            : step.status === "error"
                              ? "text-rose-400"
                              : "text-slate-600"
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{step.detail}</p>
                </motion.div>
              ))}
            </div>
          </article>

          <article className="space-y-4">
            <div className="panel p-5">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Outcome</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">Vault</p>
                  <p className="mt-1 font-mono text-xs text-slate-300">{vault?.id ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">Verdict</p>
                  <p className="mt-1 font-mono text-xs text-amber-200/90">{decision?.decision ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">Proposal</p>
                  <p className="mt-1 font-mono text-xs text-slate-300">{proposal?.id ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">Drawdown delta spared</p>
                  <p className="mt-1 font-mono text-lg text-emerald-400 tabular-nums">{capitalPreserved}%</p>
                </div>
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Explainability tape</h2>
              <ul className="mt-4 space-y-2 font-mono text-xs text-slate-500">
                <li>12:04 — Liquidity contraction detected</li>
                <li>12:05 — Volatility spike — AI requests leverage</li>
                <li>12:05 — Constitution REJECTED — reserve violation</li>
                <li>12:06 — Defensive path APPROVED</li>
                <li>
                  12:06 — Execution logged{" "}
                  {ledger[0]?.tx_hash ? `· ${ledger[0].tx_hash.slice(0, 18)}…` : ""}
                </li>
              </ul>
            </div>

            {error ? <p className="font-mono text-sm text-rose-400">{error}</p> : null}
          </article>
        </section>
      </main>
    </div>
  );
}

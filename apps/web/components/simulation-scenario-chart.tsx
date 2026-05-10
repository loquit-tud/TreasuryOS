"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ScenarioChartRow = {
  scenario: string;
  survival: number;
  drawdown: number;
  compliance: number;
};

type Props = {
  data: ScenarioChartRow[];
};

const tooltipStyles = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#e2e8f0",
} as const;

export function SimulationScenarioChart({ data }: Props) {
  const reduce = useReducedMotion();

  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No scenarios recorded yet. Trigger simulation from dashboard flow first.
      </p>
    );
  }

  return (
    <motion.div
      className="h-80 w-full"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="survivalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="scenario" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={48} />
          <YAxis
            yAxisId="scores"
            domain={[0, 100]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: "Score", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10 }}
          />
          <YAxis
            yAxisId="dd"
            orientation="right"
            domain={["auto", "auto"]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: "Drawdown %", angle: 90, position: "insideRight", fill: "#64748b", fontSize: 10 }}
          />
          <Tooltip contentStyle={tooltipStyles} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            yAxisId="scores"
            type="monotone"
            dataKey="survival"
            name="Survivability"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#survivalGrad)"
            isAnimationActive={!reduce}
          />
          <Area
            yAxisId="scores"
            type="monotone"
            dataKey="compliance"
            name="Policy compliance"
            stroke="#fbbf24"
            strokeWidth={2}
            fill="url(#complianceGrad)"
            isAnimationActive={!reduce}
          />
          <Line
            yAxisId="dd"
            type="monotone"
            dataKey="drawdown"
            name="Drawdown %"
            stroke="#fb7185"
            strokeWidth={2}
            dot={{ r: 3, fill: "#fb7185" }}
            isAnimationActive={!reduce}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

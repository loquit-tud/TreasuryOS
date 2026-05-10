"use client";

import { useCallback, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Panel,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";

import type { OrgNodeData } from "./capital-organism-node-types";

/** Custom nodes registered once — stable reference for React Flow */
const nodeTypes = {
  organism: OrganismNode,
};

function OrganismNode({ data }: NodeProps<Node<OrgNodeData>>) {
  const variant = data.variant;
  const border =
    variant === "constitution"
      ? data.blockPulse
        ? "border-rose-500/60 constitutional-rejection-pulse shadow-[0_0_24px_rgba(239,68,68,0.25)]"
        : "border-cyan-500/45"
      : variant === "ai"
        ? "border-amber-500/45 bg-amber-950/30"
        : variant === "reserves"
          ? "border-emerald-500/35 bg-emerald-950/20"
          : variant === "rwa"
            ? "border-rose-500/40 bg-rose-950/15"
            : variant === "shock"
              ? "border-rose-500/50 bg-rose-950/40 capital-node-pulse"
              : "border-slate-600/40 bg-slate-950/40";

  return (
    <div className={`min-w-[112px] rounded-md border px-3 py-2 font-mono ${border}`}>
      {variant === "ai" && (
        <>
          <Handle id="out" type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-amber-400/80" />
        </>
      )}
      {variant === "reserves" && (
        <Handle id="out" type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-emerald-400/70" />
      )}
      {variant === "rwa" && (
        <Handle id="out" type="source" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-rose-400/70" />
      )}
      {variant === "constitution" && (
        <>
          <Handle id="in-ai" type="target" position={Position.Left} style={{ top: "28%" }} className="!h-2 !w-2 !border-0 !bg-slate-500" />
          <Handle id="in-res" type="target" position={Position.Left} style={{ top: "72%" }} className="!h-2 !w-2 !border-0 !bg-slate-500" />
          <Handle id="in-rwa" type="target" position={Position.Right} style={{ top: "28%" }} className="!h-2 !w-2 !border-0 !bg-slate-500" />
          <Handle id="in-shock" type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-rose-400/80" />
          <Handle id="out-exec" type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-cyan-400/70" />
        </>
      )}
      {variant === "shock" && (
        <Handle id="out" type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-rose-400/90" />
      )}
      {variant === "outflow" && (
        <Handle id="in" type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-slate-400/70" />
      )}

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-200">{data.title}</p>
      <p className="text-[9px] text-slate-500">{data.sub}</p>
    </div>
  );
}

function buildGraph(
  stressActive: boolean,
  defensivePulse: boolean,
  blockPulse: boolean,
  reduceMotion: boolean | null
): { nodes: Node<OrgNodeData>[]; edges: Edge[] } {
  const shockId = "shock";
  const nodes: Node<OrgNodeData>[] = [
    {
      id: "ai",
      type: "organism",
      position: { x: 20, y: 48 },
      data: {
        variant: "ai",
        title: "AI AGENT",
        sub: "seeks risk",
        blockPulse,
      },
    },
    {
      id: "reserves",
      type: "organism",
      position: { x: 20, y: 228 },
      data: {
        variant: "reserves",
        title: "RESERVES",
        sub: defensivePulse ? "defense active" : "mandate floor",
        blockPulse,
      },
    },
    {
      id: "constitution",
      type: "organism",
      position: { x: 268, y: 120 },
      data: {
        variant: "constitution",
        title: "CONSTITUTION",
        sub: "enforcement core",
        blockPulse,
      },
    },
    {
      id: "rwa",
      type: "organism",
      position: { x: 536, y: 48 },
      data: {
        variant: "rwa",
        title: "RWA BOOK",
        sub: stressActive ? "stress channel" : "illiquidity",
        blockPulse,
      },
    },
    {
      id: "outflow",
      type: "organism",
      position: { x: 536, y: 228 },
      data: {
        variant: "outflow",
        title: "OUTFLOW",
        sub: "execution",
        blockPulse,
      },
    },
  ];

  if (stressActive) {
    nodes.unshift({
      id: shockId,
      type: "organism",
      position: { x: 292, y: 0 },
      data: {
        variant: "shock",
        title: "SHOCK",
        sub: "vol spike",
        blockPulse,
      },
    });
  }

  const edgeAnim = reduceMotion ? "" : "capital-flow-edge";

  const edges: Edge[] = [
    {
      id: "e-ai-law",
      source: "ai",
      target: "constitution",
      sourceHandle: "out",
      targetHandle: "in-ai",
      animated: !reduceMotion,
      className: edgeAnim,
      style: { stroke: stressActive ? "rgba(245,158,11,0.65)" : "rgba(245,158,11,0.4)", strokeWidth: 1.4 },
    },
    {
      id: "e-res-law",
      source: "reserves",
      target: "constitution",
      sourceHandle: "out",
      targetHandle: "in-res",
      animated: !reduceMotion,
      className: edgeAnim,
      style: { stroke: defensivePulse ? "rgba(6,182,212,0.55)" : "rgba(16,185,129,0.35)", strokeWidth: 1.2 },
    },
    {
      id: "e-rwa-law",
      source: "rwa",
      target: "constitution",
      sourceHandle: "out",
      targetHandle: "in-rwa",
      animated: !reduceMotion,
      className: edgeAnim,
      style: {
        stroke: stressActive ? "rgba(239,68,68,0.55)" : "rgba(239,68,68,0.28)",
        strokeWidth: stressActive ? 1.35 : 1,
      },
    },
    {
      id: "e-law-out",
      source: "constitution",
      target: "outflow",
      sourceHandle: "out-exec",
      targetHandle: "in",
      animated: !reduceMotion,
      className: edgeAnim,
      style: { stroke: "rgba(148,163,184,0.45)", strokeWidth: 1.1 },
    },
  ];

  if (stressActive) {
    edges.push({
      id: "e-shock-law",
      source: shockId,
      target: "constitution",
      sourceHandle: "out",
      targetHandle: "in-shock",
      animated: !reduceMotion,
      style: { stroke: "rgba(239,68,68,0.65)", strokeWidth: 1.6 },
    });
  }

  return { nodes, edges };
}

/**
 * Interactive constitutional capital map — React Flow graph (pan/zoom, institutional density).
 */
export function CapitalOrganismFlow({
  stressActive,
  defensivePulse,
  blockPulse,
}: {
  stressActive: boolean;
  defensivePulse: boolean;
  blockPulse: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { nodes, edges } = useMemo(
    () => buildGraph(stressActive, defensivePulse, blockPulse, reduceMotion),
    [stressActive, defensivePulse, blockPulse, reduceMotion]
  );

  const onInit = useCallback((instance: ReactFlowInstance<Node<OrgNodeData>, Edge>) => {
    instance.fitView({ padding: 0.15, maxZoom: 1.25, minZoom: 0.65 });
  }, []);

  return (
    <div className="capital-flow-canvas relative h-[min(560px,62vh)] min-h-[380px] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#050814]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      >
        <Background color="rgba(148,163,184,0.06)" gap={18} size={1} />
        <Controls showInteractive={false} className="!m-2 !border-white/10 !bg-slate-950/90 [&_button]:!border-white/10 [&_button]:!bg-slate-900 [&_svg]:!fill-slate-400" />
        <Panel position="top-right" className="m-3 rounded-md border border-white/[0.08] bg-slate-950/70 px-3 py-2 font-mono text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${stressActive ? "bg-rose-400/90" : "bg-emerald-400/80"}`} />
            <span>{stressActive ? "SYSTEM UNDER STRESS" : "NOMINAL PRESSURE"}</span>
          </div>
        </Panel>
        <Panel position="bottom-left" className="m-2 max-w-[240px] font-mono text-[9px] text-slate-600">
          Flows converge on law — pan/zoom to inspect. Not yield.
        </Panel>
      </ReactFlow>
    </div>
  );
}

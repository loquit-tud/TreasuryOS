"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Institutional “live system” backdrop: flowing capital / policy / risk lines.
 * No particles, no crypto iconography — reads as infrastructure telemetry.
 */
export function CapitalMapBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.9]"
      aria-hidden
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cm-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(6,182,212,0)" />
            <stop offset="50%" stopColor="rgba(6,182,212,0.45)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0)" />
          </linearGradient>
          <linearGradient id="cm-rose" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(239,68,68,0)" />
            <stop offset="45%" stopColor="rgba(239,68,68,0.35)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0)" />
          </linearGradient>
        </defs>

        {/* Base grid — Bloomberg-adjacent restraint */}
        <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 100} y1={0} x2={i * 100} y2={720} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={i * 100} x2={1200} y2={i * 100} />
          ))}
        </g>

        {/* Capital routes */}
        <path
          d="M-40 420 C 200 380, 320 520, 520 400 S 880 280, 1240 360"
          stroke="url(#cm-cyan)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeDasharray="10 18"
          className={reduceMotion ? "" : "capital-path-anim"}
        />
        <path
          d="M-20 180 C 240 120, 400 260, 620 200 S 960 80, 1220 220"
          stroke="rgba(6,182,212,0.22)"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeDasharray="6 14"
          className={reduceMotion ? "" : "capital-path-anim"}
          style={{ animationDuration: "28s" }}
        />
        <path
          d="M100 700 C 360 560, 500 640, 760 500 S 1020 420, 1180 480"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth="0.85"
          strokeLinecap="round"
          strokeDasharray="8 20"
          className={reduceMotion ? "" : "capital-path-anim"}
          style={{ animationDuration: "34s" }}
        />

        {/* Risk shock arc */}
        <path
          d="M 720 120 Q 900 40, 1080 200"
          stroke="url(#cm-rose)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="4 10"
          className={reduceMotion ? "" : "capital-path-anim"}
          style={{ animationDuration: "18s" }}
        />

        {/* Nodes — squares/dots only */}
        <g>
          <rect x="468" y="392" width="6" height="6" fill="rgba(6,182,212,0.7)" className={reduceMotion ? "" : "capital-node-pulse"} />
          <rect x="612" y="196" width="5" height="5" fill="rgba(148,163,184,0.55)" />
          <rect x="892" y="312" width="5" height="5" fill="rgba(239,68,68,0.5)" className={reduceMotion ? "" : "capital-node-pulse"} style={{ animationDelay: "0.6s" }} />
          <rect x="240" y="508" width="5" height="5" fill="rgba(6,182,212,0.4)" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-[#060816] via-transparent to-[#060816]" />
    </div>
  );
}

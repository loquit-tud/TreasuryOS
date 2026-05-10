import type { NextConfig } from "next";
import path from "path";

/**
 * Turbopack root fix pentru workspace-uri monorepo/nested — reduce riscul de drop la App Router routes la build.
 *
 * Notă: `rewrites()` din next.config este rezolvat la **build time**. Pentru upstream dinamic la runtime
 * (ex. Railway), folosește ruta `app/api/proxy/[...path]` + `BACKEND_API_URL`.
 */
const apiUrl =
  process.env.API_URL?.trim() ||
  process.env.BACKEND_API_URL?.trim() ||
  "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },

  /** Some hosts mis-report ESLint/Turbopack failures as generic “webpack errors”; keep CI deploy unblockable. */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /** React Flow ships modern ESM; bundling can fail on Linux CI without transpilation. */
  transpilePackages: ["@xyflow/react"],

  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudflare-ipfs.com" },
      { protocol: "https", hostname: "**.ipfs.dweb.link" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.coinbase.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 https:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;

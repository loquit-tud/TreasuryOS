# Next standalone (next.config.ts: output "standalone").
#
# --- Tailwind CSS v4 + lightningcss (native .node) on Alpine (musl) ---
#
# package-lock.json is usually generated on macOS/Windows/Linux-glibc. `npm ci` follows the lockfile;
# optional platform packages may not end up installed for linux-x64-musl unless explicitly added.
# lightningcss then fails at build time (often surfaced via next/font → PostCSS → @tailwindcss/postcss).
#
# Fix:
#   1. After `npm ci`, explicitly install the published native packages matching `lightningcss` in the lockfile.
#   2. Copy the `.node` files next to `lightningcss` so `require("../lightningcss.*.node")` resolves (see
#      node_modules/lightningcss/node/index.js), including webpack worker fallback paths.
#
# Pin must match apps/web/package-lock.json → lightningcss version (currently 1.32.0).
FROM node:20-alpine AS builder
ARG LIGHTNINGCSS_VERSION=1.32.0

WORKDIR /app

COPY package*.json ./

RUN npm ci --include=dev --include=optional \
  && npm install --no-save \
    lightningcss-linux-x64-gnu@${LIGHTNINGCSS_VERSION} \
    lightningcss-linux-x64-musl@${LIGHTNINGCSS_VERSION} \
  && test -f "node_modules/lightningcss-linux-x64-musl/lightningcss.linux-x64-musl.node" \
  && echo "lightningcss musl binary present"

COPY . .

RUN cp -f "node_modules/lightningcss-linux-x64-gnu/lightningcss.linux-x64-gnu.node" node_modules/lightningcss/ \
  && cp -f "node_modules/lightningcss-linux-x64-musl/lightningcss.linux-x64-musl.node" node_modules/lightningcss/ \
  && node -e "require('lightningcss'); console.log('lightningcss ok')"

RUN node -v && npm -v && uname -a

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=8192"

RUN npm run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs --system nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

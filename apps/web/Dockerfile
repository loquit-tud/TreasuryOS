# Next standalone (next.config.ts: output "standalone").
#
# Tailwind v4 → lightningcss native addon. Lockfiles generated on macOS/Windows often omit
# Linux optional deps. Fix: (1) explicit lightningcss-linux-x64-gnu install, (2) copy .gnu.node
# next to lightningcss for webpack fallback (lightningcss/node/index.js).
#
# Builder MUST use glibc (Debian/Ubuntu), not Alpine/musl: lightningcss resolves the binary via
# detect-libc — on musl it requires lightningcss-linux-x64-musl (fragile with npm ci + workers).
# On bookworm-slim, Node sees gnu and loads the gnu binary reliably.
#
# Pin to package-lock lightningcss version.
ARG LIGHTNINGCSS_VERSION=1.32.0

FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --include=dev --include=optional \
  && npm install --no-save "lightningcss-linux-x64-gnu@${LIGHTNINGCSS_VERSION}" \
  && test -f "node_modules/lightningcss-linux-x64-gnu/lightningcss.linux-x64-gnu.node" \
  && echo "lightningcss gnu binary present"

COPY . .

RUN cp -f "node_modules/lightningcss-linux-x64-gnu/lightningcss.linux-x64-gnu.node" "node_modules/lightningcss/lightningcss.linux-x64-gnu.node" \
  && node -e "require('lightningcss'); console.log('lightningcss ok (glibc)')"

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

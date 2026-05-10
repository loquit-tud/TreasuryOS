# Next standalone output (next.config.ts: output "standalone").
#
# Tailwind v4 → @tailwindcss/postcss → lightningcss (native .node).
# Railway builders often run Node as musl (Alpine-like). A Debian (glibc) builder + manual
# optional installs still failed to satisfy `require("lightningcss-linux-x64-musl")`.
# Fix: build stage on Alpine (musl) so optional deps + detect-libc match.
# Runtime stage stays Debian slim (unchanged).

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev \
  && npm install --no-save lightningcss-linux-x64-musl@1.32.0 \
  && node -e "require('lightningcss'); console.log('lightningcss ok')"

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
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

# Next standalone (next.config.ts: output "standalone").
#
# Tailwind v4 → lightningcss natives — copy published .node files next to `lightningcss` so fallback
# path `../lightningcss.*.node` resolves (see lightningcss/node/index.js).
# Builder: Alpine (musl). See next.config experimental.webpackBuildWorker=false for worker resolution issues.

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev \
  && npm install --no-save lightningcss-linux-x64-gnu@1.32.0 lightningcss-linux-x64-musl@1.32.0

COPY . .

RUN cp -f node_modules/lightningcss-linux-x64-gnu/lightningcss.linux-x64-gnu.node node_modules/lightningcss/ \
  && cp -f node_modules/lightningcss-linux-x64-musl/lightningcss.linux-x64-musl.node node_modules/lightningcss/ \
  && node -e "require('lightningcss'); console.log('lightningcss ok')"

# Split layers so Railway logs show whether failure is before/after native checks.
RUN node -v && npm -v && uname -a

ENV NEXT_TELEMETRY_DISABLED=1
# Main-thread webpack uses more RSS than workers disabled — Railway needs headroom for trace collection.
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

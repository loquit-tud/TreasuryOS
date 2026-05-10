# Repo-root Dockerfile for Railway (service Root Directory unset).
# See apps/web/Dockerfile — copy lightningcss native binaries next to `lightningcss` so webpack fallback resolves.

FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/web/package*.json ./
RUN npm ci --include=dev \
  && npm install --no-save lightningcss-linux-x64-gnu@1.32.0 lightningcss-linux-x64-musl@1.32.0

COPY apps/web/ .

RUN cp -f node_modules/lightningcss-linux-x64-gnu/lightningcss.linux-x64-gnu.node node_modules/lightningcss/ \
  && cp -f node_modules/lightningcss-linux-x64-musl/lightningcss.linux-x64-musl.node node_modules/lightningcss/ \
  && node -e "require('lightningcss'); console.log('lightningcss ok')"

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

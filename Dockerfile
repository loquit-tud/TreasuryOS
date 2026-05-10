# Railway: repo root + `/Dockerfile` when service Root Directory is unset — builds `apps/web`.
#
# See apps/web/Dockerfile for Tailwind v4 / lightningcss / Alpine musl + lockfile notes.
FROM node:20-alpine AS builder
ARG LIGHTNINGCSS_VERSION=1.32.0

WORKDIR /app

COPY apps/web/package*.json ./

RUN npm ci --include=dev --include=optional \
  && npm install --no-save \
    lightningcss-linux-x64-gnu@${LIGHTNINGCSS_VERSION} \
    lightningcss-linux-x64-musl@${LIGHTNINGCSS_VERSION} \
  && test -f "node_modules/lightningcss-linux-x64-musl/lightningcss.linux-x64-musl.node" \
  && echo "lightningcss musl binary present"

COPY apps/web/ .

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

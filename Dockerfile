# treasuryos-web — build from monorepo root (set Railway Root Directory empty, or use this path explicitly).
#
# One COPY + npm ci so node_modules always matches apps/web/package-lock.json (no stale layers).
# Tailwind v3 only — if you see @tailwindcss/* or lightningcss in the log, the wrong Git ref is being built.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY apps/web/ .

RUN npm ci --include=dev \
  && node -e "const p=require('./package.json');const v=p.devDependencies?.tailwindcss||'';if(!String(v).includes('3.'))throw new Error('Expected tailwindcss 3.x in package.json, got: '+JSON.stringify(v));" \
  && if [ -d node_modules/@tailwindcss ]; then echo 'REFUSE_BUILD: Tailwind v4 packages (node_modules/@tailwindcss) — deploy latest main (Tailwind v3).'; exit 1; fi \
  && if [ -f node_modules/lightningcss/package.json ]; then echo 'REFUSE_BUILD: lightningcss must not be installed (use Tailwind v3).'; exit 1; fi \
  && echo "OK: Tailwind v3 stack, no v4 postcss pipeline"

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

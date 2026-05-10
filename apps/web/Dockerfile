# Next.js standalone output. Tailwind is v3 + PostCSS (no LightningCSS native binaries).
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev

COPY . .

RUN node -e "const p=require('./package.json');const v=p.devDependencies?.tailwindcss||'';if(!String(v).includes('3.'))throw new Error('Stale source: expected tailwindcss 3.x, got: '+v);console.log('OK tailwindcss:',v);" \
  && node -e "try{require.resolve('lightningcss');process.exit(1)}catch(e){console.log('OK: no lightningcss package')}"

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

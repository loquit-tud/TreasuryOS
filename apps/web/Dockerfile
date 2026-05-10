# Build standalone bundle (see next.config.ts output: "standalone")
#
# Tailwind v4 → @tailwindcss/postcss → lightningcss (native addon).
#
# Problem on Alpine (musl): `npm ci` uses package-lock.json from a non-Alpine machine (macOS,
# Windows, Debian). That lockfile often omits or fails to activate the optional package
# `lightningcss-linux-x64-musl`, so `next build` crashes with:
#   Cannot find module '../lightningcss.linux-x64-musl.node'
#
# Fix: build on Debian slim (glibc). npm then resolves the linux-x64-gnu binary consistently.
# Alternative (not used here): regenerate lockfile under Alpine CI, or `npm install lightningcss-linux-x64-musl`
# after `npm ci` on Alpine.

FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
# Many hosts (incl. Railway) set NODE_ENV=production for install; `npm ci` would then
# skip devDependencies. Next.js + Tailwind v4 + PostCSS need those at build time.
RUN npm ci --include=dev \
  && npm install --no-save lightningcss-linux-x64-gnu@1.32.0

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

# ============================================================
# Dockerfile multi-stage untuk Next.js 16 (standalone output)
# ============================================================
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found" && exit 1; \
  fi

# Generate Prisma client if needed (uncomment if using Prisma)
# COPY prisma ./prisma/
# RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env (bisa di-override saat build)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else npm run build; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Batasi heap V8 supaya Node tidak tumbuh sampai kena limit container
# dan memicu OOM killer di VPS 2GB.
ENV NODE_OPTIONS="--max-old-space-size=384"

CMD ["node", "server.js"]
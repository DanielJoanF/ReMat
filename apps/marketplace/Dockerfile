# Universal Multi-Stage Dockerfile for ReMat Next.js Applications
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

# Copy monorepo setup and source code
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Generate Prisma client for internal packages
RUN pnpm --filter @remat/database generate

# Target app build arg (default: marketplace)
ARG APP_NAME=marketplace
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the specified Next.js app
RUN pnpm --filter ${APP_NAME} build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ARG APP_NAME=marketplace
ENV APP_NAME=${APP_NAME}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output, static assets, and public directory
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node apps/${APP_NAME}/server.js"]

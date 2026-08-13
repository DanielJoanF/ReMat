# Multi-stage Dockerfile for ReMat Express API Server
FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

# Copy monorepo workspace files and source code
COPY . .

# Install workspace dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Generate Prisma client for @remat/database
RUN pnpm --filter @remat/database generate

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy workspace state from builder
COPY --from=builder /app /app

WORKDIR /app/apps/api-server

EXPOSE 4000

CMD ["node", "index.js"]

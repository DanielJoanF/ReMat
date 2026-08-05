# ReMat — Monorepo

Platform Kolaboratif Distributor-Konsumen untuk Industri Bebas Limbah berbasis Ekonomi Sirkular dengan Fitur AI.

## 📁 Monorepo Structure

```text
.
├── apps/
│   ├── marketplace/      # Next.js App Router (Marketplace & Catalog, Port 3000)
│   ├── admin-panel/       # Next.js App Router (Admin & Moderation Panel, Port 3001)
│   └── api-server/        # Express Backend API Server (Port 4000)
├── packages/
│   ├── database/          # Prisma ORM Schema & Client (@remat/database)
│   ├── ui/                # Shared UI Components & Tailwind Tokens (@remat/ui)
│   ├── config/            # Shared Configuration & Constants (@remat/config)
│   └── ai-core/           # AI Core Logic & Vector Search Abstraction (@remat/ai-core)
├── docs/                  # Project Documentation (PRD, ERD, ARCHITECTURE, SCHEMA, AGENT)
├── pnpm-workspace.yaml    # PNPM Workspace Configuration
├── turbo.json             # Turborepo Build Pipeline
└── .env.example           # Environment Variable Template
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js >= 18
- pnpm >= 9 (`npm install -g pnpm`)

### 2. Installation

Install all workspace dependencies:

```bash
pnpm install
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the environment variables in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase / Local) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) |
| `PORT` | API server port (Default: `4000`) |

### 4. Database Client Generation

Generate Prisma Client from `packages/database/prisma/schema.prisma`:

```bash
pnpm --filter @remat/database build
```

### 5. Running Applications

Start all applications in development mode:

```bash
pnpm dev
```

Or start specific workspace apps:

```bash
# Start Marketplace App (http://localhost:3000)
pnpm --filter @remat/marketplace dev

# Start Admin Panel App (http://localhost:3001)
pnpm --filter @remat/admin-panel dev

# Start Express API Server (http://localhost:4000)
pnpm --filter @remat/api-server dev
```

### 6. Health Check

Verify Express API Server health:

```bash
curl http://localhost:4000/health
```

Output:
```json
{
  "status": "ok",
  "app": "ReMat",
  "timestamp": "2026-08-05T01:58:00.000Z",
  "environment": "development"
}
```

### 7. Building & Linting

Run build across all workspaces:

```bash
pnpm build
```

Run lint across all workspaces:

```bash
pnpm lint
```

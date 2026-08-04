# ReMat — Platform Kolaboratif Distributor-Konsumen untuk Industri Bebas Limbah

> **ReMat** adalah marketplace B2B/B2C khusus komoditas limbah industri yang mempertemukan produsen limbah (distributor) dengan pengolah limbah (konsumen), dilengkapi dengan AI-powered search, dashboard insight, dan laporan ekonomi sirkular.

---

## 📋 Daftar Isi

- [Prasyarat](#-prasyarat)
- [Struktur Proyek](#-struktur-proyek)
- [Instalasi](#-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Setup Database](#-setup-database)
- [Menjalankan Proyek](#-menjalankan-proyek)
- [Menjalankan per Aplikasi](#-menjalankan-per-aplikasi)
- [Perintah Berguna](#-perintah-berguna)
- [Dokumentasi Terkait](#-dokumentasi-terkait)

---

## ✅ Prasyarat

Pastikan perangkat Anda sudah terinstall:

| Tools | Versi Minimum | Keterangan |
|---|---|---|
| [Node.js](https://nodejs.org/) | `>= 18.x` | Runtime JavaScript |
| [npm](https://www.npmjs.com/) | `>= 9.x` | Package manager (sudah termasuk dalam Node.js) |
| [Git](https://git-scm.com/) | Terbaru | Version control |
| [PostgreSQL](https://www.postgresql.org/) | `>= 15.x` | Database relasional utama |

> **Rekomendasi alternatif database:** Gunakan [Supabase](https://supabase.com/) (PostgreSQL cloud) untuk kemudahan setup dan mendapatkan ekstensi `pgvector` bawaan tanpa konfigurasi manual.

---

## 📁 Struktur Proyek

ReMat dibangun sebagai **monorepo** menggunakan [Turborepo](https://turbo.build/):

```
remat-monorepo/
├── apps/
│   ├── marketplace/      # Frontend Next.js — Marketplace untuk Distributor & Konsumen (port 3000)
│   ├── admin-panel/      # Frontend Next.js — Panel Admin (port 3001)
│   └── api-server/       # Backend Node.js + Express — API, AI, RAG (port 4000)
├── packages/
│   ├── database/         # Prisma Schema & Migrasi Database
│   ├── ui/               # Komponen UI bersama (Design System)
│   ├── ai-core/          # Logika LangChain, Prompt Builder, Skor Sirkular
│   └── config/           # Konfigurasi ESLint & TypeScript bersama
├── docs/                 # Dokumentasi proyek (folder ini)
├── package.json          # Konfigurasi root monorepo
└── turbo.json            # Konfigurasi pipeline Turborepo
```

---

## 📦 Instalasi

### 1. Clone Repository

```bash
git clone <url-repository>
cd remat-monorepo
```

### 2. Install Semua Dependencies

Jalankan perintah berikut di **root** monorepo. Turborepo akan menginstal semua dependencies untuk seluruh `apps/` dan `packages/` secara otomatis:

```bash
npm install
```

---

## ⚙️ Konfigurasi Environment

### 1. Buat File `.env`

Buat file `.env` di dalam direktori masing-masing aplikasi yang membutuhkannya.

#### `apps/api-server/.env`

```env
# ===== Server =====
PORT=4000
NODE_ENV=development

# ===== Database =====
# Gunakan format connection string PostgreSQL atau Supabase
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Contoh untuk Supabase:
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# ===== API Keys (AI) =====
OPENAI_API_KEY=sk-...
# atau
GEMINI_API_KEY=...

# ===== Auth / JWT =====
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# ===== Supabase (jika menggunakan Supabase) =====
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### `apps/marketplace/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=ReMat
```

#### `apps/admin-panel/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=ReMat Admin
```

> **⚠️ Penting:** Jangan pernah commit file `.env` ke repository. Pastikan sudah terdaftar di `.gitignore`.

---

## 🗄️ Setup Database

ReMat menggunakan **PostgreSQL** dengan ekstensi **`pgvector`** (untuk AI semantic search) dan **Prisma ORM**. Semua skema dikelola melalui package `packages/database`.

### Opsi A — Menggunakan Supabase (Direkomendasikan)

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Salin **Connection String** dari **Settings → Database → Connection String (URI)** dan isi ke `DATABASE_URL` di `.env`.
3. Aktifkan ekstensi `pgvector` melalui **SQL Editor** di Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

4. Lanjut ke langkah [Migrasi Prisma](#migrasi-prisma) di bawah.

---

### Opsi B — Menggunakan PostgreSQL Lokal

#### 1. Buat Database

```bash
# Masuk ke PostgreSQL sebagai superuser
psql -U postgres

# Buat database baru
CREATE DATABASE remat_db;

# Buat user (opsional, direkomendasikan)
CREATE USER remat_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE remat_db TO remat_user;

# Keluar
\q
```

#### 2. Aktifkan Ekstensi `pgvector`

Ekstensi ini **wajib** diaktifkan sebelum menjalankan migrasi Prisma:

```bash
psql -U postgres -d remat_db
```

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Atau langsung via satu perintah:

```bash
psql -U postgres -d remat_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

> Jika ekstensi `vector` belum tersedia, install terlebih dahulu `pgvector` di sistem Anda:
> ```bash
> # Ubuntu / Debian
> sudo apt install postgresql-15-pgvector
>
> # macOS (Homebrew)
> brew install pgvector
> ```

#### 3. Set `DATABASE_URL`

Isi `DATABASE_URL` di file `apps/api-server/.env`:

```env
DATABASE_URL="postgresql://remat_user:your_password@localhost:5432/remat_db?schema=public"
```

---

### Migrasi Prisma

Setelah database dan ekstensi siap, jalankan migrasi untuk membuat semua tabel:

```bash
# Masuk ke direktori package database
cd packages/database

# Generate Prisma Client
npx prisma generate

# Jalankan migrasi (membuat tabel dari schema.prisma)
npx prisma migrate dev --name init
```

#### Perintah Prisma Lainnya

```bash
# Melihat status migrasi
npx prisma migrate status

# Membuat migrasi baru (setelah mengubah schema.prisma)
npx prisma migrate dev --name nama_migrasi_anda

# Deploy migrasi ke production
npx prisma migrate deploy

# Buka Prisma Studio (GUI untuk melihat/edit data)
npx prisma studio

# Reset database (hapus semua data & ulang migrasi) — HATI-HATI!
npx prisma migrate reset
```

### Setup Index pgvector (Opsional, untuk Performa AI Search)

Setelah migrasi selesai dan tabel `material_embeddings` sudah terbuat, tambahkan index HNSW secara manual untuk performa AI semantic search yang optimal:

```sql
-- Jalankan via psql atau Supabase SQL Editor
CREATE INDEX ON material_embeddings USING hnsw (embedding vector_cosine_ops);
```

---

## 🚀 Menjalankan Proyek

### Menjalankan Semua Aplikasi Sekaligus (Development)

Dari **root** monorepo, jalankan:

```bash
npm run dev
```

Turborepo akan menjalankan semua aplikasi secara paralel. Akses masing-masing di:

| Aplikasi | URL | Keterangan |
|---|---|---|
| Marketplace | http://localhost:3000 | Frontend untuk Distributor & Konsumen |
| Admin Panel | http://localhost:3001 | Frontend untuk Admin |
| API Server | http://localhost:4000 | Backend REST API |

---

## 🔧 Menjalankan per Aplikasi

Jika ingin menjalankan salah satu aplikasi saja:

### Marketplace (Frontend — port 3000)

```bash
cd apps/marketplace
npm run dev
```

### Admin Panel (Frontend — port 3001)

```bash
cd apps/admin-panel
npm run dev
```

### API Server (Backend — port 4000)

```bash
cd apps/api-server
npm run dev
```

---

## 📜 Perintah Berguna

### Monorepo (dari root)

```bash
# Jalankan semua aplikasi dalam mode development
npm run dev

# Build semua aplikasi untuk production
npm run build

# Lint semua aplikasi & packages
npm run lint

# Hapus semua cache Turborepo
npm run clean
```

### Database (dari `packages/database`)

```bash
# Generate ulang Prisma Client setelah perubahan schema
npx prisma generate

# Buat & jalankan migrasi baru
npx prisma migrate dev --name <nama_migrasi>

# Deploy migrasi ke production
npx prisma migrate deploy

# Buka Prisma Studio (GUI)
npx prisma studio

# Reset database (hapus semua data!) — hanya untuk development
npx prisma migrate reset
```

---

## 📚 Dokumentasi Terkait

| Dokumen | Deskripsi |
|---|---|
| [PRD.md](./PRD.md) | Product Requirements Document — fitur, alur bisnis, target pengguna |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arsitektur sistem, komponen AI, alur kerja, keamanan |
| [ERD.md](./ERD.md) | Entity Relationship Diagram — relasi antar entitas data |
| [SCHEMA.md](./SCHEMA.md) | Prisma schema lengkap beserta catatan implementasi |
| [AGENT.md](./AGENT.md) | Kickoff prompt & panduan untuk AI coding agent |

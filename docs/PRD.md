# PRD — ReMat: Platform Kolaboratif Distributor-Konsumen untuk Industri Bebas Limbah

## 1. Ringkasan Produk

**Nama Produk:** ReMat
**Tagline:** Platform kolaboratif yang mempertemukan produsen limbah (distributor) dengan pengolah limbah (konsumen) untuk mewujudkan ekonomi sirkular dan industri bebas limbah.

**Konsep Inti:** ReMat adalah marketplace B2B/B2C khusus komoditas limbah industri. "Sampah" dari satu pihak (distributor) menjadi "bahan baku" bernilai bagi pihak lain (konsumen). Platform ini bukan sekadar jual-beli, melainkan ekosistem yang menjamin transparansi, kepercayaan, kepatuhan regulasi lingkungan, dan didukung AI sebagai asisten pengambilan keputusan.

## 2. Latar Belakang & Masalah

- Banyak industri menghasilkan limbah yang sebenarnya masih bernilai ekonomi (plastik, logam, kertas, kain, kayu, oli bekas, kaca, limbah organik) tetapi tidak memiliki kanal distribusi yang efisien ke pihak yang membutuhkan.
- Pengolah limbah/daur ulang (UMKM, pabrik daur ulang, industri kerajinan, dll.) kesulitan menemukan sumber bahan baku limbah yang konsisten, terverifikasi, dan sesuai kebutuhan.
- Tidak ada sistem yang memberikan insight & pelaporan terukur (carbon saving, waste diversion rate) untuk mendukung laporan keberlanjutan (Sustainability Report) perusahaan.

## 3. Tujuan Produk

1. Menyediakan marketplace transaksi limbah yang aman, transparan, dan mudah digunakan.
2. Mempercepat proses pencarian & pencocokan material limbah dengan bantuan AI (semantic search, bukan sekadar keyword).
3. Memberikan insight otomatis (dashboard & laporan) berbasis data transaksi untuk mendukung keputusan bisnis dan pelaporan keberlanjutan.
4. Mendorong penerapan ekonomi sirkular dan simbiosis industri secara terukur (Circular Score, Waste Diversion Rate, Carbon Saving).

## 4. Target Pengguna & Persona

### 4.1 Distributor (Produsen Limbah)
Contoh: Pabrik Makanan, Pabrik Tekstil, Industri Plastik, Rumah Sakit, Hotel, Restoran, Mall, Perusahaan Manufaktur.
Menjual: plastik, logam, kertas, kain, kayu, oli bekas, kaca, limbah organik.

### 4.2 Konsumen (Pengolah Limbah)
Contoh: Daur ulang plastik, Daur ulang logam, Pabrik semen, Industri kerajinan, UMKM, Pengolah kompos, Biodiesel, Peternakan.

### 4.3 Admin
Pengelola platform: moderasi konten, monitoring AI, laporan statistik, manajemen kategori & banner.

## 5. Ruang Lingkup Fitur

### 5.1 Distributor
| # | Kebutuhan | Prioritas |
|---|---|---|
| 1 | Registrasi akun distributor | Must |
| 2 | Login ke sistem | Must |
| 3 | Mengelola profil perusahaan | Must |
| 4 | Mengunggah data limbah | Must |
| 5 | Mengunggah foto limbah | Must |
| 6 | Menentukan kategori limbah | Must |
| 7 | Menentukan harga limbah | Must |
| 8 | Menentukan jumlah stok | Must |
| 9 | Mengubah data limbah | Must |
| 10 | Menghapus data limbah | Must |
| 11 | Melihat daftar pesanan | Must |
| 12 | Mengonfirmasi pesanan | Must |
| 13 | Mengubah status transaksi | Must |
| 14 | Melihat riwayat penjualan | Should |

### 5.2 Konsumen
| # | Kebutuhan | Prioritas |
|---|---|---|
| 1 | Mencari limbah | Must |
| 2 | AI Recommendation berbasis chatbot | Should |
| 3 | Filter (kategori, lokasi, harga, jumlah) | Must |
| 4 | Melihat detail limbah | Must |
| 5 | Melakukan pembelian | Must |
| 6 | Melakukan pembayaran | Must |
| 7 | Melihat riwayat transaksi (butuh login) | Should |
| 8 | Mendapat rekomendasi limbah yang sesuai | Should |
| 9 | Registrasi akun konsumen | Must |
| 10| Login ke sistem | Must |

### 5.3 Admin
| # | Kebutuhan | Prioritas |
|---|---|---|
| 1 | Mengelola rekomendasi AI (monitoring) | Should |
| 2 | Menghasilkan laporan statistik | Must |
| 3 | Mengelola banner & informasi platform | Should |
| 4 | Mengelola kategori limbah | Must |
| 5 | Mengelola data produk limbah | Must |
| 6 | Mengelola produk yang melanggar aturan | Must |

## 6. Fitur Marketplace Utama

### 6.1 Dashboard
Statistik limbah, transaksi, carbon saving, revenue, inventory.

### 6.2 Listing Material
Setiap limbah memiliki: foto, kategori, kode limbah, deskripsi, kualitas, kuantitas, lokasi, harga, sertifikat, MSDS (jika diperlukan).

### 6.3 Smart Search
Filter: jenis limbah, lokasi, harga, kualitas, jumlah, kategori, radius.

## 7. Alur Bisnis Utama

```
Produsen Limbah → Upload Material → Verifikasi → Marketplace →
Pencarian oleh Pembeli → Pembayaran → Pengiriman → Konfirmasi →
Laporan Circular Economy (Admin)
```

## 8. Fitur AI — Intelligent Circular Economy Engine

AI bertindak sebagai **asisten**, bukan pengganti proses bisnis. AI tidak menghitung harga atau carbon secara mandiri — seluruh angka dihitung oleh Analytics Engine berbasis data platform; LLM hanya menyusun narasi/insight.

### 8.1 AI Smart Search
Pencarian berbasis semantic similarity (vector search), bukan keyword matching.
Contoh: input "Saya mencari limbah plastik untuk membuat ember" → hasil: HDPE, PP, Plastic Flakes (meski kata "ember" tidak ada di nama produk).

### 8.2 AI Dashboard Insight
Insight otomatis dari data transaksi harian, misalnya tren permintaan, kenaikan harga material, estimasi pendapatan.

### 8.3 Circular Economy Report
Laporan otomatis berisi:
- Total limbah yang berhasil dimanfaatkan
- Waste Diversion Rate
- Carbon Saving
- Nilai ekonomi yang dihasilkan
- Jumlah transaksi
- Material paling banyak dimanfaatkan
- Circular Score perusahaan

Dapat digunakan sebagai bahan evaluasi internal / pendukung Sustainability Report.

### 8.4 AI Assistant / Chatbot (Konsumen)
Multi-turn conversation, menyimpan riwayat maksimal 5 turn terakhir. Lihat detail alur di `AGENT.md` dan `ARCHITECTURE.md`.

## 9. Skenario Gagal & Fallback (Edge Cases)

| Skenario | Kondisi | Fallback |
|---|---|---|
| LLM Timeout/Downtime | API GPT/Gemini tidak merespons | Otomatis beralih ke keyword search PostgreSQL, tampilkan toast "Pencarian AI sedang dalam pemeliharaan" |
| Similarity rendah | Skor embedding < threshold (misal 0.6) | LLM tidak boleh berhalusinasi; balas "Maaf, limbah spesifik yang Anda cari belum tersedia saat ini." + tombol "Buat Alert" |
| Input ambigu | Input terlalu singkat (misal "butuh limbah") | AI bertanya klarifikasi kebutuhan penggunaan |

## 10. Keamanan & Kerahasiaan Data

- **Prompt Injection Prevention:** Prompt Builder memisahkan tegas instruksi sistem dan input pengguna; system prompt membatasi topik yang boleh dijawab LLM.
- **Data Isolation (RAG aman):** Filter akses data dilakukan di level database (bukan LLM) berdasarkan User/Tenant ID sebelum konteks dikirim ke LLM. LLM tidak pernah memiliki akses langsung ke seluruh database.

## 11. Metrik Keberhasilan (Success Metrics)

- Jumlah listing limbah aktif per bulan
- Volume transaksi (ton/kg) & nilai ekonomi (Rp)
- Waste Diversion Rate rata-rata platform
- Total Carbon Saving (agregat)
- Tingkat akurasi AI Smart Search (relevansi hasil)
- Waktu rata-rata dari listing → transaksi selesai
- Retention rate distributor & konsumen

## 12. Non-Goals (Di Luar Cakupan Awal)

- Logistik/pengiriman terintegrasi penuh (di fase awal, status "Pengiriman" cukup dikonfirmasi manual oleh kedua pihak)
- Marketplace multi-negara/multi-currency
- Sertifikasi/audit lingkungan pihak ketiga terintegrasi otomatis (baru unggah dokumen)

## 13. Dokumen Terkait

- `ERD.md` — Struktur entitas & relasi data
- `ARCHITECTURE.md` — Arsitektur sistem & AI
- `SCHEMA.md` — Prisma schema siap implementasi
- `AGENT.md` — Kickoff prompt untuk AI coding agent

## 14. Rekomendasi Tech Stack

- **Frontend (UI & Interaksi):** Next.js (React), Tailwind CSS, Zustand / Redux Toolkit.
- **Backend (API & Bisnis Logika):** Node.js (Next.js API Routes atau Express/NestJS).
- **Database Relasional & Vektor:** PostgreSQL dengan ekstensi `pgvector`.
- **Database ORM:** Prisma.
- **File Storage (Aset & Media):** AWS S3 atau Supabase Storage.
- **Integrasi AI (LLM & Orkestrasi):** OpenAI API / Google Gemini API dikombinasikan dengan LangChain / LlamaIndex.

## 15. Struktur Proyek (Monorepo)

```text
remat-monorepo/
├── apps/
│   ├── marketplace/      # Frontend Next.js untuk Distributor & Konsumen (B2B/B2C)
│   ├── admin-panel/      # Frontend Next.js untuk Admin
│   └── api-server/       # Backend Node.js (Logika AI, Fallback Search, RAG)
├── packages/
│   ├── database/         # Prisma Schema & File Migrasi DB
│   ├── ui/               # Komponen Desain Sistem (Tailwind, Reusable UI)
│   ├── ai-core/          # Logika LangChain, Prompt Builder, Kalkulasi Skor Sirkular
│   └── config/           # Konfigurasi ESLint, TypeScript untuk seluruh workspace
├── docs/                 # Folder Dokumentasi Terpusat
│   ├── PRD.md            # Product Requirements Document (Dokumen ini)
│   ├── ERD.md            # Entitas & Relasi Data
│   ├── ARCHITECTURE.md   # Arsitektur sistem & AI
│   ├── SCHEMA.md         # Definisi Prisma schema 
│   └── AGENT.md          # Kickoff prompt untuk agen AI
├── package.json          # Dependency utama Monorepo
└── turbo.json            # Konfigurasi pipeline build (Turborepo)
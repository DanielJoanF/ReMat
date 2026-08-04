# ERD — ReMat Platform

## 1. Daftar Entitas Utama

1. **User** — akun dasar (distributor / konsumen / admin), autentikasi
2. **DistributorProfile** — profil perusahaan distributor
3. **ConsumerProfile** — profil konsumen (opsional, untuk riwayat & preferensi)
4. **Category** — kategori limbah (plastik, logam, kertas, dst.)
5. **Material** — listing limbah yang dijual distributor
6. **MaterialDocument** — sertifikat / MSDS terlampir pada material
7. **Transaction** — transaksi pembelian (order)
8. **TransactionItem** — (opsional jika multi-item per transaksi)
9. **Payment** — data pembayaran per transaksi
10. **Rating** — rating/ulasan konsumen terhadap distributor/transaksi
11. **CircularReport** — laporan ekonomi sirkular periodik per distributor
12. **ChatConversation** — sesi percakapan AI Assistant
14. **MaterialAlert** — permintaan notifikasi "Buat Alert" saat material tidak ditemukan
15. **Banner** — banner/informasi platform yang dikelola admin
16. **MaterialEmbedding** — representasi vektor material untuk AI Smart Search (vector DB, disebutkan terpisah dari relational DB)

## 2. Diagram ERD (Mermaid)

```mermaid
erDiagram
    USER ||--o| DISTRIBUTOR_PROFILE : "has"
    USER ||--o| CONSUMER_PROFILE : "has"
    DISTRIBUTOR_PROFILE ||--o{ MATERIAL : "lists"
    CATEGORY ||--o{ MATERIAL : "classifies"
    MATERIAL ||--o{ MATERIAL_DOCUMENT : "has"
    MATERIAL ||--o| MATERIAL_EMBEDDING : "has"
    MATERIAL ||--o{ TRANSACTION_ITEM : "ordered in"
    CONSUMER_PROFILE ||--o{ TRANSACTION : "places"
    DISTRIBUTOR_PROFILE ||--o{ TRANSACTION : "receives"
    TRANSACTION ||--|{ TRANSACTION_ITEM : "contains"
    TRANSACTION ||--o| PAYMENT : "paid via"
    TRANSACTION ||--o| RATING : "rated by"
    DISTRIBUTOR_PROFILE ||--o{ CIRCULAR_REPORT : "generates"
    CONSUMER_PROFILE ||--o{ CHAT_CONVERSATION : "starts"
    CHAT_CONVERSATION ||--o{ CHAT_MESSAGE : "contains"
    CONSUMER_PROFILE ||--o{ MATERIAL_ALERT : "requests"
    CATEGORY ||--o{ MATERIAL_ALERT : "for"
    USER ||--o{ BANNER : "manages (admin)"

    USER {
        string id PK
        string email
        string password_hash
        string role "distributor | consumer | admin"
        string name
        string phone
        boolean is_verified
        datetime created_at
        datetime updated_at
    }

    DISTRIBUTOR_PROFILE {
        string id PK
        string user_id FK
        string company_name
        string company_type "pabrik, hotel, RS, dll"
        string address
        string city
        float latitude
        float longitude
        string business_license_url
        boolean is_verified
        datetime created_at
    }

    CONSUMER_PROFILE {
        string id PK
        string user_id FK
        string company_name
        string industry_type
        string address
        string city
        float latitude
        float longitude
        datetime created_at
    }

    CATEGORY {
        string id PK
        string name
        string slug
        string parent_id FK "self-relation, nullable"
    }

    MATERIAL {
        string id PK
        string distributor_id FK
        string category_id FK
        string material_code
        string title
        text description
        string quality_grade
        float quantity
        string unit "kg | ton | liter | pcs"
        float price
        string currency
        string location
        float latitude
        float longitude
        string status "draft | pending_review | active | sold_out | rejected"
        boolean requires_msds
        datetime created_at
        datetime updated_at
    }

    MATERIAL_DOCUMENT {
        string id PK
        string material_id FK
        string type "certificate | msds | photo"
        string file_url
        datetime uploaded_at
    }

    MATERIAL_EMBEDDING {
        string id PK
        string material_id FK
        vector embedding
        string embedding_model
        datetime updated_at
    }

    TRANSACTION {
        string id PK
        string consumer_id FK
        string distributor_id FK
        string status "pending | confirmed | paid | shipped | completed | cancelled"
        float total_amount
        string shipping_address
        datetime created_at
        datetime updated_at
    }

    TRANSACTION_ITEM {
        string id PK
        string transaction_id FK
        string material_id FK
        float quantity
        float unit_price
        float subtotal
    }

    PAYMENT {
        string id PK
        string transaction_id FK
        string method "transfer | va | ewallet"
        string provider_ref_id
        string status "pending | success | failed | refunded"
        float amount
        datetime paid_at
    }

    RATING {
        string id PK
        string transaction_id FK
        string consumer_id FK
        string distributor_id FK
        int score "1-5"
        text comment
        datetime created_at
    }

    CIRCULAR_REPORT {
        string id PK
        string distributor_id FK
        string period "e.g. 2026-08"
        float total_waste_utilized_kg
        float waste_diversion_rate
        float carbon_saving_kg
        float economic_value
        int transaction_count
        string top_material_id FK
        float circular_score
        text ai_summary
        datetime generated_at
    }

    CHAT_CONVERSATION {
        string id PK
        string consumer_id FK
        datetime started_at
        datetime last_active_at
    }

    CHAT_MESSAGE {
        string id PK
        string conversation_id FK
        string role "user | assistant"
        text content
        json context_used "material ids / filters referenced"
        datetime created_at
    }

    MATERIAL_ALERT {
        string id PK
        string consumer_id FK
        string category_id FK
        string query_text
        string location_filter
        boolean is_active
        datetime created_at
    }

    BANNER {
        string id PK
        string title
        string image_url
        string link_url
        boolean is_active
        int order
        datetime start_at
        datetime end_at
    }
```

## 3. Catatan Desain

- **User** adalah tabel akun dasar berisi kredensial & role; profil detail dipisah ke `DistributorProfile` / `ConsumerProfile` agar skema tetap rapi dan mudah diperluas (mengikuti pola Prisma + Supabase Auth: `auth.users` ↔ tabel profil publik).
- **MaterialEmbedding** disimpan terpisah dari `Material` karena secara arsitektur berada di Vector Database (bukan PostgreSQL) — lihat `ARCHITECTURE.md`. Relasi 1-1 di ERD ini menggambarkan hubungan logis, bukan physical join.
- **CircularReport** dihasilkan periodik (misal bulanan) per distributor berdasarkan agregasi `Transaction` + `Material`; `ai_summary` adalah narasi dari LLM, sedangkan angka lain dihitung oleh Analytics Engine (bukan LLM).
- **ChatMessage** menyimpan histori percakapan; aplikasi hanya perlu menampilkan 5 turn terakhir sesuai requirement, tapi data lengkap tetap disimpan untuk audit/analitik.
- **MaterialAlert** mendukung fallback "Skenario 2" (similarity rendah) di PRD — notifikasi ke konsumen saat material yang dicari tersedia di kemudian hari.
- Status transaksi (`Transaction.status`) mengikuti alur bisnis: `pending → confirmed → paid → shipped → completed` (dengan opsi `cancelled` di titik manapun sebelum `completed`).

# Design Specification: ReMat Circular Systems

## 1. Overview & Brand Identity

**ReMat** is a collaborative distributor-to-consumer platform built for zero-waste industrial circular economies. The brand bridges industrial waste suppliers and buyers, transforming waste into high-value raw materials.

### Brand Attributes
- **Personality:** Innovative, Sustainable, Transparent, Efficient, Corporate.
- **Visual Style:** Modern Corporate Minimalist with high data density and sterile, clean aesthetic appropriate for industrial material handling.
- **Core Value Proposition:** *"Ubah limbah industri menjadi bahan baku bernilai."*

---

## 2. Design Tokens

### 2.1 Color Palette

#### Primary Palette (Sustainability & Trust)
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `primary` | `#006130` | Main Brand Emerald, Primary CTAs, Active Tabs |
| `primary-container` | `#107C41` | Hover state for Primary Buttons, Accents |
| `on-primary` | `#FFFFFF` | Text on Primary background |
| `on-primary-container` | `#B6FFC5` | Light text badges on primary containers |
| `primary-fixed-dim` | `#7ADA95` | Secondary green highlights & verified badges |

#### Secondary Palette (Corporate Authority)
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `secondary` | `#436182` | Deep Steel Blue, Secondary buttons, Icons |
| `secondary-container` | `#B9D7FD` | Active sidebar item, light user chat bubble |
| `on-secondary` | `#FFFFFF` | Text on secondary buttons |
| `on-secondary-container`| `#405E7E` | Dark text on secondary light container |

#### Tertiary & Accent Palette (Tech & Interactive Features)
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `tertiary` | `#004BC0` | Electric Blue, Interactive links |
| `tertiary-container` | `#0061f3` | AI Smart Match accents, stat icons |
| `surface-tint` | `#006D37` | Tint overlays |

#### Surface & Background Neutral Tokens
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `background` / `surface` | `#F8F9FF` | Soft cool-tinted page canvas |
| `surface-container-lowest`| `#FFFFFF` | Cards, Modal boxes, Header, Search bar |
| `surface-container-low` | `#EFF4FF` | Light blue-tinted secondary containers |
| `surface-container` | `#E5EEFF` | Chart area backgrounds, chips background |
| `surface-container-high`| `#DCE9FF` | Footer background, subtle hover states |
| `surface-container-highest`| `#D3E4FE` | Sidebar/footer subtle dividers |
| `on-surface` | `#0B1C30` | Primary display text & headings |
| `on-surface-variant` | `#3F4940` | Muted body copy, subtitles, meta labels |
| `outline` | `#6F7A6F` | Medium borders, inactive icons |
| `outline-variant` | `#BECABD` | Hairline card borders, subtle dividers |

#### Status Badges
| Status | Background | Text |
| :--- | :--- | :--- |
| **Grade A (Premium)** | `#006130` (Solid Green) | `#FFFFFF` |
| **Grade B (Standard)**| `#436182` (Steel Blue) | `#FFFFFF` |
| **Grade C (Campur)**  | `#6F7A6F` (Muted Gray) | `#FFFFFF` |
| **Verified** | `#E5EEFF` | `#3F4940` |
| **Active Listing** | `rgba(0, 97, 48, 0.1)` | `#006130` |
| **Sold Out** | `rgba(63, 73, 64, 0.1)` | `#3F4940` |
| **Pending** | `rgba(0, 75, 192, 0.1)` | `#004BC0` |

---

### 2.2 Typography Scale

The system uses a dual sans-serif strategy:
- **Inter:** Headings, Display titles, and Body text for high SaaS legibility.
- **Hanken Grotesk:** Labels, metadata chips, and technical tags for a modern tech-forward edge.

| Style Token | Font Family | Size | Line Height | Weight | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Inter | 48px | 56px | 700 (Bold) | -0.02em |
| `headline-lg` | Inter | 32px | 40px | 600 (SemiBold) | 0 |
| `headline-lg-mobile` | Inter | 24px | 32px | 600 (SemiBold) | 0 |
| `headline-md` | Inter | 24px | 32px | 600 (SemiBold) | 0 |
| `body-lg` | Inter | 18px | 28px | 400 (Regular) | 0 |
| `body-md` | Inter | 16px | 24px | 400 (Regular) | 0 |
| `label-md` | Hanken Grotesk | 14px | 20px | 600 (SemiBold) | 0 |
| `label-sm` | Hanken Grotesk | 12px | 16px | 500 (Medium) | 0 |

---

### 2.3 Layout & Grid System

- **Max Layout Width:** `1280px` (`max-w-7xl` / `container-max-width`)
- **Desktop Margin:** `32px` (`px-margin-desktop`)
- **Mobile Margin:** `16px` (`px-margin-mobile`)
- **Gutter:** `24px` (`gap-gutter`)
- **Spacing Scale:**
  - `stack-sm`: 8px
  - `stack-md`: 16px
  - `stack-lg`: 32px

---

### 2.4 Border Radius & Shadows

- **Border Radius:**
  - Small (Tags, Chips): `4px` (`rounded-sm`)
  - Buttons & Inputs: `8px` (`rounded-lg`)
  - Cards & Containers: `12px` (`rounded-xl`)
  - Full / Pill Buttons: `9999px` (`rounded-full`)
- **Elevation / Shadows:**
  - Standard Card: 1px outline (`border border-outline-variant`) with optional subtle hover shadow `shadow-sm` or `shadow-[0_4px_20px_rgba(0,0,0,0.05)]`.

---

## 3. Core Screen Architecture & Layout Specifications

### Screen 1: ReMat Landing Page
- **Top Navigation Bar:**
  - Left: ReMat Logo (`eco` icon + `ReMat` text) + Links (`Marketplace`, `Solutions`, `About`, `Impact`).
  - Right: Desktop Search Bar (`AI Smart Search...`), `Sign In` primary button.
- **Hero Section:**
  - Left: Display Title *"Platform Kolaboratif Distributor-Konsumen untuk Industri Bebas Limbah"*, subhead *"Ubah limbah industri menjadi bahan baku bernilai. Hubungkan bisnis Anda dengan jaringan sirkular ekonomi terbesar di Indonesia."*
  - CTAs: `Mulai Jual` (Primary Emerald with arrow icon), `Mulai Cari` (Secondary outlined).
  - Right: High-resolution image of modern industrial recycling facility.
- **Impact Stats Section ("Dampak Sirkular Kita"):**
  - 3 Stat Cards: `2.4M+` Ton Limbah Dimanfaatkan, `850K` Ton Karbon Dihemat, `1,200+` Mitra Industri Aktif.
- **Material Categories (Bento Grid Layout):**
  - Featured Bento grid highlighting *Kertas & Karton* (8-column featured card with volume capacity), *Plastik (PET/HDPE)*, and *Logam*.
- **Footer:**
  - Brand Logo, Privacy Policy, Terms of Service, Sustainability Report, Contact, Copyright 2024.

---

### Screen 2: Material Marketplace ("Eksplorasi Material")
- **Sidebar Filters (Width: 256px / 16rem):**
  - **Category Filter:** Checkboxes for Plastik (120), Kertas & Karton (85), Logam (42), Kaca (28).
  - **Location Filter:** Dropdown select for Cities (Semua Lokasi, Jakarta, Surabaya, Bandung, Semarang).
  - **Price Range / Ton:** Min & Max numeric inputs.
  - **Quality Grade:** Pill buttons for `A (Premium)`, `B (Standard)`, `C (Campur)`.
  - **ReMat Smart Match Box:** AI auto-matching assistant promo box with button `Aktifkan Auto-Match`.
- **Main Material Grid:**
  - Header: Title *"Eksplorasi Material"*, result count *"Menampilkan 24+ hasil untuk 'Plastik Daur Ulang'"*, sorting dropdown (`Terbaru`, `Harga Terendah`, `Kuantitas Terbanyak`), View switcher (Grid vs List).
  - Material Cards (3 Columns):
    - Image thumbnail with Grade Badge (`Grade A`, `Grade B`, `Grade C`) & Favorite icon button.
    - Title (e.g. *Limbah Plastik HDPE Flakes Bersih*).
    - Metadata: Category tag, Verified tag, Quantity available, Location.
    - Price display per kg (e.g., `Rp 8.500 / kg`), Arrow detail button.
- **Alert Card:**
  - *"Tidak menemukan material spesifik?"* with `Buat Alert` button.
- **Pagination:** `< 1 2 3 ... >` controls.

---

### Screen 3: Material Detail & AI Assistant ("Asisten ReMat")
- **Left Column (Material Information):**
  - Top: Material image with `Verified Grade` badge overlay.
  - Detail Header: Title (e.g., *Biji Plastik PET Grade A (Clear)*), Distributor Name (*EcoPlast Indonesia* with verified badge), Price (`Rp 12.500 / kg`, Min Order 5 Ton).
  - Key Spec Grid: Availability (25 Ton), Grade (Grade A Premium), Warehouse Location (Bekasi, Jawa Barat), Certification (`MSDS` document link).
  - Description: Extended technical details regarding hot wash, optical sorting, contamination levels (<50ppm), and application suitability.
  - Actions: `Beli Sekarang` (Primary Emerald) & `Hubungi Penjual` (Secondary Outline).
- **Right Column (AI Procurement Assistant Sidebar):**
  - Sticky header: `Asisten ReMat` - *AI Procurement Assistant*.
  - Chat Window: Greeting message, suggested quick prompt chips (*"Apakah bisa dikirim ke Surabaya?"*, *"Minta rincian kualitas material"*, *"Harga grosir 10 Ton?"*).
  - Input field with send button for real-time AI negotiation and procurement inquiries.

---

### Screen 4: Distributor Dashboard ("Ringkasan")
- **Left Sidebar Navigation:**
  - Distributor Profile card: *ReMat Distributor - Industrial Waste Hub*.
  - Action button: `+ Post Material`.
  - Navigation menu: `Overview` (Active), `Inventory`, `Orders`, `Analytics`, `Settings`, `Support`, `Log Out`.
- **Top Header Bar:**
  - Title *"Ringkasan"*, Primary action button `Unggah Data Limbah`.
- **KPI Summary Cards (Bento 4-Column Grid):**
  1. **Tingkat Pengalihan Limbah:** `78%` (+5.2% trend).
  2. **Penghematan Karbon (kg):** `12,450`.
  3. **Total Pendapatan:** `Rp 45.2M` (+12.4% trend).
  4. **Skor Sirkular:** `92 / 100`.
- **Analytics & Recent Listings Section:**
  - **Bar Chart:** *"Distribusi Limbah Bulanan"* with year filter.
  - **Recent Listings Table:**
    - Item 1: *Kertas Karton Bekas* | Active | 2.5 Ton | Rp 4.5M
    - Item 2: *Plastik PET Cacah* | Sold Out | 1.2 Ton | Rp 8.2M
    - Item 3: *Serbuk Kayu Jati* | Pending | 500 Kg | Rp 1.1M

---

## 4. Interaction & UX Guidelines

1. **AI Grounding:** All AI search and assistant responses are tailored specifically to circular economy logistics, material purity grades, bulk pricing tiers, and regional transport estimates in Indonesia.
2. **Responsive Fluidity:**
   - Desktop: 12-column bento grids with persistent sidebars.
   - Mobile: Single column layouts with collateral drawer/hamburger navigation and compact search triggers.
3. **Micro-Interactions:**
   - Smooth button scale & opacity transitions (`hover:opacity-90 active:scale-95`).
   - Image subtle zoom effect on material card hover (`group-hover:scale-105 transition-transform duration-300`).
   - Interactive prompt chips in AI Procurement Assistant that auto-trigger contextual responses.

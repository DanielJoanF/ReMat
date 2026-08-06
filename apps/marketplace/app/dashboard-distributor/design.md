# Design Specification: Distributor Dashboard (Industrial Waste Hub)

## 1. General Principles & Design System

* Target Audience: B2B Waste Management & Industrial Material Distributors.
* UI/UX Tone: Clean, High-Contrast, Enterprise-grade, Eco-Industrial, Professional.
* Font Family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
* Numeric Performance: All table data, KPI metrics, prices, and quantities MUST use `font-variant-numeric: tabular-nums` (Tailwind class: `tabular-nums`).
* Icons: Lucide React or Heroicons (Outline style, 18px-20px size).

---

## 2. Color Palette & Tokens

| Element | Color Name | Hex / Tailwind Class | Description |
| :--- | :--- | :--- | :--- |
| Primary Brand | Forest Green | #065F46 (emerald-800) | Main action buttons, active pagination |
| Primary Hover | Deep Emerald | #047857 (emerald-700) | Hover state for primary buttons |
| Active Nav Highlight | Soft Blue | #DBEAFE (blue-100) | Sidebar active item background |
| Active Nav Text | Royal Blue | #1D4ED8 (blue-700) | Sidebar active item text |
| Page Background | Cool Gray | #F8FAFC (slate-50) | Main canvas background |
| Card / Surface | Pure White | #FFFFFF (white) | KPI Cards, Tables, Charts container |
| Borders | Light Border | #E2E8F0 (slate-200) | Card borders & section dividers |
| Text Primary | Dark Slate | #0F172A (slate-900) | Main headings, big metrics, titles |
| Text Secondary | Muted Gray | #64748B (slate-500) | Subtitles, table headers, field labels |

### Status Badge Tokens
* Active / Aktif: `bg-emerald-100 text-emerald-800 border-emerald-200` (Dot indicator: `#10B981`)
* Sold Out / Habis: `bg-slate-100 text-slate-700 border-slate-200` (Dot indicator: `#64748B`)
* Pending / Menunggu: `bg-amber-100 text-amber-800 border-amber-200` (Dot indicator: `#F59E0B`)

---

## 3. Typography Hierarchy

* Page Title: 22px | SemiBold (font-semibold) | #0F172A
* Page Subtitle: 13px | Regular (font-normal) | #64748B
* Card Title / Section Header: 16px | SemiBold (font-semibold) | #1E293B
* KPI Metrics Value: 28px - 32px | Bold (font-bold) | tabular-nums | #0F172A
* KPI Labels / Helper: 11px | Medium (font-medium) | UPPERCASE | #64748B
* Table Header: 12px | SemiBold (font-semibold) | UPPERCASE | #64748B
* Table Body / List Text: 14px | Regular or Medium | #0F172A
* Badges / Small Captions: 12px | Medium (font-medium)

---

## 4. Layout Structure

* Layout: Two-column layout with fixed left sidebar (width: 240px) and flexible main content area (flex-1).
* Sidebar Profile: Top profile card with initial avatar, name "ReMat Distributor", and subtitle "Industrial Waste Hub".
* Sidebar Primary CTA: Prominent button "+ Post Material" styled in Forest Green with full width.
* Sidebar Navigation Links:
  - Overview (Active state: Soft Blue background #DBEAFE, Royal Blue text #1D4ED8)
  - Inventory
  - Orders
  - Analytics
  - Settings
* Sidebar Bottom Area: "Support" and "Log Out" links with outline icons.
* Main Content Area ("Ringkasan"):
  - Top Bar Header: Page title "Ringkasan" with subtitle on the left, and "+ Unggah Data Limbah" action button on the far right.
  - KPI Cards Row: 4-column responsive grid displaying key performance metrics with trend indicators.
  - Charts & Lists Row: Split grid (Left ~60% for Bar Chart "Distribusi Limbah Bulanan", Right ~40% for "Daftar Terbaru" activity list).

---

## 5. Component Specifications

### A. Sidebar Component
* Width: 240px, Sticky fixed to the left, Background #FFFFFF, Right border 1px solid #E2E8F0.
* Profile Section: Avatar 36px x 36px circle in Forest Green, Title "ReMat Distributor" (14px Bold), Subtitle "Industrial Waste Hub" (11px Muted).
* Navigation Items: Vertical list with 8px vertical padding per item, 12px horizontal padding, 6px border-radius on hover.

### B. Header Component
* Title: "Ringkasan" (22px SemiBold)
* Subtitle: "Ringkasan performa & aktivitas pengelolaan limbah Anda." (13px Muted)
* Action Button: Forest Green button with text "+ Unggah Data Limbah" (14px SemiBold).

### C. KPI Cards (4 Column Grid)
* Card Container: White background, 1px solid #E2E8F0 border, shadow-sm, 16px padding, 12px border-radius.
* Card 1: Label "TINGKAT PENGALIHAN LIMBAH", Value "84.5%", Badge "+5.2%" (Green arrow).
* Card 2: Label "PENGHEMATAN KARBON", Value "12,450 kg", Badge "+12% vs bln lalu".
* Card 3: Label "TOTAL PENDAPATAN", Value "Rp 148.500.000", Badge "+8.4%".
* Card 4: Label "SKOR SIRKULAR", Value "A+ (92/100)", Subtext "Sangat Baik".

### D. Charts & Recent Items Section
* Bar Chart ("Distribusi Limbah Bulanan"):
  - Y-Axis: Tonase Limbah (Ton)
  - X-Axis: Months (Jan - Des)
  - Bar Styling: Default bars in Slate Gray (#94A3B8), Peak/Active month bar highlighted in Forest Green (#065F46).
* Recent Items List ("Daftar Terbaru"):
  - Header: "Daftar Terbaru" with a "Lihat Semua ->" link.
  - Item Row Layout: Flex container with 40px thumbnail image, Title & Category badge, Status dot badge (Aktif / Habis / Menunggu), Quantity (Ton), and Price (Rp/kg).
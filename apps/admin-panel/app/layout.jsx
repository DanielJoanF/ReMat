import "./globals.css";

export const metadata = {
  title: "ReMat Admin Panel — Dashboard Moderasi & Analitik",
  description: "Panel Kontrol Admin ReMat — Verifikasi Penjualan, Laporan Ekonomi Sirkular",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-100 antialiased">{children}</body>
    </html>
  );
}

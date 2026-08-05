import "./globals.css";

export const metadata = {
  title: "ReMat Marketplace — Platform Limbah Industri Sirkular",
  description: "Marketplace limbah industri berbasis ekonomi sirkular",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}

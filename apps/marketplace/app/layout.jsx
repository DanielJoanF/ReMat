import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "ReMat Marketplace — Platform Limbah Industri Sirkular",
  description:
    "ReMat adalah platform B2B/B2C marketplace limbah industri berbasis ekonomi sirkular dengan AI Smart Search.",
  keywords: ["marketplace limbah", "industri sirkular", "daur ulang", "material bekas", "remat"],
  openGraph: {
    title: "ReMat Marketplace",
    description: "Platform Kolaboratif Distributor-Konsumen untuk Industri Bebas Limbah",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "Masuk — ReMat",
  description: "Masuk ke portal ReMat Anda",
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
      <body className="min-h-screen antialiased bg-gray-50">
        <main>{children}</main>
      </body>
    </html>
  );
}

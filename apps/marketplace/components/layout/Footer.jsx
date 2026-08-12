import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const FOOTER_LINKS = {
  Platform: [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/search", label: "AI Smart Search" },
    { href: "/consumer/orders", label: "Pesanan Saya" },
  ],
  Informasi: [
    { href: "/blog", label: "Blog & Insight" },
    { href: "/faq", label: "FAQ" },
  ],
  Legal: [
    { href: "/privacy", label: "Kebijakan Privasi" },
    { href: "/terms", label: "Syarat & Ketentuan" },
    { href: "/cookies", label: "Cookie Policy" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-remat-blue border-t border-remat-blue-dark/20">
      {/* Newsletter */}
      <div className="border-b border-remat-blue-dark/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {/* <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Tetap Terhubung dengan ReMat</h3>
              <p className="text-sm text-gray-500">Dapatkan update material terbaru dan insight ekonomi sirkular.</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Email Anda..."
                className="input-base flex-1 md:w-64"
              />
              <button type="submit" className="btn-primary gap-2 flex-shrink-0">
                Daftar <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div> */}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-remat-green rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-2xl text-gray-900 tracking-tight">
                Re<span className="text-remat-green">Mat</span>
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed mb-5 max-w-xs">
              Platform kolaboratif produsen-konsumen untuk industri bebas limbah. Membangun ekonomi sirkular bersama.
            </p>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <a href="mailto:hello@remat.id" className="flex items-center gap-2 hover:text-remat-green transition-colors">
                <Mail className="w-4 h-4" /> hello@remat.id
              </a>
              <a href="tel:+6221001234" className="flex items-center gap-2 hover:text-remat-green transition-colors">
                <Phone className="w-4 h-4" /> +62 21 000 1234
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Jakarta Selatan, Indonesia
              </span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-remat-green transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-remat-blue-dark/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} ReMat Platform. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Untuk industri bebas limbah 🌱
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

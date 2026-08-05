import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  Package,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Truck,
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_CATEGORIES = [
  { id: "1", name: "Plastik HDPE", slug: "plastik-hdpe", count: "42 ton", gradient: "from-blue-600 to-blue-800", emoji: "♻️" },
  { id: "2", name: "Logam Besi", slug: "logam-besi", count: "128 ton", gradient: "from-gray-600 to-gray-800", emoji: "🔩" },
  { id: "3", name: "Kertas Daur Ulang", slug: "kertas", count: "65 ton", gradient: "from-amber-600 to-amber-800", emoji: "📄" },
  { id: "4", name: "Kaca Industri", slug: "kaca", count: "30 ton", gradient: "from-teal-600 to-teal-800", emoji: "🔮" },
  { id: "5", name: "Tekstil Bekas", slug: "tekstil", count: "18 ton", gradient: "from-pink-600 to-pink-800", emoji: "🧵" },
  { id: "6", name: "Elektronik (e-Waste)", slug: "ewaste", count: "9 ton", gradient: "from-purple-600 to-purple-800", emoji: "💻" },
];



const FEATURES = [
  { icon: Sparkles, title: "AI Smart Search", desc: "Temukan material ideal dengan pencarian semantik bertenaga AI." },
  { icon: ShieldCheck, title: "Distributor Terverifikasi", desc: "Setiap distributor telah melewati proses verifikasi ketat." },
  { icon: Truck, title: "Logistik Terintegrasi", desc: "Koordinasikan pengiriman langsung dari platform ReMat." },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-remat-green-light to-remat-blue">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-remat-green/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-remat-blue rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-remat-green/10 text-remat-green text-sm font-semibold px-3 py-1.5 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                Platform Ekonomi Sirkular #1 Indonesia
              </div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-5 text-balance">
                Platform Kolaboratif{" "}
                <span className="text-remat-green">Distributor-Konsumen</span>{" "}
                untuk Industri Bebas Limbah
              </h1>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-xl">
                Temukan material industri berkualitas, dukung ekonomi sirkular, dan kurangi jejak karbon bersama ratusan distributor terverifikasi di seluruh Indonesia.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/marketplace" id="hero-cta-jual" className="btn-primary text-base px-6 py-3 gap-2">
                  Mulai Cari <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/search" id="hero-cta-cari" className="btn-outline text-base px-6 py-3 gap-2">
                  <Sparkles className="w-4 h-4" /> Coba AI Search
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-6 mt-8 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-remat-green" /> Terverifikasi</span>
                <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-remat-green" /> Pengiriman Nasional</span>
                <span className="flex items-center gap-1.5"><Leaf className="w-4 h-4 text-remat-green" /> Ramah Lingkungan</span>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative hidden md:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Main card */}
                <div className="card p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-remat-green-light rounded-xl flex items-center justify-center text-2xl">♻️</div>
                    <div>
                      <p className="font-semibold text-gray-900">Biji Plastik PET Grade A</p>
                      <p className="text-xs text-gray-400">PT. Green Recycle · Surabaya</p>
                    </div>
                    <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Aktif</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    {[["500 kg", "Stok"], ["Grade A", "Kualitas"], ["Rp 12.500", "/ kg"]].map(([v, l]) => (
                      <div key={l} className="bg-gray-50 rounded-lg p-2">
                        <p className="font-bold text-sm text-gray-900">{v}</p>
                        <p className="text-xs text-gray-400">{l}</p>
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary w-full gap-2">
                    Lihat Detail <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 card px-3 py-2 shadow-lg text-xs font-semibold text-green-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Match 96%
                </div>
                <div className="absolute -bottom-4 -left-4 card px-3 py-2 shadow-lg text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-remat-green" /> -45kg CO₂
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── Categories Section ────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Kategori Material</h2>
              <p className="section-subtitle">Jelajahi ratusan jenis material industri siap pakai.</p>
            </div>
            <Link href="/marketplace" className="flex items-center gap-1 text-sm font-semibold text-remat-green hover:text-remat-green-dark transition-colors">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {MOCK_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/marketplace?categorySlug=${cat.slug}`}
                className="group relative overflow-hidden rounded-card aspect-square flex flex-col justify-end cursor-pointer"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} transition-transform duration-300 group-hover:scale-105`} />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                {/* Content */}
                <div className="relative p-3">
                  <p className="text-2xl mb-1">{cat.emoji}</p>
                  <p className="text-white font-bold text-sm leading-tight">{cat.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">{cat.count}</p>
                </div>
                {/* Arrow */}
                <div className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">Mengapa Memilih ReMat?</h2>
            <p className="section-subtitle">Solusi lengkap untuk rantai pasok material industri yang berkelanjutan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 p-6 card hover:border-remat-green/30 transition-all duration-200">
                <div className="w-12 h-12 bg-remat-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-6 h-6 text-remat-green" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-remat-green">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Bergabung dengan Ekosistem Sirkular?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Daftar sekarang dan mulai kontribusi nyata dalam mengurangi limbah industri Indonesia.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/marketplace" className="inline-flex items-center gap-2 bg-white text-remat-green font-bold px-6 py-3 rounded-lg hover:bg-remat-blue transition-colors">
              <Package className="w-5 h-5" /> Jelajahi Material
            </Link>
            <Link href="/search" className="inline-flex items-center gap-2 bg-remat-green-dark text-white font-bold px-6 py-3 rounded-lg hover:bg-remat-green-dark/80 transition-colors">
              <Sparkles className="w-5 h-5" /> Coba AI Search
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

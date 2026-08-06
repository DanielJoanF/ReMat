import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  Package,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Truck,
  BadgeCheck,
} from "lucide-react";
import Footer from "@/components/layout/Footer";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_CATEGORIES = [
  { id: "1", name: "Plastik", slug: "plastik", imageUrl: "/plastic.jpeg"},
  { id: "2", name: "Kertas & Kardus", slug: "kertas-kardus", imageUrl: "/paper.jpg"},
  { id: "3", name: "Logam", slug: "logam", imageUrl: "/metal.jpeg"},
  { id: "4", name: "Kaca", slug: "kaca", imageUrl: "/glass.jpeg"},
  { id: "5", name: "Elektronik", slug: "elektronik", imageUrl: "/electronic.jpg"},
  { id: "6", name: "Tekstil", slug: "tekstil", imageUrl: "/tekstil.jpeg"},
];



const FEATURES = [
  { icon: Sparkles, title: "AI Smart Search", desc: "Temukan material ideal dengan pencarian semantik bertenaga AI." },
  { icon: ShieldCheck, title: "Distributor Terverifikasi", desc: "Setiap distributor telah melewati proses verifikasi ketat." },
  { icon: Leaf, title: "Daur Ulang Berkelanjutan", desc: "Mendukung ekonomi sirkular melalui daur ulang limbah." },
];

export default function HomePage() {
  return (
    <div className="bg-white h-[calc(100vh-64px)] overflow-y-auto snap-y snap-mandatory scroll-smooth">
      <style>{`
        main + footer {
          display: none !important;
        }
      `}</style>
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950/20 h-[calc(100vh-64px)] snap-start flex items-center">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          >
            <source src="/bg-page.mp4" type="video/mp4" />
          </video>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="animate-slide-up">
              {/* <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold px-3 py-1.5 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                Platform Ekonomi Sirkular #1 Indonesia
              </div> */}
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-white leading-tight mb-5 text-balance">
                Platform Kolaboratif{" "}
                <span className="text-emerald-400">Distributor-Konsumen</span>{" "}
                untuk Industri Bebas Limbah
              </h1>
              <p className="text-lg text-neutral-300 mb-8 leading-relaxed max-w-xl">
                Temukan material industri berkualitas, dukung ekonomi sirkular, dan kurangi jejak karbon bersama ratusan distributor terverifikasi di seluruh Indonesia.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/marketplace" id="hero-cta-jual" className="btn-primary text-base px-6 py-3 gap-2">
                  Mulai Cari <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/search" id="hero-cta-cari" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 hover:border-white hover:bg-white/10 text-white font-semibold text-base rounded-lg transition-all duration-200">
                  <Sparkles className="w-4 h-4" /> Coba AI Search
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-6 mt-8 text-sm text-neutral-400">
                <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-emerald-400" /> Terverifikasi</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Transaksi Aman</span>
                <span className="flex items-center gap-1.5"><Leaf className="w-4 h-4 text-emerald-400" /> Berkelanjutan</span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── Categories Section ────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 snap-start min-h-[calc(100vh-64px)] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-center mb-8">
            <h2 className="section-title">Kategori Material</h2>
            <p className="section-subtitle">Jelajahi ratusan jenis material industri siap pakai.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {MOCK_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/marketplace?categorySlug=${cat.slug}`}
                className="group relative overflow-hidden rounded-card aspect-square flex flex-col justify-end cursor-pointer"
              >
                {/* Background image */}
                <div className="absolute inset-0 bg-gray-200" />
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent group-hover:from-black/90 group-hover:via-black/45 transition-colors" />
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

      {/* ── Features, CTA Banner & Footer ─────────────────────────────────── */}
      <div className="snap-start flex flex-col justify-between min-h-[calc(100vh-64px)] bg-white">
        {/* Features Content */}
        <section className="py-16 bg-white flex-1 flex flex-col justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
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

        {/* CTA Banner & Footer */}
        <div className="bg-remat-green">
          <section className="py-12 text-center w-full">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Siap Bergabung dengan Ekosistem Sirkular?
              </h2>
              <p className="text-white/80 text-sm mb-6 max-w-xl mx-auto">
                Daftar sekarang dan mulai kontribusi nyata dalam mengurangi limbah industri Indonesia.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/marketplace" className="inline-flex items-center gap-2 bg-white text-remat-green font-semibold px-5 py-2.5 rounded-lg hover:bg-remat-blue text-sm transition-colors">
                  <Package className="w-4 h-4" /> Jelajahi Material
                </Link>
                <Link href="/search" className="inline-flex items-center gap-2 bg-remat-green-dark text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-remat-green-dark/80 text-sm transition-colors">
                  <Sparkles className="w-4 h-4" /> Coba AI Search
                </Link>
              </div>
            </div>
          </section>
          <Footer />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Sparkles, Bell, X, ChevronRight, Package, MapPin } from "lucide-react";
import MaterialCard from "@/components/ui/MaterialCard";
import EmptyState from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/SkeletonLoader";
import { useAuth } from "@/lib/auth-context";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_RESULTS = [
  { id: "1", title: "Biji Plastik PET Grade A (Clear)", quality_grade: "Grade A", quantity: 500, unit: "kg", price: 12500, location: "Surabaya", status: "active", isVerified: true, distributorName: "PT. EcoRecycle Jaya", category: { name: "Plastik PET" }, score: 96 },
  { id: "7", title: "Biji Plastik PP Clear Regrind", quality_grade: "Grade A", quantity: 700, unit: "kg", price: 9800, location: "Tangerang", status: "active", isVerified: true, distributorName: "PT. Polipropilena Prima", category: { name: "Plastik PP" }, score: 89 },
  { id: "4", title: "HDPE Drum Plastik Bekas", quality_grade: "Grade B", quantity: 150, unit: "pcs", price: 85000, location: "Bandung", status: "active", isVerified: true, distributorName: "PT. Plastik Nusantara", category: { name: "Plastik HDPE" }, score: 82 },
  { id: "11", title: "Sisa makanan catering", quality_grade: "Grade A", quantity: 100, unit: "kg", price: 2500, location: "Jakarta", status: "active", isVerified: true, distributorName: "Catering Makanan Indonesia", category: { name: "Limbah Makanan" }, imageUrl: null },
];

const SUGGESTED_QUERIES = [
  "Plastik PET bersih grade A Surabaya",
  "Scrap besi H2 minimal 1 ton",
  "Kertas OCC Jabodetabek",
  "Aluminium scrap shredded harga terbaik",
];

function AlertModal({ query, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // POST /alerts (stub)
    setSubmitted(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Aktifkan Alert Material</h3>
              <p className="text-sm text-gray-500 mt-0.5">Kami akan memberitahu Anda saat material tersedia.</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-remat-green-light rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7 text-remat-green" />
              </div>
              <p className="font-semibold text-gray-900">Alert Berhasil Dibuat!</p>
              <p className="text-sm text-gray-500 mt-1">Kami akan segera menghubungi Anda.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Kata Kunci Pencarian</label>
                <input className="input-base" value={query} readOnly />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Kategori (opsional)</label>
                <input className="input-base" placeholder="Contoh: Plastik PET" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Notifikasi</label>
                <input className="input-base" type="email" required placeholder="email@anda.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" id="alert-submit-btn" className="btn-primary w-full gap-2">
                <Bell className="w-4 h-4" /> Aktifkan Alert
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role } = useAuth();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialQuery ? MOCK_RESULTS : []);
  const [searchType, setSearchType] = useState(initialQuery ? "semantic" : null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertCreated, setAlertCreated] = useState(false);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setSearchQuery(q);
    router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));

    if (q.toLowerCase().includes("besi cor") || q.toLowerCase().includes("karet")) {
      setResults([]);
      setSearchType("semantic");
      setShowAlert(true);
    } else {
      setResults(MOCK_RESULTS.filter((r) => r.title.toLowerCase().includes(q.split(" ")[0]?.toLowerCase() || "") || true));
      setSearchType("semantic");
      setShowAlert(false);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Search Hero ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-remat-green to-remat-green-dark py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" /> Powered by AI — Semantic Search
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">AI Smart Search</h1>
          <p className="text-white/80 mb-8 text-sm md:text-base">
            Deskripsikan material yang Anda butuhkan secara natural. AI kami akan memahami maksud Anda.
          </p>

          {/* Search Bar */}
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="ai-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: plastik PET bersih grade A untuk kemasan makanan di Surabaya"
                className="w-full pl-12 pr-36 py-4 bg-white rounded-xl text-gray-900 text-sm border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                id="ai-search-btn"
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-5 py-2.5 text-sm"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Suggested queries */}
          {!searchQuery && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); handleSearch(q); }}
                  className="text-xs bg-white/20 text-white hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results Area ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {searchQuery && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <p className="text-gray-700">
              Hasil pencarian untuk: <span className="font-semibold text-gray-900">&quot;{searchQuery}&quot;</span>
            </p>
            {searchType === "semantic" && !showAlert && (
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-remat-green to-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" /> AI Semantic Match
              </span>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CardGridSkeleton count={3} />
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((material) => (
                <div key={material.id} className="relative">
                  {/* AI Score Badge */}
                  {searchType === "semantic" && material.score && (
                    <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-br from-remat-green to-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      AI {material.score}%
                    </div>
                  )}
                  <MaterialCard material={material} />
                </div>
              ))}
            </div>
          </>
        ) : searchQuery ? (
          /* Empty State + Alert CTA */
          <div className="max-w-2xl mx-auto">
            <EmptyState
              icon={Search}
              title="Material Tidak Ditemukan"
              description={`Tidak ada material yang cocok untuk "${searchQuery}". Jangan khawatir — aktifkan alert dan kami akan memberitahu Anda saat tersedia!`}
            />

            {showAlert && !alertCreated && (
              <div className="mt-4 border-2 border-remat-green/30 bg-remat-green-light rounded-2xl p-8 text-center animate-slide-up">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Bell className="w-8 h-8 text-remat-green" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Beritahu Saya Jika Tersedia</h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                  Aktifkan notifikasi dan kami akan langsung menghubungi Anda saat material <strong>"{searchQuery}"</strong> tersedia di platform.
                </p>
                <button
                  id="create-alert-cta-btn"
                  onClick={() => setShowAlertModal(true)}
                  className="btn-primary text-base px-8 py-3 gap-2"
                >
                  <Bell className="w-5 h-5" /> Beritahu Saya Jika Barang Ini Tersedia
                </button>
              </div>
            )}

            {alertCreated && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <p className="font-semibold text-green-700">✓ Alert berhasil dibuat! Kami akan menghubungi Anda segera.</p>
                <a href="/consumer/alerts" className="text-sm text-remat-green font-medium mt-2 inline-flex items-center gap-1 hover:underline">
                  Lihat Alert Saya <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Initial state — no search yet */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-remat-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-remat-green/60" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mulai Pencarian AI Anda</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Gunakan bahasa natural untuk mendeskripsikan kebutuhan material Anda. AI kami akan menemukan yang paling cocok.
            </p>
          </div>
        )}
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <AlertModal
          query={searchQuery}
          onClose={() => setShowAlertModal(false)}
          onSuccess={() => setAlertCreated(true)}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-remat-green border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}

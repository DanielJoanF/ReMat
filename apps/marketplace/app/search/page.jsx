"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Sparkles, Package, MapPin } from "lucide-react";
import MaterialCard from "@/components/ui/MaterialCard";
import EmptyState from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/SkeletonLoader";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const SUGGESTED_QUERIES = [
  "Plastik PET bersih grade A Surabaya",
  "Scrap besi H2 minimal 1 ton",
  "Kertas OCC Jabodetabek",
  "Aluminium scrap shredded harga terbaik",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { role } = useAuth();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [searchType, setSearchType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setSearchQuery(q);
    router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });

    try {
      const res = await api.searchMaterials({ q: q.trim() });
      const mapped = (res.data || []).map(r => ({
        ...r,
        quality_grade: r.qualityGrade || "Grade A",
        isVerified: r.distributor?.isVerified || false,
        distributorName: r.distributor?.companyName || "Produsen",
        imageUrl: r.documents?.[0]?.fileUrl || null,
        unit: r.unit?.toLowerCase() || "kg",
        status: r.status?.toLowerCase() || "active",
        score: r.similarity ? Math.round(r.similarity * 100) : null
      }));
      setResults(mapped);
      setSearchType(res.searchType);
    } catch (err) {
      console.error("AI search failed:", err);
      setResults([]);
      setSearchType("keyword");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Search Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-gray-50/20 border-b border-gray-100 py-20 px-4">
        {/* Subtle decorative glow in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-remat-green/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* <div className="inline-flex items-center gap-2 bg-emerald-50 text-remat-green text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 border border-remat-green/10 shadow-sm shadow-remat-green/5">
            <Sparkles className="w-3.5 h-3.5 text-remat-green animate-pulse" /> Powered by AI — Semantic Search
          </div> */}
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            AI Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-remat-green to-emerald-600">Search</span>
          </h1>
          
          <p className="text-gray-500 max-w-xl mx-auto mb-10 text-sm md:text-base leading-relaxed">
            Deskripsikan material yang Anda butuhkan secara natural. AI kami akan memahami maksud dan spesifikasi yang Anda cari.
          </p>

          {/* Search Bar */}
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="max-w-2xl mx-auto">
            <div className="relative group">
              {/* Subtle hover outline glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-remat-green to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
              
              <div className="relative flex items-center bg-white rounded-2xl border border-gray-200/80 shadow-md focus-within:border-remat-green focus-within:ring-4 focus-within:ring-remat-green/10 transition-all duration-300">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="ai-search-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Contoh: plastik PET bersih grade A untuk kemasan makanan di Surabaya"
                  className="w-full pl-12 pr-28 py-4 bg-transparent text-gray-900 text-sm border-0 focus:outline-none placeholder:text-gray-400"
                />
                <button
                  id="ai-search-btn"
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-5 py-2 text-sm shadow-sm"
                >
                  Cari
                </button>
              </div>
            </div>
          </form>

          {/* Suggested queries */}
          {!searchQuery && (
            <div className="mt-8">
              <span className="text-xs text-gray-400 block mb-3 font-medium">Rekomendasi Pencarian:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); handleSearch(q); }}
                    className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-remat-green/50 hover:text-remat-green px-3.5 py-1.5 rounded-full transition-all duration-200 shadow-sm hover:shadow"
                  >
                    {q}
                  </button>
                ))}
              </div>
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
            {searchType === "semantic" && (
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
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          </>
        ) : searchQuery ? (
          /* Empty State + Alert CTA */
          <div className="max-w-2xl mx-auto">
            <EmptyState
              icon={Search}
              title="Material Tidak Ditemukan"
              description={`Tidak ada material yang cocok untuk "${searchQuery}". Silakan coba deskripsikan dengan kata kunci lain.`}
            />
          </div>
        ) : (
          /* Initial state — no search yet */
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner animate-pulse">
              <Sparkles className="w-8 h-8 text-remat-green" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2.5">Mulai Pencarian AI Anda</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Gunakan bahasa sehari-hari untuk mendeskripsikan kebutuhan material Anda. AI kami akan menganalisis kecocokan semantik untuk menemukan hasil terbaik.
            </p>
          </div>
        )}
      </div>
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

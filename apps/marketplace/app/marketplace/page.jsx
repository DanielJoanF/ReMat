"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  X,
  Search,
  Filter,
} from "lucide-react";
import MaterialCard from "@/components/ui/MaterialCard";
import { CardGridSkeleton } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";
import { api } from "@/lib/api";

const FALLBACK_CATEGORIES = [
  "Plastik", "Kertas & Kardus", "Logam", "Kaca", "Elektronik", "Tekstil", "Limbah Organik", "Minyak Jelantah", "Kayu", "Makanan"
];

const FALLBACK_LOCATIONS = ["Jakarta", "Surabaya", "Bandung", "Bekasi", "Semarang", "Tangerang", "Medan", "Makassar"];
const GRADES = ["Grade A", "Grade B", "Grade C"];
const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "stock_desc", label: "Stok Terbanyak" },
];

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [materials, setMaterials] = useState([]);
  const [categoriesList, setCategoriesList] = useState(FALLBACK_CATEGORIES);
  const [locationsList, setLocationsList] = useState(FALLBACK_LOCATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Filter state (synced with URL)
  const [filters, setFilters] = useState({
    categories: searchParams.getAll("category") || [],
    location: searchParams.get("location") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    grades: searchParams.getAll("grade") || [],
    sort: searchParams.get("sort") || "newest",
  });

  useEffect(() => {
    let active = true;
    const loadMarketplaceData = async () => {
      setIsLoading(true);
      try {
        const [materialsRes, categoriesRes] = await Promise.all([
          api.getMaterials({ limit: 100 }),
          api.getCategories().catch(() => [])
        ]);

        if (active) {
          const dbMaterials = materialsRes?.data || [];
          const mappedMaterials = dbMaterials.map(m => ({
            ...m,
            quality_grade: m.qualityGrade || "Grade A",
            isVerified: m.distributor?.isVerified || false,
            distributorName: m.distributor?.companyName || "Distributor",
            imageUrl: m.documents?.[0]?.fileUrl || null,
            unit: m.unit?.toLowerCase() || "kg",
            status: m.status?.toLowerCase() || "active"
          }));
          setMaterials(mappedMaterials);

          // Extract unique categories (child categories if possible, or all)
          if (categoriesRes && categoriesRes.length) {
            const subCats = categoriesRes.filter(c => c.parentId !== null).map(c => c.name);
            if (subCats.length) {
              setCategoriesList(subCats);
            } else {
              setCategoriesList(categoriesRes.map(c => c.name));
            }
          }

          // Extract unique locations from materials
          const locs = Array.from(new Set(mappedMaterials.map(m => m.location))).filter(Boolean);
          if (locs.length) {
            setLocationsList(locs);
          }
        }
      } catch (err) {
        console.error("Failed to fetch marketplace data:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadMarketplaceData();
    return () => {
      active = false;
    };
  }, []);

  // Sync filters to URL
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    newFilters.categories.forEach((c) => params.append("category", c));
    newFilters.grades.forEach((g) => params.append("grade", g));
    if (newFilters.location) params.set("location", newFilters.location);
    if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice);
    if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice);
    if (newFilters.sort && newFilters.sort !== "newest") params.set("sort", newFilters.sort);
    router.push(`/marketplace?${params.toString()}`, { scroll: false });
  };

  const toggleCategory = (cat) => {
    const newCats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    applyFilters({ ...filters, categories: newCats });
  };

  const toggleGrade = (grade) => {
    const newGrades = filters.grades.includes(grade)
      ? filters.grades.filter((g) => g !== grade)
      : [...filters.grades, grade];
    applyFilters({ ...filters, grades: newGrades });
  };

  const clearFilters = () => {
    applyFilters({ categories: [], location: "", minPrice: "", maxPrice: "", grades: [], sort: "newest" });
  };

  const hasFilters = filters.categories.length > 0 || filters.location || filters.minPrice || filters.maxPrice || filters.grades.length > 0;

  const filteredMaterials = materials.filter((m) => {
    if (filters.categories.length && !filters.categories.includes(m.category?.name)) return false;
    if (filters.location && m.location !== filters.location) return false;
    if (filters.grades.length && !filters.grades.includes(m.quality_grade)) return false;
    if (filters.minPrice && m.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && m.price > Number(filters.maxPrice)) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eksplorasi Material</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Menampilkan <strong>{filteredMaterials.length}</strong> material
          </p>
        </div>
        <button
          id="mobile-filter-btn"
          onClick={() => setShowMobileFilter(true)}
          className="lg:hidden btn-outline text-sm gap-2"
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="flex gap-6">
        {/* ── Sidebar Filter ─────────────────────────────────────────────── */}
        <aside className={`
          w-72 flex-shrink-0 space-y-6
          ${showMobileFilter
            ? "fixed inset-y-0 left-0 z-50 bg-white p-6 overflow-y-auto shadow-xl animate-slide-up"
            : "hidden lg:block"
          }
        `}>
          {/* Mobile close */}
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="font-bold text-gray-900">Filter</h2>
            <button onClick={() => setShowMobileFilter(false)}><X className="w-5 h-5" /></button>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Hapus Semua Filter
            </button>
          )}

          {/* Kategori */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Kategori Material
            </h3>
            <div className="space-y-2">
              {categoriesList.map((cat) => (
                <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="w-4 h-4 rounded border-gray-300 text-remat-green focus:ring-remat-green/20"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-remat-green transition-colors">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Lokasi (Kota)</h3>
            <select
              id="location-filter"
              value={filters.location}
              onChange={(e) => applyFilters({ ...filters, location: e.target.value })}
              className="input-base"
            >
              <option value="">Semua Kota</option>
              {locationsList.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Harga */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Estimasi Harga Per Kg</h3>
            <div className="flex gap-2">
              <input
                id="min-price-filter"
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => applyFilters({ ...filters, minPrice: e.target.value })}
                className="input-base"
              />
              <input
                id="max-price-filter"
                type="number"
                placeholder="Maks"
                value={filters.maxPrice}
                onChange={(e) => applyFilters({ ...filters, maxPrice: e.target.value })}
                className="input-base"
              />
            </div>
          </div>

          {/* Grade */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Grade Kualitas</h3>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((grade) => (
                <button
                  key={grade}
                  id={`grade-filter-${grade.toLowerCase().replace(" ", "-")}`}
                  onClick={() => toggleGrade(grade)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    filters.grades.includes(grade)
                      ? "bg-remat-green text-white border-remat-green"
                      : "bg-white text-gray-600 border-gray-200 hover:border-remat-green hover:text-remat-green"
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Match Promo */}
          <div className="bg-gradient-to-br from-remat-green to-remat-green-dark rounded-card p-5 text-white">
            <p className="font-bold mb-1 text-sm">✨ ReMat Smart Match</p>
            <p className="text-xs text-white/80 mb-3">Biarkan AI menemukan material terbaik sesuai kebutuhan Anda.</p>
            <a href="/search" className="inline-block bg-white text-remat-green text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-remat-blue transition-colors">
              Coba Sekarang
            </a>
          </div>
        </aside>

        {/* Mobile overlay */}
        {showMobileFilter && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowMobileFilter(false)} />
        )}

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {/* Search Bar */}
            <div className="relative flex-[2] min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="catalog-search"
                type="search"
                placeholder="Cari material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-9 pr-4 h-10 text-sm bg-white"
              />
            </div>

            {/* Sort */}
            <div className="relative flex-1 min-w-36">
              <select
                id="sort-select"
                value={filters.sort}
                onChange={(e) => applyFilters({ ...filters, sort: e.target.value })}
                className="input-base pr-8 appearance-none bg-white"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Active filters pills */}
            {hasFilters && (
              <div className="flex flex-wrap gap-1.5">
                {filters.categories.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-xs bg-remat-green-light text-remat-green px-2 py-1 rounded-full font-medium">
                    {c} <button onClick={() => toggleCategory(c)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {filters.location && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                    📍 {filters.location} <button onClick={() => applyFilters({ ...filters, location: "" })}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
              <button id="grid-view-btn" onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-remat-green" : "text-gray-400 hover:text-gray-600"}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button id="list-view-btn" onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-remat-green" : "text-gray-400 hover:text-gray-600"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Material Grid / List */}
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-3"}>
              <CardGridSkeleton count={6} />
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-3"}>
              {filteredMaterials.map((m) => (
                <MaterialCard key={m.id} material={m} variant={viewMode} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="Material Tidak Ditemukan"
              description="Coba ubah filter pencarian atau gunakan AI Smart Search untuk menemukan material yang lebih spesifik."
              actionButton={
                <div className="flex gap-3">
                  <button onClick={clearFilters} className="btn-outline">Hapus Filter</button>
                  <a href="/search" className="btn-primary">Coba AI Search</a>
                </div>
              }
            />
          )}

          {/* Alert Fallback Box */}
          {filteredMaterials.length > 0 && (
            <div className="mt-8 border-2 border-dashed border-remat-green/30 rounded-card p-6 text-center">
              <Search className="w-8 h-8 text-remat-green/40 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-1.5">Tidak menemukan material spesifik?</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                Aktifkan alert dan kami akan memberitahu Anda saat material yang Anda cari tersedia.
              </p>
              <a href="/consumer/alerts" className="btn-outline">Buat Alert</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-remat-green border-t-transparent rounded-full animate-spin" /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}

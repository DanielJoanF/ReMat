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
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

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
      </div>

      {/* Filter Bar on Top */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-remat-green" /> Filter Pencarian
          </h2>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1">
              <X className="w-3 h-3" /> Hapus Semua Filter
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
          {/* Kategori */}
          <div className="relative">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kategori Material</span>
            <button
              id="category-dropdown-btn"
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="w-full flex items-center justify-between input-base h-10.5 font-medium border-gray-200 bg-white"
            >
              <span className="truncate text-sm text-gray-700">
                {filters.categories.length > 0
                  ? `${filters.categories.length} Terpilih`
                  : "Pilih Kategori"}
              </span>
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            </button>
            
            {isCategoryOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-1.5 max-h-56 overflow-y-auto z-20">
                  {categoriesList.map((cat) => (
                    <label key={cat} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="w-4 h-4 rounded border-gray-300 text-remat-green focus:ring-remat-green/20"
                      />
                      <span className="text-xs text-gray-700 group-hover:text-remat-green transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Lokasi */}
          <div>
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lokasi (Kota)</span>
            <select
              id="location-filter"
              value={filters.location}
              onChange={(e) => applyFilters({ ...filters, location: e.target.value })}
              className="input-base h-10.5 font-medium border-gray-200"
            >
              <option value="">Semua Kota</option>
              {locationsList.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Harga */}
          <div>
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Estimasi Harga</span>
            <div className="flex gap-2">
              <input
                id="min-price-filter"
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => applyFilters({ ...filters, minPrice: e.target.value })}
                className="input-base h-10.5 border-gray-200"
              />
              <input
                id="max-price-filter"
                type="number"
                placeholder="Maks"
                value={filters.maxPrice}
                onChange={(e) => applyFilters({ ...filters, maxPrice: e.target.value })}
                className="input-base h-10.5 border-gray-200"
              />
            </div>
          </div>

          {/* Grade */}
          <div>
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Grade Kualitas</span>
            <div className="flex flex-wrap gap-1.5">
              {GRADES.map((grade) => (
                <button
                  key={grade}
                  id={`grade-filter-${grade.toLowerCase().replace(" ", "-")}`}
                  onClick={() => toggleGrade(grade)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
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

          {/* Urutkan */}
          <div>
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Urutkan</span>
            <div className="relative">
              <select
                id="sort-select"
                value={filters.sort}
                onChange={(e) => applyFilters({ ...filters, sort: e.target.value })}
                className="input-base h-10.5 font-medium border-gray-200 appearance-none bg-white pr-8"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5" : "space-y-3"}>
            <CardGridSkeleton count={6} />
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5" : "space-y-3"}>
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

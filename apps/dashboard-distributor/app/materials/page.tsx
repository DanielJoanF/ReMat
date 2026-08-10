'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef, Suspense, ComponentType } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import {
  Plus,
  Search,
  Package,
  Layers,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  X,
  Send,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Scale,
  Truck,
  Droplet,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { getData, patchData, deleteData, RATE_LIMIT_EXCEEDED } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type MaterialStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

interface Material {
  id: string;
  title: string;
  description: string;
  qualityGrade: string | null;
  price: number;
  unit: string;
  quantity: number;
  location: string;
  status: MaterialStatus;
  category?: { id: string; name: string; slug?: string } | null;
  documents?: { id: string; type: string; fileUrl: string }[];
}

interface MaterialsResponse {
  data: Material[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Empty fallback (no mock data — always render from API) ─────────────
const EMPTY_MATERIALS: Material[] = [];

const CATEGORIES = ['Semua Kategori', 'Plastik', 'Kertas', 'Logam', 'Karet'];
const STATUSES = ['Semua Status', 'Aktif', 'Menunggu', 'Habis', 'Draft'];
const UNIT_TABS = [
  { value: 'KG', label: 'Kilogram' },
  { value: 'TON', label: 'Ton' },
  { value: 'LITER', label: 'Liter' },
] as const;

const PAGE_SIZE = 10;

function handleApiError(error: unknown, toast: ReturnType<typeof useToast>['toast'], fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message === RATE_LIMIT_EXCEEDED) {
    toast({ type: 'warning', message: 'Terlalu banyak permintaan. Silakan coba lagi.' });
  } else {
    toast({ type: 'error', message });
  }
}

// ─── Status Badge Component ──────────────────────────────────────────────────
function StatusPill({ status, stock }: { status: MaterialStatus; stock: number }) {
  if (stock === 0 || status === 'SUSPENDED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E5E7EB] text-[#4B5563]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
        Habis
      </span>
    );
  }
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D1FAE5] text-[#059669]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        Aktif
      </span>
    );
  }
  if (status === 'PENDING_REVIEW') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEE2E2] text-[#DC2626]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
        Menunggu
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEE2E2] text-[#DC2626]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
        Ditolak
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Draft
    </span>
  );
}

function MaterialsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const { toast } = useToast();
  const { isReady } = useAuth();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua Status');
  const [activeUnitTab, setActiveUnitTab] = useState<'KG' | 'TON' | 'LITER'>('KG');
  const [refreshKey, setRefreshKey] = useState(0);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; material: Material | null }>({
    open: false,
    material: null,
  });
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      const result = await getData<MaterialsResponse>('/materials/my', params);
      setMaterials(result.data ?? EMPTY_MATERIALS);
      setTotalItems(result.pagination?.total ?? 0);
      setTotalPages(result.pagination?.totalPages ?? 1);
    } catch (error: unknown) {
      setMaterials(EMPTY_MATERIALS);
      setTotalItems(0);
      setTotalPages(1);
      toastRef.current({
        type: 'error',
        message: error instanceof Error ? error.message : 'Gagal memuat data material',
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Wait until AuthProvider has written the user identity to localStorage,
    // so the API request carries the correct x-user-id / x-user-role headers.
    if (!isReady) return;
    fetchMaterials();
  }, [isReady, fetchMaterials]);

  // Debounce the search box: only fire the API request once the user
  // pauses typing (300ms), and always reset to page 1 on a new keyword.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchInput.trim() || '');
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // When the debounced keyword changes, restart from page 1 and reflect
  // the keyword in the URL (keeps header search + deep links in sync).
  useEffect(() => {
    if (debouncedSearch === (searchParams.get('search') || '')) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, searchParams, pathname, router]);

  // Sync local searchInput with URL search param (e.g. header search / back navigation).
  // NOTE: intentionally omit `searchInput` from deps to avoid an infinite loop:
  // typing → debounce → URL update → searchParams change → this effect → reset input → loop.
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchInput((prev) => (urlSearch !== prev ? urlSearch : prev));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleRefresh = () => { setRefreshKey((k) => k + 1); setPage(1); };

  const handleDelete = async () => {
      if (!deleteModal.material) return;
      const idToDelete = deleteModal.material.id;
      setDeleting(true);
      try {
        await deleteData(`/materials/${idToDelete}`);
        toastRef.current({ type: 'success', message: 'Material berhasil dihapus.' });
        // Remove the deleted row locally so it disappears without a full refetch.
        setMaterials((prev) => prev.filter((m) => m.id !== idToDelete));
        setDeleteModal({ open: false, material: null });
        handleRefresh();
      } catch (error: unknown) {
        handleApiError(error, toastRef.current, 'Gagal menghapus material');
      } finally {
        setDeleting(false);
      }
    };

  const handleSubmitMaterial = async (material: Material) => {
    try {
      await patchData(`/materials/${material.id}/submit`);
      toastRef.current({ type: 'success', message: 'Material berhasil disubmit untuk review.' });
      handleRefresh();
    } catch (error: unknown) {
      handleApiError(error, toastRef.current, 'Gagal submit material');
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((item) => {
    const categoryName = item.category?.name ?? '';
    if (selectedCategory !== 'Semua Kategori' && categoryName !== selectedCategory) {
      return false;
    }
    if (selectedStatusFilter === 'Aktif' && item.status !== 'ACTIVE') return false;
    if (selectedStatusFilter === 'Menunggu' && item.status !== 'PENDING_REVIEW') return false;
    if (selectedStatusFilter === 'Habis' && item.quantity !== 0 && item.status !== 'SUSPENDED') return false;
    if (selectedStatusFilter === 'Draft' && item.status !== 'DRAFT') return false;
    return true;
  });

  // ── Derived KPI values (from API data, never hardcoded) ──────────────
  const totalProducts = totalItems;
  const activeStockTon = materials
    .filter((m) => m.status === 'ACTIVE')
    .reduce((sum, m) => sum + m.quantity, 0) / 1000;
  const pendingCount = materials.filter((m) => m.status === 'PENDING_REVIEW').length;
  const soldCount = materials.filter((m) => m.quantity === 0 && m.status === 'ACTIVE').length;

  const kgMaterials = filteredMaterials.filter((item) => item.unit?.toUpperCase() === 'KG');
  const tonMaterials = filteredMaterials.filter((item) => item.unit?.toUpperCase() === 'TON');
  const literMaterials = filteredMaterials.filter((item) => item.unit?.toUpperCase() === 'LITER');

  const renderMaterialTable = (items: Material[], unitName: string, stockHeader: string, priceHeader: string) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              <th className="py-3 px-4 w-14">Foto</th>
              <th className="py-3 px-4">Nama Material</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4 text-center">{stockHeader}</th>
              <th className="py-3 px-4 text-right">{priceHeader}</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[13px]">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-2 px-4"><div className="w-9 h-9 bg-gray-100 rounded-md" /></td>
                  <td className="py-2 px-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                  <td className="py-2 px-4"><div className="h-4 w-16 bg-gray-100 rounded-sm" /></td>
                  <td className="py-2 px-4"><div className="h-4 w-10 bg-gray-100 rounded mx-auto" /></td>
                  <td className="py-2 px-4"><div className="h-4 w-16 bg-gray-100 rounded ml-auto" /></td>
                  <td className="py-2 px-4"><div className="h-5 w-16 bg-gray-100 rounded-full mx-auto" /></td>
                  <td className="py-2 px-4"><div className="h-5 w-12 bg-gray-100 rounded mx-auto" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-[13px]">
                  Tidak ada material dengan satuan {unitName}.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const photoUrl = item.documents?.find((d) => d.type === 'PHOTO')?.fileUrl;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Foto */}
                    <td className="py-3 px-4">
                      <div className="w-9 h-9 rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {photoUrl ? (
                          <img src={photoUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </td>

                    {/* Nama Material */}
                    <td className="py-3 px-4 font-semibold text-[#0B1C30]">
                      {item.title}
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-[#E8F1FF] text-[#3B82F6]">
                        {item.category?.name ?? '—'}
                      </span>
                    </td>

                    {/* Stok */}
                    <td className="py-3 px-4 text-center text-gray-600 tabular-nums">
                      {item.quantity.toLocaleString('id-ID')}
                    </td>

                    {/* Harga */}
                    <td className="py-3 px-4 text-right font-semibold text-gray-800 tabular-nums">
                      {formatCurrency(item.price)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <StatusPill status={item.status} stock={item.quantity} />
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => router.push(`/materials/${item.id}/edit`)}
                          className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, material: item })}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {item.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSubmitMaterial(item)}
                            className="p-1.5 rounded text-primary hover:bg-[#E8F5E9] transition-colors"
                            title="Submit"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Page Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-[20px] lg:text-[24px] font-bold text-[#0B1C30] leading-tight">Inventaris Material</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Kelola stok material daur ulang Anda.
            </p>
          </div>
          <Link href="/materials/create">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold text-white bg-primary hover:bg-[#2E7D32] shadow-sm transition-all active:scale-95">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Tambah Material
            </button>
          </Link>
        </div>

                {/* ── Top 4 KPI Cards (Bento Grid) ────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Produk */}
          <div className="bg-white rounded-lg shadow-card p-4 border border-gray-100 flex flex-col justify-between hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Layers className="w-4 h-4 text-gray-400" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">TOTAL PRODUK</span>
            </div>
            <p className="text-[24px] font-extrabold text-primary tabular-nums">{totalProducts}</p>
          </div>

          {/* Card 2: Stok Aktif */}
          <div className="bg-white rounded-lg shadow-card p-4 border border-gray-100 flex flex-col justify-between hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">STOK AKTIF (TON)</span>
            </div>
            <p className="text-[24px] font-extrabold text-primary tabular-nums">{activeStockTon.toLocaleString('id-ID')}</p>
          </div>

          {/* Card 3: Perlu Verifikasi (Highlighted Soft Red) */}
          <div className="bg-[#FDF2F2] rounded-lg shadow-card p-4 border border-red-100 flex flex-col justify-between hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-red-600">PERLU VERIFIKASI</span>
            </div>
            <p className="text-[24px] font-extrabold text-[#0B1C30] tabular-nums">{pendingCount}</p>
          </div>

          {/* Card 4: Terjual */}
          <div className="bg-white rounded-lg shadow-card p-4 border border-gray-100 flex flex-col justify-between hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">TERJUAL (BULAN INI)</span>
            </div>
            <p className="text-[24px] font-extrabold text-primary tabular-nums">{soldCount}</p>
          </div>
        </div>

        {/* ── Main Inventory Filter/Toolbar Card ────────────────── */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama material, ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-[13px] rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Bersihkan pencarian"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Unit Tabs (Segmented Control style) */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-full md:w-auto">
            {UNIT_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveUnitTab(tab.value)}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[12px] font-bold transition-all whitespace-nowrap ${
                  activeUnitTab === tab.value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dropdowns & Refresh */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-8 text-[13px] font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-8 text-[13px] font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Material Cards Grouped by Unit (Stack Grid of 1 Column) ── */}
        <div className="grid grid-cols-1 gap-6">
          {/* 1. Kilogram Card */}
          {activeUnitTab === 'KG' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" /> Material Satuan Kilogram (KG)
                </h2>
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {kgMaterials.length} Item
                </span>
              </div>
              {renderMaterialTable(kgMaterials, 'Kilogram (KG)', 'Stok (Kg)', 'Harga / Kg')}
            </div>
          )}

          {/* 2. Ton Card */}
          {activeUnitTab === 'TON' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> Material Satuan Ton (TON)
                </h2>
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {tonMaterials.length} Item
                </span>
              </div>
              {renderMaterialTable(tonMaterials, 'Ton (TON)', 'Stok (Ton)', 'Harga / Ton')}
            </div>
          )}

          {/* 3. Liter Card */}
          {activeUnitTab === 'LITER' && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-primary" /> Material Satuan Liter (LITER)
                </h2>
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {literMaterials.length} Item
                </span>
              </div>
              {renderMaterialTable(literMaterials, 'Liter (LITER)', 'Stok (Liter)', 'Harga / Liter')}
            </div>
          )}
        </div>

        {/* ── Pagination Section Card ─────────────────────────── */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-500">
          <div>
            Menampilkan <span className="font-semibold text-gray-700">1 - {filteredMaterials.length}</span> dari <span className="font-semibold text-gray-700">{totalItems}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded flex items-center justify-center border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = pageNum === page;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded font-bold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 rounded flex items-center justify-center border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, material: null })}
          title="Hapus Material"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus{' '}
              <strong>{deleteModal.material?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, material: null })}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                disabled={deleting}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                disabled={deleting}
              >
                Hapus
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={null}>
      <MaterialsPageInner />
    </Suspense>
  );
}

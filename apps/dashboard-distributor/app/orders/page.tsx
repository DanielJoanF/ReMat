'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Truck,
  Clock,
  ShoppingBag,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';

import { getData, patchData, RATE_LIMIT_EXCEEDED } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/ui/status-badge';

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

interface OrderMaterial {
  id: string;
  title: string;
  unit?: string;
}

interface OrderItem {
  id: string;
  material: OrderMaterial;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

interface OrderConsumer {
  id?: string;
  companyName?: string;
  email?: string;
  user?: { name: string };
}

interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  trackingNumber?: string;
  totalAmount: number;
  consumer?: OrderConsumer | null;
}

interface OrdersResponse {
  data: Order[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Empty fallback (no mock data — always render from API) ─────────────
const EMPTY_ORDERS: Order[] = [];

const STATUS_TABS = [
  { value: 'SEMUA', label: 'Semua' },
  { value: 'PENDING', label: 'Dibuat' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

const PAGE_SIZE = 10;

function handleApiError(error: unknown, toast: ReturnType<typeof useToast>['toast'], fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message === RATE_LIMIT_EXCEEDED) {
    toast({ type: 'warning', message: 'Terlalu banyak permintaan. Silakan coba lagi.' });
  } else {
    toast({ type: 'error', message });
  }
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersPageInner />
    </Suspense>
  );
}

function OrdersPageInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const initialSearch = searchParams.get('search') || '';
  const { toast } = useToast();
  const { isReady } = useAuth();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState('SEMUA');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State for Action
  const [actionModal, setActionModal] = useState<{ open: boolean; type: 'CONFIRM' | 'SHIP'; order: Order | null }>({
    open: false,
    type: 'CONFIRM',
    order: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (activeTab !== 'SEMUA') params.status = activeTab;

      const result = await getData<OrdersResponse>('/transactions/orders', params);
      setOrders(result.data ?? EMPTY_ORDERS);
      setTotalItems(result.pagination?.total ?? 0);
      setTotalPages(result.pagination?.totalPages ?? 1);
    } catch (error: unknown) {
      setOrders(EMPTY_ORDERS);
      setTotalItems(0);
      setTotalPages(1);
      toastRef.current({
        type: 'error',
        message: error instanceof Error ? error.message : 'Gagal memuat pesanan',
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeTab, refreshKey]);

  useEffect(() => {
    // Wait until AuthProvider has written the user identity to sessionStorage,
    // so the API request carries the correct x-user-id / x-user-role headers.
    if (!isReady) return;
    fetchOrders();
  }, [isReady, fetchOrders]);

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

  const handleAction = async () => {
    if (!actionModal.order) return;
    setActionLoading(true);
    try {
      // Order IDs from the API may be prefixed with '#' (e.g. '#ORD-abc'); strip it
      // so the URL path resolves to /transactions/:id/confirm|ship.
      const orderId = encodeURIComponent(actionModal.order.id.replace(/^#/, ''));
      const endpoint = actionModal.type === 'CONFIRM' ? `/transactions/${orderId}/confirm` : `/transactions/${orderId}/ship`;
      await patchData(endpoint);
      toastRef.current({ type: 'success', message: `Pesanan berhasil ${actionModal.type === 'CONFIRM' ? 'dikonfirmasi' : 'diupdate'}.` });
      setActionModal({ open: false, type: 'CONFIRM', order: null });
      handleRefresh();
    } catch (error: unknown) {
      handleApiError(error, toastRef.current, 'Gagal memproses pesanan');
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side filter: status tabs are applied here; search is handled
  // server-side via ?search= (debounced in this component), so the two
  // compose instead of overriding each other.
  const filteredOrders = orders.filter((order) => {
    if (activeTab !== 'SEMUA') {
      return order.status === activeTab;
    }
    return true;
  });
  // ── Derived KPI values (from API data, never hardcoded) ──────────────
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED').length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-5">
        {/* ── Page Header ───────────────────────────────────────── */}
        {/* ── Top KPI Cards (Bento Grid) ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#F0FDF4] rounded-lg shadow-card p-4 border border-green-100 flex items-center justify-between hover:shadow-card-hover transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-green-700">PESANAN BARU</span>
              </div>
              <p className="text-[24px] font-extrabold text-[#0B1C30] tabular-nums">{pendingOrders}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-card p-4 border border-gray-100 flex items-center justify-between hover:shadow-card-hover transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">SELESAI (BULAN INI)</span>
              </div>
              <p className="text-[24px] font-extrabold text-[#0B1C30] tabular-nums">{completedOrders}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* ── Filter Tabs ───────────────────────────────────────── */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200">
          <div className="flex gap-2 pb-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Orders Table ──────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari Order ID, Pembeli..."
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
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4 w-32">Order ID</th>
                  <th className="py-3 px-4">Pembeli</th>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4 text-center">Jumlah</th>
                  <th className="py-3 px-4 text-right">Total Harga</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-2 px-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                      <td className="py-2 px-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                      <td className="py-2 px-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                      <td className="py-2 px-4"><div className="h-4 w-12 bg-gray-100 rounded mx-auto" /></td>
                      <td className="py-2 px-4"><div className="h-4 w-20 bg-gray-100 rounded ml-auto" /></td>
                      <td className="py-2 px-4"><div className="h-5 w-16 bg-gray-100 rounded-full mx-auto" /></td>
                      <td className="py-2 px-4"><div className="h-6 w-24 bg-gray-100 rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-[13px]">
                      {debouncedSearch
                        ? `Tidak ada pesanan yang cocok dengan pencarian "${debouncedSearch}".`
                        : 'Tidak ada pesanan ditemukan.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const firstItem = order.items?.[0];
                    const materialName = firstItem?.material?.title || '-';
                    const additionalItems = (order.items?.length ?? 1) - 1;
                    const qty = firstItem?.quantity ?? 0;
                    const unit = firstItem?.material?.unit || firstItem?.unit || 'kg';
                    const displayQty = `${qty.toLocaleString('id-ID')} ${unit}`;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#0B1C30] tabular-nums">
                          {order.id.startsWith('#') ? order.id : `#ORD-${order.id.slice(0,4)}`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#0B1C30] whitespace-nowrap">{order.consumer?.user?.name || order.consumer?.companyName || 'Konsumen Umum'}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{formatDate(order.createdAt).replace('2023', '23').split(' ').slice(0, 3).join(' ')}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium whitespace-nowrap">
                          {materialName}
                          {additionalItems > 0 && <span className="text-gray-400"> +{additionalItems} lainnya</span>}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700 tabular-nums">
                          {displayQty}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#0B1C30] tabular-nums">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link href={`/orders/${order.id.replace(/^#/, '')}`} className="px-2.5 py-1.5 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 text-[11px] font-semibold transition-colors">
                              Detail
                            </Link>
                            {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                              <button
                                onClick={() => setActionModal({ open: true, type: 'CONFIRM', order })}
                                className="px-2.5 py-1.5 rounded bg-primary text-white text-[11px] font-semibold hover:bg-[#2E7D32] transition-colors"
                              >
                                Konfirmasi
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

          {/* Table Footer & Pagination */}
          <div className="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-500">
            <div>
              Menampilkan <span className="font-semibold text-gray-700">1 - {filteredOrders.length}</span> dari <span className="font-semibold text-gray-700">{totalItems}</span> pesanan
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded flex items-center justify-center border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded flex items-center justify-center border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Modal */}
        <Modal
          isOpen={actionModal.open}
          onClose={() => setActionModal({ open: false, type: 'CONFIRM', order: null })}
          title={actionModal.type === 'CONFIRM' ? 'Konfirmasi Pesanan' : 'Update Resi'}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-[13px] text-gray-600">
              {actionModal.type === 'CONFIRM'
                ? `Apakah Anda yakin ingin menerima pesanan ${actionModal.order?.id}?`
                : `Lanjutkan untuk memproses pengiriman pesanan ${actionModal.order?.id}?`
              }
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal({ open: false, type: 'CONFIRM', order: null })}
                className="px-4 py-2 rounded-md border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
                disabled={actionLoading}
              >
                Batal
              </button>
              <button
                onClick={handleAction}
                className="px-4 py-2 rounded-md bg-primary text-white text-[13px] font-semibold hover:bg-primary-600"
                disabled={actionLoading}
              >
                {actionModal.type === 'CONFIRM' ? 'Konfirmasi' : 'Update'}
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
}
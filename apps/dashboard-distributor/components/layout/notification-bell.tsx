'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, BellOff, ShoppingCart, Package, Check, AlertTriangle, Wallet, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { getData, patchData, RATE_LIMIT_EXCEEDED } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

// Preferensi yang diatur di /settings (localStorage remat_notif_*) — sinkron dgn bell
// Email children tunduk pada master `remat_notif_email`; push pakai kunci sendiri.
function isTypeEnabled(type: string): boolean {
  if (typeof window === 'undefined') return true;
  const master = localStorage.getItem('remat_notif_email');
  const pushOrder = localStorage.getItem('remat_notif_push_order');
  const pushStock = localStorage.getItem('remat_notif_push_stock');
  switch (type) {
    case 'order_new':
    case 'order_status':
      // Tampil bila push order ON ATAU email order ON (master email ON)
      return (pushOrder !== 'false') || (master !== 'false' && localStorage.getItem('remat_notif_email_order') !== 'false');
    case 'payment_received':
      return master !== 'false' && localStorage.getItem('remat_notif_email_payment') !== 'false';
    case 'stock_low':
      return (pushStock !== 'false') || (master !== 'false' && localStorage.getItem('remat_notif_email_stock') !== 'false');
    case 'material_verification':
      return master !== 'false' && localStorage.getItem('remat_notif_email_market') !== 'false';
    default:
      return true;
  }
}

const NOTIF_ICONS: Record<string, { icon: typeof ShoppingCart; bg: string; color: string }> = {
  order_new: { icon: ShoppingCart, bg: 'bg-blue-50', color: 'text-blue-600' },
  order_status: { icon: Package, bg: 'bg-indigo-50', color: 'text-indigo-600' },
  payment_received: { icon: Check, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  stock_low: { icon: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
  material_verification: { icon: ShieldAlert, bg: 'bg-purple-50', color: 'text-purple-600' },
};

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Baru saja';
  if (min < 60) return `${min} menit lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Kemarin';
  if (d < 7) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function NotificationBell() {
  const { toast } = useToast();
  const { isReady } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFetch = useRef(true);

  const fetchAll = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const [notifRes, unreadRes] = await Promise.all([
        getData<{ data: NotificationItem[] }>(`/notifications/my?limit=8`),
        getData<{ data: { count: number } }>('/notifications/unread-count'),
      ]);
      // Simpan data MENTAH — filter preferensi dilakukan saat render (live sync dgn /settings)
      setItems(notifRes.data ?? []);
      setUnread(Math.max(0, unreadRes.data?.count ?? 0));
    } catch {
      // Bell tidak boleh memblok halaman — diam pada kegagalan, kosongkan state
      if (firstFetch.current) {
        setItems([]);
        setUnread(0);
      }
    } finally {
      setLoading(false);
      firstFetch.current = false;
    }
  }, [isReady]);

  // Initial load + poll setiap 30 detik
  useEffect(() => {
    if (!isReady) return;
    fetchAll();
    const timer = setInterval(fetchAll, 30000);
    return () => clearInterval(timer);
  }, [isReady, fetchAll]);

  // Tutup panel saat klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (ev: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await patchData('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
      toast({ type: 'success', message: 'Semua notifikasi ditandai sudah dibaca.' });
    } catch {
      toast({ type: 'error', message: 'Gagal menandai notifikasi.' });
    } finally {
      setMarking(false);
    }
  };

  const handleMark = async (n: NotificationItem) => {
    if (!n.isRead) {
      setUnread((prev) => Math.max(0, prev - 1));
      try {
        await patchData(`/notifications/${n.id}/read`);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      } catch {
        // non-fatal
      }
    }
    setOpen(false);
  };

  // Filter preferensi dilakukan di render agar sinkron dgn localStorage /settings
  const visibleItems = items.filter((n) => isTypeEnabled(n.type));
  const visibleUnread = visibleItems.filter((n) => !n.isRead).length;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) fetchAll(); }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#475569] transition hover:bg-slate-100"
        aria-label="Notifikasi"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {visibleUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {visibleUnread > 99 ? '99+' : visibleUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifikasi</p>
            {visibleUnread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={marking}
                className="flex items-center gap-1 text-xs font-semibold text-[#065F46] hover:underline disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading && visibleItems.length === 0 ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-1.5"><div className="h-3 w-3/4 bg-slate-100 rounded" /><div className="h-2.5 w-1/2 bg-slate-100 rounded" /></div>
                  </div>
                ))}
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <BellOff className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">Belum ada notifikasi</p>
                <p className="mt-1 text-xs text-slate-400">Notifikasi baru akan muncul di sini.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {visibleItems.slice(0, 8).map((n) => {
                  const icon = NOTIF_ICONS[n.type] || NOTIF_ICONS.order_new;
                  const Icon = icon.icon;
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.link || '/orders'}
                        onClick={() => handleMark(n)}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50',
                          !n.isRead && 'bg-[#F0FDF4]'
                        )}
                      >
                        <span className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', icon.bg, icon.color)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] font-semibold text-slate-900">{n.title}</span>
                            {!n.isRead && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#10B981]" />}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500 line-clamp-2">{n.message}</span>
                          <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 p-2">
            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-xs font-semibold text-[#065F46] hover:bg-slate-50"
            >
              Lihat semua notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
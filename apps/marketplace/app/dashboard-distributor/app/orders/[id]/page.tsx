'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Package, User, CreditCard, Truck, Check, Clock, Ban, AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SkeletonText } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { getData, patchData, RATE_LIMIT_EXCEEDED } from '@/lib/api-client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
interface Material { id: string; name: string; category?: string }
interface Buyer { id: string; name: string; email?: string; phone?: string; company?: string; address?: string }
interface OrderItem { id: string; material: Material; quantity: number; unit: string; unitPrice: number; totalPrice: number }
interface OrderDetail {
  id: string; items: OrderItem[]; status: OrderStatus; createdAt: string; updatedAt: string;
  trackingNumber?: string; totalAmount: number; buyer?: Buyer; buyerId?: string; notes?: string;
}

const TIMELINE_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PENDING', label: 'Dibuat' }, { key: 'CONFIRMED', label: 'Dikonfirmasi' },
  { key: 'PAID', label: 'Dibayar' }, { key: 'SHIPPED', label: 'Dikirim' }, { key: 'COMPLETED', label: 'Selesai' },
];
const STATUS_CFG: Record<OrderStatus, { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  PENDING: { label: 'Menunggu', variant: 'warning' }, CONFIRMED: { label: 'Dikonfirmasi', variant: 'primary' },
  PAID: { label: 'Dibayar', variant: 'info' }, SHIPPED: { label: 'Dikirim', variant: 'secondary' },
  COMPLETED: { label: 'Selesai', variant: 'success' }, CANCELLED: { label: 'Dibatalkan', variant: 'danger' },
};
const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'COMPLETED'] as const;

function handleApiError(error: unknown, toast: ReturnType<typeof useToast>['toast'], fb: string) {
  const msg = error instanceof Error ? error.message : fb;
  if (msg === RATE_LIMIT_EXCEEDED) toast({ type: 'warning', message: 'Terlalu banyak permintaan. Silakan coba lagi.' });
  else toast({ type: 'error', message: msg });
}

function StatusTimeline({ current }: { current: OrderStatus }) {
  const idx = STATUS_ORDER.indexOf(current as typeof STATUS_ORDER[number]);
  const cancelled = current === 'CANCELLED';
  const pct = cancelled ? '0%' : `${(idx / (STATUS_ORDER.length - 1)) * 100}%`;
  const cls = (i: number, key: OrderStatus) => {
    const active = i <= idx && !cancelled, cur = key === current;
    return cur ? 'border-[#1B5E20] bg-[#E8F5E9]0 text-white scale-110 shadow-lg'
      : active ? 'border-[#1B5E20] bg-[#C8E6C9] text-[#1B5E20]' : 'border-gray-300 bg-white text-gray-400';
  };
  const txtCls = (i: number, key: OrderStatus) => {
    const active = i <= idx && !cancelled, cur = key === current;
    return cur ? 'text-[#1B5E20] font-semibold' : active ? 'text-gray-700' : 'text-gray-400';
  };

  return (
    <div className="w-full">
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        <div className="absolute top-5 left-0 h-0.5 bg-[#E8F5E9]0 transition-all duration-500" style={{ width: pct }} />
        {TIMELINE_STEPS.map((s, i) => (
          <div key={s.key} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${cls(i, s.key)}`}>
              {(i <= idx && !cancelled) ? <Check className="w-5 h-5" /> : <span className="text-xs font-semibold">{i + 1}</span>}
            </div>
            <span className={`mt-2 text-xs font-medium text-center ${txtCls(i, s.key)}`}>{s.label}</span>
          </div>
        ))}
      </div>
      {cancelled && (
        <div className="mt-4 flex items-center gap-2 justify-center">
          <Ban className="w-5 h-5 text-red-500" /><span className="text-sm font-medium text-red-600">Pesanan Dibatalkan</span>
        </div>
      )}
      <div className="sm:hidden mt-4 space-y-3">
        {TIMELINE_STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${cls(i, s.key)}`}>
              {(i <= idx && !cancelled) ? <Check className="w-4 h-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
            </div>
            <span className={`text-sm ${txtCls(i, s.key)}`}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingError, setTrackingError] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true); setError(null);
    try { setOrder(await getData<OrderDetail>(`/transactions/${orderId}`)); }
    catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat detail pesanan';
      if (msg === RATE_LIMIT_EXCEEDED) toast({ type: 'warning', message: 'Terlalu banyak permintaan.' });
      else { setError(msg); toast({ type: 'error', message: msg }); }
    } finally { setLoading(false); }
  }, [orderId, toast]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleConfirm = async () => {
    if (!order) return; setActionLoading(true);
    try { await patchData(`/transactions/${order.id}/confirm`); toast({ type: 'success', message: 'Pesanan berhasil dikonfirmasi.' }); fetchOrder(); }
    catch (e: unknown) { handleApiError(e, toast, 'Gagal mengkonfirmasi pesanan'); }
    finally { setActionLoading(false); }
  };
  const handleShip = async () => {
    if (!order) return;
    if (!trackingNumber.trim()) { setTrackingError('Nomor resi wajib diisi'); return; }
    setActionLoading(true);
    try {
      await patchData(`/transactions/${order.id}/ship`, { trackingNumber: trackingNumber.trim() });
      toast({ type: 'success', message: 'Pesanan berhasil dikirim.' });
      setShipOpen(false); setTrackingNumber(''); fetchOrder();
    } catch (e: unknown) { handleApiError(e, toast, 'Gagal mengirim pesanan'); }
    finally { setActionLoading(false); }
  };
  const handleCancel = async () => {
    if (!order) return; setActionLoading(true);
    try { await patchData(`/transactions/${order.id}/cancel`); toast({ type: 'success', message: 'Pesanan berhasil dibatalkan.' }); setCancelOpen(false); fetchOrder(); }
    catch (e: unknown) { handleApiError(e, toast, 'Gagal membatalkan pesanan'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-2"><div className="h-6 w-48 bg-gray-200 rounded animate-pulse" /><div className="h-4 w-64 bg-gray-200 rounded animate-pulse" /></div>
        </div>
        <Card><SkeletonText lines={8} /></Card>
        <Card><SkeletonText lines={6} /></Card>
      </div>
    </DashboardLayout>
  );

  if (error || !order) return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" /> Kembali ke Pesanan</Link>
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{error || 'Pesanan tidak ditemukan'}</h3>
            <p className="text-sm text-gray-500 mt-1">Pastikan ID pesanan valid atau coba lagi nanti.</p>
            <Button variant="primary" className="mt-4" onClick={fetchOrder}>Coba Lagi</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );

  const cfg = STATUS_CFG[order.status];
  const subtotal = order.items.reduce((s, i) => s + i.totalPrice, 0);

  const Actions = () => {
    switch (order.status) {
      case 'PENDING': return (
        <div className="flex items-center gap-3">
          <Button variant="success" onClick={handleConfirm} loading={actionLoading}><Check className="w-4 h-4" /> Konfirmasi Pesanan</Button>
          <Button variant="danger" onClick={() => setCancelOpen(true)} disabled={actionLoading}><Ban className="w-4 h-4" /> Batalkan</Button>
        </div>
      );
      case 'CONFIRMED': return <div className="flex items-center gap-2 text-gray-500"><Clock className="w-5 h-5" /><span className="text-sm font-medium">Menunggu Pembayaran</span></div>;
      case 'PAID': return <Button variant="info" onClick={() => setShipOpen(true)} loading={actionLoading}><Truck className="w-4 h-4" /> Kirim Pesanan</Button>;
      case 'SHIPPED': return <div className="flex items-center gap-2 text-gray-500"><Truck className="w-5 h-5" /><span className="text-sm font-medium">Dalam Perjalanan</span></div>;
      case 'COMPLETED': return <div className="flex items-center gap-2 text-green-600"><Check className="w-5 h-5" /><span className="text-sm font-semibold">Pesanan Selesai</span></div>;
      case 'CANCELLED': return <div className="flex items-center gap-2 text-red-500"><Ban className="w-5 h-5" /><span className="text-sm font-medium">Pesanan Dibatalkan</span></div>;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-4">
          <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Pesanan
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#C8E6C9] flex items-center justify-center">
                <Package className="w-6 h-6 text-[#1B5E20]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detail Pesanan</h1>
                <p className="text-sm text-gray-500">ID: {order.id}</p>
              </div>
            </div>
            <Badge variant={cfg.variant} className="text-sm px-4 py-1.5">{cfg.label}</Badge>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Status Pesanan</CardTitle></CardHeader>
          <CardContent><StatusTimeline current={order.status} /></CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Aksi</p>
              <Actions />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Detail Material</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{i + 1}. {item.material.name}</p>
                      {item.material.category && <p className="text-xs text-gray-500 mt-0.5">{item.material.category}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-700">{item.quantity.toLocaleString('id-ID')} {item.unit} × {formatCurrency(item.unitPrice)}</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {order.buyer && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-[#2E7D32]" /> Informasi Pembeli</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div><p className="text-xs text-gray-500">Nama</p><p className="text-sm font-medium text-gray-900">{order.buyer.name}</p></div>
                    {order.buyer.company && <div><p className="text-xs text-gray-500">Perusahaan</p><p className="text-sm font-medium text-gray-900">{order.buyer.company}</p></div>}
                    {order.buyer.email && <div><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-700">{order.buyer.email}</p></div>}
                    {order.buyer.phone && <div><p className="text-xs text-gray-500">Telepon</p><p className="text-sm text-gray-700">{order.buyer.phone}</p></div>}
                    {order.buyer.address && <div><p className="text-xs text-gray-500">Alamat</p><p className="text-sm text-gray-700">{order.buyer.address}</p></div>}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#2E7D32]" /> Ringkasan Harga</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.material.name}</span>
                      <span className="text-gray-900">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-[#1B5E20]">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.trackingNumber && (
              <Card>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-[#2E7D32]" />
                    <div><p className="text-xs text-gray-500">Nomor Resi</p><p className="text-sm font-mono font-medium text-gray-900">{order.trackingNumber}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Dibuat</span><span className="text-gray-700">{formatDateTime(order.createdAt)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Diperbarui</span><span className="text-gray-700">{formatDateTime(order.updatedAt)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={shipOpen} onClose={() => setShipOpen(false)} title="Kirim Pesanan" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Masukkan nomor resi pengiriman untuk pesanan ini.</p>
          <Input label="Nomor Resi" required placeholder="Contoh: JNE123456789" value={trackingNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTrackingNumber(e.target.value); if (trackingError) setTrackingError(''); }}
            error={trackingError} />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShipOpen(false)} disabled={actionLoading}>Batal</Button>
            <Button variant="primary" onClick={handleShip} loading={actionLoading}>Kirim</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Batalkan Pesanan" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Apakah Anda yakin ingin membatalkan pesanan ini?</p>
              <p className="text-sm text-gray-500 mt-1">Tindakan ini tidak dapat dibatalkan. Pesanan akan ditandai sebagai &quot;Dibatalkan&quot;.</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={actionLoading}>Tidak, Kembali</Button>
            <Button variant="danger" onClick={handleCancel} loading={actionLoading}>Ya, Batalkan</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

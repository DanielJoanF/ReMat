'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Leaf, Plus, Eye, BarChart3, FileText, Recycle, Award, DollarSign,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { getData, postData, RATE_LIMIT_EXCEEDED } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';

interface CircularReport {
  id: string; period: string; circularScore: number;
  wasteDiversionRate: number; carbonSaving?: number; carbonSavingKg?: number; economicValue: number; createdAt: string;
}
interface ReportDetail extends CircularReport {
  description?: string; materials?: { name: string; diverted: number; unit: string }[];
}
interface ReportsResponse { data: CircularReport[]; total: number }

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTH_OPTS = MONTHS.map((l, i) => ({ value: String(i + 1).padStart(2, '0'), label: l }));
const CUR_YEAR = new Date().getFullYear();
const YEAR_OPTS = Array.from({ length: 5 }, (_, i) => ({ value: String(CUR_YEAR - i), label: String(CUR_YEAR - i) }));

function handleApiError(error: unknown, toast: ReturnType<typeof useToast>['toast'], fb: string) {
  const msg = error instanceof Error ? error.message : fb;
  toast({ type: msg === RATE_LIMIT_EXCEEDED ? 'warning' : 'error', message: msg === RATE_LIMIT_EXCEEDED ? 'Terlalu banyak permintaan. Silakan coba lagi.' : msg });
}

function fmtPeriod(p: string) {
  const [y, m] = p.split('-');
  return `${MONTHS[parseInt(m, 10) - 1] ?? m} ${y}`;
}

function latestKPIs(r: CircularReport[]) {
  if (!r?.length) return { wdr: 0, cs: 0, score: 0, ev: 0 };
  const l = r.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
  return {
    wdr: l.wasteDiversionRate ?? 0,
    cs: l.carbonSaving ?? l.carbonSavingKg ?? 0,
    score: l.circularScore ?? 0,
    ev: l.economicValue ?? 0,
  };
}

function KPICard({ icon, label, value, unit, color, loading }: {
  icon: React.ReactNode; label: string; value: string; unit: string; color: string; loading: boolean;
}) {
  if (loading) return <SkeletonCard />;
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900">{value}</span>
              {unit && <span className="text-sm text-gray-500">{unit}</span>}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CircularReportPage() {
  const { toast } = useToast();
  const { isReady } = useAuth();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const [reports, setReports] = useState<CircularReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [genOpen, setGenOpen] = useState(false);
  const [selMonth, setSelMonth] = useState('');
  const [selYear, setSelYear] = useState(String(CUR_YEAR));
  const [generating, setGenerating] = useState(false);
  const [detOpen, setDetOpen] = useState(false);
  const [detId, setDetId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getData<ReportsResponse>('/circular-reports/my');
      setReports(res.data ?? []);
    } catch (e: unknown) { handleApiError(e, toastRef.current, 'Gagal memuat laporan sirkular'); }
    finally { setLoading(false); }
  }, []); // toast stabilized via ref

  useEffect(() => {
    // Wait until AuthProvider has written the user identity to localStorage,
    // so the API request carries the correct x-user-id / x-user-role headers.
    if (!isReady) return;
    fetchReports();
  }, [isReady, fetchReports]);

  const handleGenerate = async () => {
    if (!selMonth) { toastRef.current({ type: 'error', message: 'Pilih bulan terlebih dahulu.' }); return; }
    setGenerating(true);
    try {
      await postData('/circular-reports/generate', { period: `${selYear}-${selMonth}` });
      toastRef.current({ type: 'success', message: `Laporan untuk ${fmtPeriod(`${selYear}-${selMonth}`)} berhasil dibuat.` });
      setGenOpen(false); setSelMonth(''); fetchReports();
    } catch (e: unknown) { handleApiError(e, toastRef.current, 'Gagal membuat laporan'); }
    finally { setGenerating(false); }
  };

  const kpis = latestKPIs(reports);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Leaf className="w-6 h-6 text-[#2E7D32]" /> Laporan Ekonomi Sirkular
            </h1>
            <p className="text-sm text-gray-500 mt-1">Pantau dampak ekonomi sirkular dari aktivitas daur ulang material.</p>
          </div>
          <Button variant="primary" onClick={() => setGenOpen(true)}>
            <Plus className="w-4 h-4" /> Generate Laporan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={<Recycle className="w-6 h-6 text-[#1B5E20]" />} label="Waste Diversion Rate" value={`${(kpis.wdr ?? 0).toFixed(1)}%`} unit="" color="#10B981" loading={loading} />
          <KPICard icon={<Leaf className="w-6 h-6 text-blue-600" />} label="Carbon Saving" value={(kpis.cs ?? 0).toLocaleString('id-ID')} unit="kg CO2" color="#3B82F6" loading={loading} />
          <KPICard icon={<Award className="w-6 h-6 text-amber-600" />} label="Circular Score" value={String(kpis.score ?? 0)} unit="/100" color="#F59E0B" loading={loading} />
          <KPICard icon={<DollarSign className="w-6 h-6 text-purple-600" />} label="Nilai Ekonomi" value={formatCurrency(kpis.ev ?? 0)} unit="" color="#A855F7" loading={loading} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2E7D32]" /> Daftar Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="w-12 h-12" />}
                title="Belum ada laporan"
                description="Generate laporan sirkular pertama Anda untuk melihat data dampak daur ulang."
                action={{ label: 'Generate Laporan', onClick: () => setGenOpen(true) }}
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-4 hover:bg-gray-50 transition-colors -mx-6 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#C8E6C9] flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-[#1B5E20]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fmtPeriod(r.period)}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            Skor: <span className="font-semibold text-[#1B5E20]">{r.circularScore}</span>
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => { setDetId(r.id); setDetOpen(true); }}>
                      <Eye className="w-4 h-4" /> Lihat Detail
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={genOpen} onClose={() => setGenOpen(false)} title="Generate Laporan Sirkular" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Pilih periode laporan yang ingin di-generate.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
              <select required value={selMonth} onChange={(e) => setSelMonth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20]">
                <option value="">Pilih bulan</option>
                {MONTH_OPTS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <select required value={selYear} onChange={(e) => setSelYear(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20]">
                {YEAR_OPTS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setGenOpen(false)} disabled={generating}>Batal</Button>
            <Button variant="primary" onClick={handleGenerate} loading={generating}>Generate</Button>
          </div>
        </div>
      </Modal>

      <ReportDetailModal isOpen={detOpen} onClose={() => { setDetOpen(false); setDetId(null); }} reportId={detId} />
    </DashboardLayout>
  );
}

function ReportDetailModal({ isOpen, onClose, reportId }: {
  isOpen: boolean; onClose: () => void; reportId: string | null;
}) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !reportId) { setDetail(null); return; }
    setLoading(true);
    getData<ReportDetail>(`/circular-reports/${reportId}`)
      .then(setDetail)
      .catch((e: unknown) => handleApiError(e, toast, 'Gagal memuat detail laporan'))
      .finally(() => setLoading(false));
  }, [isOpen, reportId, toast]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Laporan Sirkular" size="lg">
      {loading ? (
        <div className="space-y-4 py-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />)}
        </div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Periode</p>
              <p className="text-lg font-semibold text-gray-900">{fmtPeriod(detail.period)}</p>
            </div>
            <Badge variant="info" className="text-sm px-4 py-1.5">Skor: {detail.circularScore}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#E8F5E9] rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Waste Diversion Rate</p>
              <p className="text-xl font-bold text-[#1B5E20] mt-1">{detail.wasteDiversionRate}%</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Carbon Saving</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{(detail.carbonSaving ?? detail.carbonSavingKg ?? 0).toLocaleString('id-ID')} kg CO2</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Nilai Ekonomi</p>
              <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(detail.economicValue)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Skor Sirkular</p>
              <p className="text-xl font-bold text-purple-700 mt-1">{detail.circularScore}/100</p>
            </div>
          </div>
          {detail.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Deskripsi</p>
              <p className="text-sm text-gray-600">{detail.description}</p>
            </div>
          )}
          {detail.materials && detail.materials.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Material Didaur Ulang</p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {detail.materials.map((mat, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-700">{mat.name}</span>
                    <span className="text-sm font-medium text-gray-900">{mat.diverted.toLocaleString('id-ID')} {mat.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">Dibuat: {formatDate(detail.createdAt)}</div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-8">Data tidak tersedia.</p>
      )}
    </Modal>
  );
}

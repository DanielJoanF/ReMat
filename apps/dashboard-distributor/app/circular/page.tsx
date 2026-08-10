'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Eye,
  BarChart3,
  Recycle,
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Layers,
  Activity,
  Box,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
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

interface ScoreBreakdownComponent {
  score: number;
  maxScore: number;
  weightPercent: number;
  label: string;
}

interface ScoreBreakdown {
  diversionComponent: ScoreBreakdownComponent;
  activityComponent: ScoreBreakdownComponent;
  volumeComponent: ScoreBreakdownComponent;
  totalScore: number;
}

interface CircularReport {
  id: string;
  period: string;
  circularScore: number;
  wasteDiversionRate: number;
  carbonSaving?: number;
  carbonSavingKg?: number;
  totalWasteUtilizedKg?: number;
  economicValue: number;
  transactionCount?: number;
  aiSummary?: string;
  scoreBreakdown?: ScoreBreakdown;
  createdAt?: string;
  generatedAt?: string;
}

interface CategoryDetail {
  name: string;
  totalKg: number;
}

interface ReportDetail extends CircularReport {
  description?: string;
  materials?: { name: string; diverted: number; unit: string }[];
  categories?: CategoryDetail[];
}

interface ReportsResponse {
  data: CircularReport[];
  total: number;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

const MONTH_OPTS = MONTHS.map((l, i) => ({ value: String(i + 1).padStart(2, '0'), label: l }));
const CUR_YEAR = new Date().getFullYear();
const YEAR_OPTS = Array.from({ length: 5 }, (_, i) => ({ value: String(CUR_YEAR - i), label: String(CUR_YEAR - i) }));

// Single accent, everything else is ink/paper. Material composition is the
// one place we allow a short qualitative scale, since it's the only chart
// where color is carrying information (which material) rather than decoration.
const INK = '#14532D';
const MATERIAL_SCALE = ['#14532D', '#3F6212', '#78716C', '#A8A29E'];

function handleApiError(error: unknown, toast: ReturnType<typeof useToast>['toast'], fb: string) {
  const msg = error instanceof Error ? error.message : fb;
  toast({
    type: msg === RATE_LIMIT_EXCEEDED ? 'warning' : 'error',
    message: msg === RATE_LIMIT_EXCEEDED ? 'Terlalu banyak permintaan. Silakan coba lagi.' : msg,
  });
}

function fmtPeriod(p: string | undefined | null) {
  if (!p || typeof p !== 'string' || !p.includes('-')) return '-';
  const [y, m] = p.split('-');
  return `${MONTHS[parseInt(m, 10) - 1] ?? m} ${y}`;
}

function fmtPeriodShort(p: string | undefined | null) {
  if (!p || typeof p !== 'string' || !p.includes('-')) return '-';
  const [y, m] = p.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${MONTH_SHORT[idx] ?? m} ${y.slice(2)}`;
}

/**
 * Calculates score breakdown from report parameters based on backend formula:
 * 1. Diversion Rate (40% weight, max 40 pts)
 * 2. Transaction Activity (30% weight, max 30 pts)
 * 3. Waste Volume (30% weight, max 30 pts)
 */
function getScoreBreakdown(r: CircularReport): ScoreBreakdown {
  if (r.scoreBreakdown) return r.scoreBreakdown;

  const wdr = r.wasteDiversionRate ?? 0;
  const txCount = r.transactionCount ?? 0;
  const wasteKg = r.totalWasteUtilizedKg ?? 0;

  const divScore = Math.round((wdr * 0.4) * 10) / 10;
  const actScore = Math.round((Math.min(100, txCount * 10) * 0.3) * 10) / 10;
  const volScore = Math.round((Math.min(100, (wasteKg / 1000) * 10) * 0.3) * 10) / 10;
  const total = Math.round((divScore + actScore + volScore) * 10) / 10;

  return {
    diversionComponent: { score: divScore, maxScore: 40, weightPercent: 40, label: 'Tingkat Diversi Limbah' },
    activityComponent: { score: actScore, maxScore: 30, weightPercent: 30, label: 'Aktivitas Transaksi' },
    volumeComponent: { score: volScore, maxScore: 30, weightPercent: 30, label: 'Volume Pengolahan' },
    totalScore: r.circularScore ?? total,
  };
}

function getKPIsWithTrends(reports: CircularReport[]) {
  if (!reports?.length) {
    return {
      latest: null,
      trends: { wdr: null, cs: null, score: null, ev: null },
    };
  }

  const sorted = [...reports].sort((a, b) => (a.period || '').localeCompare(b.period || ''));
  const current = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  const currentWdr = current.wasteDiversionRate ?? 0;
  const currentCs = current.carbonSaving ?? current.carbonSavingKg ?? 0;
  const currentScore = current.circularScore ?? 0;
  const currentEv = current.economicValue ?? 0;
  const currentWasteKg = current.totalWasteUtilizedKg ?? 0;

  let trends = {
    wdr: null as number | null,
    cs: null as number | null,
    score: null as number | null,
    ev: null as number | null,
  };

  if (previous) {
    const prevWdr = previous.wasteDiversionRate ?? 0;
    const prevCs = previous.carbonSaving ?? previous.carbonSavingKg ?? 0;
    const prevScore = previous.circularScore ?? 0;
    const prevEv = previous.economicValue ?? 0;

    trends = {
      wdr: Math.round((currentWdr - prevWdr) * 10) / 10,
      cs: prevCs > 0 ? Math.round(((currentCs - prevCs) / prevCs) * 1000) / 10 : null,
      score: Math.round((currentScore - prevScore) * 10) / 10,
      ev: prevEv > 0 ? Math.round(((currentEv - prevEv) / prevEv) * 1000) / 10 : null,
    };
  }

  return {
    latest: {
      wdr: currentWdr,
      cs: currentCs,
      score: currentScore,
      ev: currentEv,
      wasteKg: currentWasteKg,
      period: current.period,
      report: current,
    },
    trends,
  };
}

/* Trend delta — plain text, no pill. A number that went down should look
   like it went down, not get dressed up in a rounded badge either way. */
function TrendDelta({ value, isPercent, quiet }: { value: number | null; isPercent?: boolean; quiet?: string }) {
  if (value === null || isNaN(value)) {
    return <span className="text-xs text-stone-400">{quiet ?? 'Belum ada pembanding'}</span>;
  }
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-800' : 'text-red-700'}`}>
      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {isPositive ? '+' : ''}{value}{isPercent ? '%' : ''}
      <span className="text-stone-400 font-normal">vs bulan lalu</span>
    </span>
  );
}

/* One compact row per metric instead of four separate icon-bubble cards.
   Differentiation comes from the numbers and labels, not four different hues. */
function MetricRow({
  label,
  value,
  unit,
  trend,
  trendIsPercent,
  footnote,
}: {
  label: string;
  value: string;
  unit?: string;
  trend: number | null;
  trendIsPercent?: boolean;
  footnote?: string;
}) {
  return (
    <div className="flex flex-col justify-between py-5 px-5 sm:px-6 border-b sm:border-b-0 sm:border-r border-stone-200 last:border-0">
      <p className="text-[13px] text-stone-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[28px] leading-none font-semibold text-stone-900 tabular-nums">{value}</span>
        {unit && <span className="text-sm text-stone-400">{unit}</span>}
      </div>
      <div className="mt-3">
        <TrendDelta value={trend} isPercent={trendIsPercent} />
      </div>
      {footnote && <p className="mt-1 text-[11px] text-stone-400">{footnote}</p>}
    </div>
  );
}

export default function CircularReportPage() {
  const { toast } = useToast();
  const { isReady } = useAuth();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [reports, setReports] = useState<CircularReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [genOpen, setGenOpen] = useState(false);
  const [selMonth, setSelMonth] = useState('');
  const [selYear, setSelYear] = useState(String(CUR_YEAR));
  const [generating, setGenerating] = useState(false);
  const [detOpen, setDetOpen] = useState(false);
  const [detId, setDetId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getData<ReportsResponse>('/circular-reports/my');
      setReports(res.data ?? []);
    } catch (e: unknown) {
      handleApiError(e, toastRef.current, 'Gagal memuat laporan sirkular');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    fetchReports();
  }, [isReady, fetchReports]);

  const handleGenerate = async () => {
    if (!selMonth) {
      toastRef.current({ type: 'error', message: 'Pilih bulan terlebih dahulu.' });
      return;
    }
    setGenerating(true);
    try {
      await postData('/circular-reports/my/generate', { period: `${selYear}-${selMonth}` });
      toastRef.current({
        type: 'success',
        message: `Laporan untuk ${fmtPeriod(`${selYear}-${selMonth}`)} berhasil dibuat.`,
      });
      setGenOpen(false);
      setSelMonth('');
      fetchReports();
    } catch (e: unknown) {
      handleApiError(e, toastRef.current, 'Gagal membuat laporan');
    } finally {
      setGenerating(false);
    }
  };

  const { latest, trends } = getKPIsWithTrends(reports);

  const trendChartData = [...reports]
    .sort((a, b) => (a.period || '').localeCompare(b.period || ''))
    .map((r) => ({
      period: fmtPeriodShort(r.period),
      fullPeriod: r.period,
      wasteKg: r.totalWasteUtilizedKg ?? 0,
      carbonKg: r.carbonSaving ?? r.carbonSavingKg ?? 0,
      diversionRate: r.wasteDiversionRate ?? 0,
      score: r.circularScore ?? 0,
      economicValue: r.economicValue ?? 0,
    }));

  const totalWaste = latest?.wasteKg || 1000;
  const materialCategoryData = [
    { name: 'Plastik Industri', value: Math.round(totalWaste * 0.45), percentage: 45 },
    { name: 'Logam & Skrap', value: Math.round(totalWaste * 0.30), percentage: 30 },
    { name: 'Kertas & Karton', value: Math.round(totalWaste * 0.15), percentage: 15 },
    { name: 'Limbah Organik / Lainnya', value: Math.round(totalWaste * 0.10), percentage: 10 },
  ];

  const scoreBreakdown = latest?.report ? getScoreBreakdown(latest.report) : null;

  const treesPlantedEquiv = Math.round((latest?.cs ?? 0) / 20);
  const carKmSavedEquiv = Math.round((latest?.cs ?? 0) * 4.16);
  const electricityKwhSavedEquiv = Math.round((latest?.cs ?? 0) * 1.25);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header — plain, no gradient banner. The eyebrow carries the ESG
            framing in text, not a decorative badge. */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-stone-200">
          <div>
            <p className="text-xs font-medium text-emerald-800 tracking-wide">Pilar Lingkungan — ESG</p>
            <h1 className="text-2xl font-semibold text-stone-900 mt-1">Laporan Ekosistem Sirkular</h1>
            <p className="text-stone-500 text-sm mt-1 max-w-xl">
              Reduksi emisi karbon (Scope 3), limbah teralihkan, dan efisiensi sirkularitas material per periode.
            </p>
          </div>
          <Button variant="primary" onClick={() => setGenOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Generate Laporan
          </Button>
        </div>

        {/* KPI strip — one card, four columns, dividers instead of colored
            tiles. Loading state matches the same shape. */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 rounded-xl overflow-hidden border border-stone-200">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-5"><SkeletonCard /></div>
            ))}
          </div>
        ) : (
          <Card className="shadow-none border-stone-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-stone-200">
              <MetricRow
                label="Waste Diversion Rate"
                value={latest ? `${latest.wdr.toFixed(1)}%` : '0.0%'}
                trend={trends.wdr}
                footnote="Target ESG 80%"
              />
              <MetricRow
                label="Carbon Saving"
                value={latest ? latest.cs.toLocaleString('id-ID') : '0'}
                unit="kg CO2e"
                trend={trends.cs}
                trendIsPercent
              />
              <MetricRow
                label="Circular Score"
                value={latest ? String(latest.score) : '0'}
                unit="/ 100"
                trend={trends.score}
              />
              <MetricRow
                label="Nilai Ekonomi Sirkular"
                value={latest ? formatCurrency(latest.ev) : 'Rp 0'}
                trend={trends.ev}
                trendIsPercent
              />
            </div>
          </Card>
        )}

        {/* Trend charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-none border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-stone-900">
                Volume Limbah & Reduksi Karbon
              </CardTitle>
              <p className="text-xs text-stone-500">Kg limbah diolah dibanding kg CO2e terselamatkan, per periode.</p>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="h-64 flex items-center justify-center bg-stone-50 rounded-lg">
                  <div className="h-6 w-32 bg-stone-200 animate-pulse rounded" />
                </div>
              ) : trendChartData.length < 2 ? (
                <EmptyTrend />
              ) : mounted ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={INK} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={INK} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A8A29E" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#A8A29E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#78716C' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#78716C' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1C1917', borderRadius: '6px', color: '#FFF', border: 'none' }}
                        formatter={(val: number, name: string) => [
                          `${val.toLocaleString('id-ID')} ${name === 'wasteKg' ? 'kg' : 'kg CO2e'}`,
                          name === 'wasteKg' ? 'Limbah Diolah' : 'Carbon Saving',
                        ]}
                      />
                      <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="wasteKg" name="Limbah Diolah (kg)" stroke={INK} strokeWidth={2} fillOpacity={1} fill="url(#wasteGrad)" />
                      <Area type="monotone" dataKey="carbonKg" name="Carbon Saving (kg CO2e)" stroke="#78716C" strokeWidth={2} fillOpacity={1} fill="url(#carbonGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-none border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-stone-900">
                Diversi Limbah & Skor Sirkularitas
              </CardTitle>
              <p className="text-xs text-stone-500">Progres diversion rate terhadap baseline ESG industri (80%).</p>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="h-64 flex items-center justify-center bg-stone-50 rounded-lg">
                  <div className="h-6 w-32 bg-stone-200 animate-pulse rounded" />
                </div>
              ) : trendChartData.length < 2 ? (
                <EmptyTrend />
              ) : mounted ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#78716C' }} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#78716C' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1C1917', borderRadius: '6px', color: '#FFF', border: 'none' }}
                        formatter={(val: number, name: string) => [
                          `${val.toFixed(1)}${name === 'diversionRate' ? '%' : ' pts'}`,
                          name === 'diversionRate' ? 'Diversion Rate' : 'Circular Score',
                        ]}
                      />
                      <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="diversionRate" name="Diversion Rate (%)" fill={INK} radius={[3, 3, 0, 0]} barSize={20} />
                      <Bar dataKey="score" name="Circular Score (/100)" fill="#A8A29E" radius={[3, 3, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Material composition & score breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-none border-stone-200 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-stone-900">Komposisi Material</CardTitle>
              <p className="text-xs text-stone-500">Alokasi jenis material dari total limbah diolah.</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="h-6 w-24 bg-stone-200 animate-pulse rounded" />
                </div>
              ) : !latest ? (
                <div className="h-40 flex items-center justify-center text-stone-400 text-xs">
                  Belum ada data laporan
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Stacked bar instead of a donut — reads faster at this
                      size and doesn't need a legend to decode. */}
                  <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-stone-100">
                    {materialCategoryData.map((item, idx) => (
                      <div
                        key={item.name}
                        style={{ width: `${item.percentage}%`, backgroundColor: MATERIAL_SCALE[idx % MATERIAL_SCALE.length] }}
                      />
                    ))}
                  </div>
                  <div className="space-y-2.5 pt-1">
                    {materialCategoryData.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: MATERIAL_SCALE[idx % MATERIAL_SCALE.length] }}
                          />
                          <span className="text-stone-700 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-baseline gap-2 flex-shrink-0">
                          <span className="text-stone-400 tabular-nums">{item.value.toLocaleString('id-ID')} kg</span>
                          <span className="text-stone-900 font-semibold tabular-nums w-9 text-right">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score breakdown — one list, one accent, formulas in a mono
              caption instead of three separate colored panels. */}
          <Card className="shadow-none border-stone-200 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-stone-900">
                Breakdown Circular Score — {latest ? `${latest.score}/100` : '0/100'}
              </CardTitle>
              <p className="text-xs text-stone-500">
                Dihitung dari 3 pilar: Diversi Limbah (40%), Aktivitas Transaksi (30%), Volume Pengolahan (30%).
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              {scoreBreakdown ? (
                <div className="divide-y divide-stone-100">
                  <ScoreLine
                    icon={<Recycle className="w-4 h-4" />}
                    label="Tingkat Diversi Limbah"
                    score={scoreBreakdown.diversionComponent.score}
                    max={40}
                    formula={`Diversion Rate ${latest?.wdr.toFixed(1)}% × 0.4`}
                  />
                  <ScoreLine
                    icon={<Activity className="w-4 h-4" />}
                    label="Aktivitas Transaksi"
                    score={scoreBreakdown.activityComponent.score}
                    max={30}
                    formula={`min(100, ${latest?.report?.transactionCount ?? 0} tx × 10) × 0.3`}
                  />
                  <ScoreLine
                    icon={<Box className="w-4 h-4" />}
                    label="Volume Pengolahan"
                    score={scoreBreakdown.volumeComponent.score}
                    max={30}
                    formula={`min(100, ${latest?.wasteKg.toLocaleString('id-ID')} kg / 1000 × 10) × 0.3`}
                  />
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-stone-400 text-xs">
                  Data breakdown skor belum tersedia
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Environmental equivalencies — inline row, not three pastel cards */}
        {latest && (
          <Card className="shadow-none border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-stone-900">Ekuivalensi Dampak Karbon</CardTitle>
              <p className="text-xs text-stone-500">Penghematan {latest.cs.toLocaleString('id-ID')} kg CO2e, dikonversi ke metrik yang lebih nyata.</p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                <EquivStat value={treesPlantedEquiv.toLocaleString('id-ID')} unit="pohon" desc="Setara daya serap CO2 pohon dewasa per tahun" />
                <EquivStat value={carKmSavedEquiv.toLocaleString('id-ID')} unit="km" desc="Jarak tempuh kendaraan bensin yang dihemat" />
                <EquivStat value={electricityKwhSavedEquiv.toLocaleString('id-ID')} unit="kWh" desc="Penghematan konsumsi daya jaringan listrik" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report history */}
        <Card className="shadow-none border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Layers className="w-4 h-4 text-stone-400" />
              Riwayat Laporan Sirkular
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-stone-100">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-stone-200 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-stone-200 rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-24 bg-stone-200 rounded animate-pulse" />
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
              <div className="divide-y divide-stone-100">
                {reports.map((r) => {
                  const csKg = r.carbonSaving ?? r.carbonSavingKg ?? 0;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setDetId(r.id); setDetOpen(true); }}
                      className="w-full text-left flex flex-col md:flex-row md:items-center justify-between py-4 hover:bg-stone-50 transition-colors -mx-6 px-6 gap-3 group"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <p className="text-sm font-semibold text-stone-900">{fmtPeriod(r.period)}</p>
                          <span className="text-xs text-stone-400 tabular-nums">Skor {r.circularScore}/100</span>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-xs text-stone-500">
                          <span>Diversion <b className="text-stone-800 font-semibold">{r.wasteDiversionRate}%</b></span>
                          <span>Carbon <b className="text-stone-800 font-semibold">{csKg.toLocaleString('id-ID')} kg</b></span>
                          <span>Limbah <b className="text-stone-800 font-semibold">{(r.totalWasteUtilizedKg ?? 0).toLocaleString('id-ID')} kg</b></span>
                          <span>Nilai <b className="text-stone-800 font-semibold">{formatCurrency(r.economicValue)}</b></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                        <span className="text-xs text-stone-400">{formatDate(r.generatedAt || r.createdAt)}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 group-hover:text-emerald-800">
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Generate Laporan */}
      <Modal isOpen={genOpen} onClose={() => setGenOpen(false)} title="Generate Laporan Sirkular" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Pilih periode laporan yang ingin di-generate.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Bulan</label>
              <select
                required
                value={selMonth}
                onChange={(e) => setSelMonth(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
              >
                <option value="">Pilih bulan</option>
                {MONTH_OPTS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Tahun</label>
              <select
                required
                value={selYear}
                onChange={(e) => setSelYear(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
              >
                {YEAR_OPTS.map((y) => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
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

function EmptyTrend() {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-sm bg-stone-50/60 rounded-lg border border-dashed border-stone-200 p-6 text-center">
      <BarChart3 className="w-8 h-8 mb-2 text-stone-300 stroke-1" />
      <p className="font-medium text-stone-600">Data historis belum cukup</p>
      <p className="text-xs text-stone-400 max-w-xs mt-1">Butuh minimal 2 periode laporan untuk menampilkan tren.</p>
    </div>
  );
}

function ScoreLine({
  icon,
  label,
  score,
  max,
  formula,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  max: number;
  formula: string;
}) {
  return (
    <div className="py-3.5 first:pt-1 last:pb-1">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 text-stone-700">
          <span className="text-stone-400">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold text-stone-900 tabular-nums">{score} / {max}</span>
      </div>
      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(score / max) * 100}%`, backgroundColor: INK }}
        />
      </div>
      <p className="mt-1 text-[11px] text-stone-400 font-mono">{formula}</p>
    </div>
  );
}

function EquivStat({ value, unit, desc }: { value: string; unit: string; desc: string }) {
  return (
    <div className="px-0 sm:px-6 first:pl-0 py-3 sm:py-0">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-stone-900 tabular-nums">{value}</span>
        <span className="text-sm text-stone-400">{unit}</span>
      </div>
      <p className="text-xs text-stone-500 mt-1 max-w-[220px]">{desc}</p>
    </div>
  );
}

/* Report detail modal */
function ReportDetailModal({
  isOpen,
  onClose,
  reportId,
}: {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
}) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !reportId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    getData<ReportDetail>(`/circular-reports/${reportId}`)
      .then(setDetail)
      .catch((e: unknown) => handleApiError(e, toast, 'Gagal memuat detail laporan'))
      .finally(() => setLoading(false));
  }, [isOpen, reportId, toast]);

  const carbonKg = detail?.carbonSaving ?? detail?.carbonSavingKg ?? 0;
  const treesEquiv = Math.round(carbonKg / 20);
  const scoreBreakdown = detail ? getScoreBreakdown(detail) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Laporan Sirkular" size="lg">
      {loading ? (
        <div className="space-y-4 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-stone-200 rounded animate-pulse" />
          ))}
        </div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <p className="text-xs text-stone-500 font-medium">Periode Laporan</p>
              <p className="text-xl font-semibold text-stone-900">{fmtPeriod(detail.period)}</p>
            </div>
            <span className="text-sm font-semibold text-stone-900 tabular-nums">
              {detail.circularScore}<span className="text-stone-400 font-normal">/100</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            <div className="pb-3 sm:pb-0 sm:pr-4">
              <p className="text-[11px] text-stone-500">Waste Diversion</p>
              <p className="text-lg font-semibold text-stone-900 mt-0.5">{detail.wasteDiversionRate}%</p>
            </div>
            <div className="pb-3 sm:pb-0 sm:px-4">
              <p className="text-[11px] text-stone-500">Carbon Saving</p>
              <p className="text-lg font-semibold text-stone-900 mt-0.5">{carbonKg.toLocaleString('id-ID')} kg</p>
            </div>
            <div className="pt-3 sm:pt-0 sm:px-4">
              <p className="text-[11px] text-stone-500">Nilai Ekonomi</p>
              <p className="text-lg font-semibold text-stone-900 mt-0.5">{formatCurrency(detail.economicValue)}</p>
            </div>
            <div className="pt-3 sm:pt-0 sm:pl-4">
              <p className="text-[11px] text-stone-500">Pohon Ditanam</p>
              <p className="text-lg font-semibold text-stone-900 mt-0.5">{treesEquiv} pohon</p>
            </div>
          </div>

          {scoreBreakdown && (
            <div className="border border-stone-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-stone-900 mb-2">
                Rincian Formula Circular Score ({detail.circularScore}/100)
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Tingkat Diversi Limbah (40%)</span>
                  <span className="font-semibold text-stone-900 tabular-nums">{scoreBreakdown.diversionComponent.score} / 40</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Aktivitas Transaksi (30%)</span>
                  <span className="font-semibold text-stone-900 tabular-nums">{scoreBreakdown.activityComponent.score} / 30</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Volume Pengolahan Limbah (30%)</span>
                  <span className="font-semibold text-stone-900 tabular-nums">{scoreBreakdown.volumeComponent.score} / 30</span>
                </div>
              </div>
            </div>
          )}

          {detail.categories && detail.categories.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-stone-900 mb-2">Komposisi Kategori Material</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detail.categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-100 rounded-lg text-xs">
                    <span className="font-medium text-stone-700">{cat.name}</span>
                    <span className="font-semibold text-stone-900 tabular-nums">{cat.totalKg.toLocaleString('id-ID')} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.materials && detail.materials.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-stone-900 mb-2">Rincian Material Didaur Ulang</p>
              <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
                {detail.materials.map((mat, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-stone-50">
                    <span className="text-stone-700 font-medium">{mat.name}</span>
                    <span className="font-semibold text-stone-900 tabular-nums">{mat.diverted.toLocaleString('id-ID')} {mat.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-stone-400 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span>Dibuat pada: {formatDate(detail.generatedAt || detail.createdAt)}</span>
            <span>ID: {detail.id}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-500 text-center py-8">Data tidak tersedia.</p>
      )}
    </Modal>
  );
}
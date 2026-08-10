'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Recycle,
  Leaf,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SkeletonCard, SkeletonText } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { getData } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface DashboardMetrics {
  companyName: string;
  distributorId: string;
  summary: {
    completedRevenue: number;
    pendingRevenue: number;
    totalTransactions: number;
    activeMaterials: number;
    draftMaterials: number;
    estimatedInventoryValue: number;
  };
  transactionBreakdown: Record<string, number>;
  topSellingMaterials: { title: string; totalQuantity: number; totalRevenue: number }[];
  categoryBreakdown: Record<string, { count: number; totalValue: number }>;
}

interface DashboardResponse {
  data: {
    metrics: DashboardMetrics;
    aiSummary: string | null;
    fallbackMessage: string | null;
  };
}

interface KpiItem {
  label: string;
  value: string;
  trend: number | null;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const { isReady } = useAuth();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait until AuthProvider has written the user identity to localStorage,
    // so the API request carries the correct x-user-id / x-user-role headers.
    if (!isReady) return;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await getData<DashboardResponse>('/analytics/dashboard');
        setMetrics(response.data?.metrics ?? null);
      } catch (error) {
        toastRef.current({
          type: 'error',
          message: error instanceof Error ? error.message : 'Gagal memuat data dashboard',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [isReady]);

  const kpis: KpiItem[] = metrics
    ? [
        {
          label: 'Material Aktif',
          value: metrics.summary.activeMaterials.toLocaleString('id-ID'),
          trend: null,
          icon: Recycle,
          iconBg: 'bg-[#E8F5E9]',
          iconColor: 'text-[#1B5E20]',
        },
        {
          label: 'Nilai Inventori',
          value: `${(metrics.summary.estimatedInventoryValue / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`,
          trend: null,
          icon: Leaf,
          iconBg: 'bg-[#E8F5E9]',
          iconColor: 'text-[#1B5E20]',
        },
        {
          label: 'Total Pendapatan',
          value: formatCurrency(metrics.summary.completedRevenue),
          trend: null,
          icon: Wallet,
          iconBg: 'bg-[#EFF4FF]',
          iconColor: 'text-[#0B1C30]',
        },
        {
          label: 'Total Transaksi',
          value: metrics.summary.totalTransactions.toLocaleString('id-ID'),
          trend: null,
          icon: ArrowUpRight,
          iconBg: 'bg-[#EFF4FF]',
          iconColor: 'text-[#0B1C30]',
        },
      ]
    : [];

  const revenueChart =
    metrics && Object.keys(metrics.categoryBreakdown).length > 0
      ? Object.entries(metrics.categoryBreakdown).map(([name, cat]) => ({
          month: name,
          revenue: cat.totalValue,
        }))
      : [];

  const recentListings =
    metrics?.topSellingMaterials?.map((m) => ({
      name: m.title,
      value: formatCurrency(m.totalRevenue),
      color: '#065F46',
    })) ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-layout mx-auto space-y-5">

        {/* KPI Cards - Bento 4-Column Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-[124px]" />)
            : kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-5 flex flex-col justify-between h-full min-h-[124px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                          <Icon className={`h-[18px] w-[18px] ${kpi.iconColor}`} />
                        </div>
                        <p className="text-[12px] font-medium uppercase text-[#64748B] leading-snug">
                          {kpi.label}
                        </p>
                      </div>
                      {kpi.trend !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-semibold text-[#1B5E20]">
                          <TrendingUp className="h-3 w-3" />
                          {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                        </span>
                      )}
                    </div>
                    <p className="text-[28px] font-bold text-[#0F172A] leading-none mt-3 tabular-nums">
                      {kpi.value}
                    </p>
                  </div>
                );
              })}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-[#1E293B]">Distribusi Limbah Bulanan</h3>
              <select className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[13px] font-medium text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#065F46] focus:border-[#065F46] hover:bg-gray-50 cursor-pointer">
                <option>Tahun Ini</option>
                <option>Bulan Ini</option>
                <option>Minggu Ini</option>
              </select>
            </div>
            <div className="h-[260px]">
                          {loading ? (
                            <SkeletonText lines={5} />
                          ) : mounted && revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChart} barCategoryGap="30%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', padding: '8px 12px' }}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#94A3B8">
                      {revenueChart.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === revenueChart.length - 1 ? '#065F46' : '#94A3B8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[13px] text-[#94A3B8]">
                  Tidak ada data distribusi limbah
                </div>
              )}
            </div>
          </div>

          {/* Recent Listings Table */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-[#1E293B]">Daftar Terbaru</h3>
              <Link href="/materials" className="text-[12px] font-medium text-[#065F46] hover:underline">
                Lihat Semua →
              </Link>
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <SkeletonText lines={4} />
              ) : recentListings.length > 0 ? (
                <div className="space-y-1">
                  {recentListings.map((item) => (
                    <div key={item.name} className="flex items-center justify-between py-3 border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 px-2 rounded-md transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[13px] font-medium text-[#0F172A]">
                          {item.name === 'ACTIVE' ? 'Active Listing' : item.name === 'DRAFT' ? 'Draft' : item.name === 'PENDING_REVIEW' ? 'Pending' : item.name === 'REJECTED' ? 'Rejected' : item.name}
                        </span>
                      </div>
                      <span className="text-[13px] font-bold text-[#0F172A] tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center pb-4">
                  <p className="text-[13px] text-[#94A3B8] text-center">Belum ada data terbaru</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-6 pt-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[12px] text-gray-400">
              &copy; 2024 ReMat Circular Economy Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[12px] text-gray-500 font-medium">
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </DashboardLayout>
  );
}
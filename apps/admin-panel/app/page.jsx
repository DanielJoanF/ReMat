"use client";

import { useState, useEffect } from "react";
import AdminShell from "./components/AdminShell";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getAdminHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const userId = sessionStorage.getItem("remat_user_id") || "admin-123";
  const userRole = sessionStorage.getItem("remat_user_role") || "ADMIN";
  return {
    "Content-Type": "application/json",
    "x-user-id": userId,
    "x-user-role": userRole
  };
};

const STATUS_LABELS = {
  PENDING: { label: "Dibuat", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Dikonfirmasi", color: "bg-blue-100 text-blue-800" },
  PAID: { label: "Dibayar", color: "bg-indigo-100 text-indigo-800" },
  SHIPPED: { label: "Dikirim", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Selesai", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-800" }
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [pendingMaterials, setPendingMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    // Process URL query parameters for session transfer
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const sessionName = params.get("session_name");
    const sessionRole = params.get("session_role");

    if (sessionId && sessionName && sessionRole) {
      sessionStorage.setItem("remat_user_id", sessionId);
      sessionStorage.setItem("remat_user_name", sessionName);
      sessionStorage.setItem("remat_user_role", sessionRole);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    const userId = sessionStorage.getItem("remat_user_id");
    const userRole = sessionStorage.getItem("remat_user_role");

    if (!userId || userRole !== "ADMIN") {
      window.location.href = "http://localhost:3003/";
      return;
    }

    fetchAllData();
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard`, { headers: getAdminHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/materials/pending`, { headers: getAdminHeaders() }).then((r) => r.json())
      ]);

      if (dashboardRes?.data?.metrics) setMetrics(dashboardRes.data.metrics);
      if (pendingRes?.data) setPendingMaterials(pendingRes.data);
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    // {
    //   label: "Total Omset Platform",
    //   value: `Rp ${(metrics?.summary?.totalRevenue ?? 0).toLocaleString("id-ID")}`,
    //   sub: "Status COMPLETED & PAID",
    //   color: "text-emerald-700",
    //   bg: "bg-emerald-50",
    //   icon: (
    //     <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    //     </svg>
    //   )
    // },
    {
      label: "Total Transaksi",
      value: (metrics?.summary?.totalTransactions ?? 0).toLocaleString("id-ID"),
      sub: "Semua status transaksi",
      color: "text-blue-700",
      bg: "bg-blue-50",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 022-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      label: "Material Aktif",
      value: (metrics?.summary?.activeMaterials ?? 0).toLocaleString("id-ID"),
      sub: "Material terverifikasi & tayang",
      color: "text-slate-800",
      bg: "bg-slate-50",
      icon: (
        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      label: "Total Distributor",
      value: (metrics?.summary?.totalDistributors ?? 0).toLocaleString("id-ID"),
      sub: "Produsen limbah terdaftar",
      color: "text-violet-700",
      bg: "bg-violet-50",
      icon: (
        <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      label: "Total Konsumen",
      value: (metrics?.summary?.totalConsumers ?? 0).toLocaleString("id-ID"),
      sub: "Pembeli material terdaftar",
      color: "text-amber-700",
      bg: "bg-amber-50",
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <AdminShell onRefresh={fetchAllData}>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan metrik platform ReMat secara keseluruhan</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <svg className="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Memuat data dashboard...
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              {kpiCards.map((card) => (
                <div key={card.label} className={`${card.bg} rounded-xl border border-slate-200 p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{card.label}</p>
                    {card.icon}
                  </div>
                  <p className={`text-xl font-bold ${card.color} mt-1`}>{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Material Pending Review Card */}
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Material PENDING REVIEW</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Menunggu verifikasi admin</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 font-bold text-lg px-3 py-1 rounded-lg">
                    {pendingMaterials.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  {pendingMaterials.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      ✓ Tidak ada material menunggu verifikasi
                    </div>
                  ) : (
                    pendingMaterials.slice(0, 5).map((mat) => (
                      <div key={mat.id} className="px-5 py-3">
                        <p className="text-sm font-semibold text-slate-800 truncate">{mat.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{mat.distributor?.companyName || "N/A"} · {mat.location}</p>
                      </div>
                    ))
                  )}
                </div>
                {pendingMaterials.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-100">
                    <a href="/verifikasi-penjualan" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                      Lihat semua → Verifikasi Penjualan
                    </a>
                  </div>
                )}
              </div>

              {/* Transaction Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900 text-sm">Breakdown Status Transaksi</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Distribusi status seluruh transaksi</p>
                </div>
                <div className="px-5 py-4 space-y-2">
                  {Object.entries(metrics?.transactionBreakdown || {}).map(([status, count]) => {
                    const meta = STATUS_LABELS[status] || { label: status, color: "bg-slate-100 text-slate-700" };
                    const total = Object.values(metrics?.transactionBreakdown || {}).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className={`${meta.color} text-[11px] font-semibold px-2 py-0.5 rounded w-28 text-center flex-shrink-0`}>
                          {meta.label}
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                  {(!metrics?.transactionBreakdown || Object.keys(metrics.transactionBreakdown).length === 0) && (
                    <p className="text-xs text-slate-400 py-4 text-center">Belum ada data transaksi</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}

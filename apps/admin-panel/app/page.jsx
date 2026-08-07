"use client";

import { useState, useEffect } from "react";

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

const ADMIN_HEADERS = new Proxy({}, {
  get(target, prop) {
    return getAdminHeaders()[prop];
  },
  ownKeys(target) {
    return Reflect.ownKeys(getAdminHeaders());
  },
  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(getAdminHeaders(), prop);
  }
});

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("moderation");
  const [metrics, setMetrics] = useState(null);
  const [pendingMaterials, setPendingMaterials] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [aiLogs, setAiLogs] = useState(null);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerLink, setBannerLink] = useState("");

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    // 1. Process URL query parameters for session transfer
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const sessionName = params.get("session_name");
    const sessionRole = params.get("session_role");

    if (sessionId && sessionName && sessionRole) {
      sessionStorage.setItem("remat_user_id", sessionId);
      sessionStorage.setItem("remat_user_name", sessionName);
      sessionStorage.setItem("remat_user_role", sessionRole);

      // Clean query params from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // 2. Read session from sessionStorage and guard access
    const userId = sessionStorage.getItem("remat_user_id");
    const userRole = sessionStorage.getItem("remat_user_role");

    if (!userId || userRole !== "ADMIN") {
      window.location.href = "http://localhost:3000/login";
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
      const [metricsRes, pendingRes, distRes, catRes, bannerRes, aiLogsRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard`, { headers: ADMIN_HEADERS }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/materials/pending`, { headers: ADMIN_HEADERS }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/distributors`, { headers: ADMIN_HEADERS }).then((r) => r.json()),
        fetch(`${API_BASE}/categories`).then((r) => r.json()),
        fetch(`${API_BASE}/admin/banners`, { headers: ADMIN_HEADERS }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/ai-monitoring`, { headers: ADMIN_HEADERS }).then((r) => r.json())
      ]);

      if (metricsRes?.data?.metrics) setMetrics(metricsRes.data.metrics);
      if (pendingRes?.data) setPendingMaterials(pendingRes.data);
      if (distRes?.data) setDistributors(distRes.data);
      if (catRes?.data) setCategories(catRes.data);
      if (bannerRes?.data) setBanners(bannerRes.data);
      if (aiLogsRes?.data) setAiLogs(aiLogsRes.data);
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Material Moderation Handlers
  const handleReviewMaterial = async (materialId, action) => {
    try {
      const res = await fetch(`${API_BASE}/admin/materials/${materialId}/review`, {
        method: "PATCH",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Material ${action === "approve" ? "disetujui (ACTIVE)" : "ditolak (REJECTED)"}`);
        fetchAllData();
      } else {
        alert(data.error?.message || "Gagal memproses");
      }
    } catch (err) {
      alert("Error processing review");
    }
  };

  // 2. Distributor Verification Handler
  const handleVerifyDistributor = async (distributorId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/admin/distributors/${distributorId}/verify`, {
        method: "PATCH",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ isVerified: !currentStatus })
      });
      if (res.ok) {
        showToast(`Status verifikasi distributor diperbarui`);
        fetchAllData();
      }
    } catch (err) {
      alert("Error verifying distributor");
    }
  };

  // 3. Category Handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName || !categorySlug) return;
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ name: categoryName, slug: categorySlug })
      });
      if (res.ok) {
        showToast("Kategori baru berhasil dibuat");
        setCategoryName("");
        setCategorySlug("");
        fetchAllData();
      }
    } catch (err) {
      alert("Error creating category");
    }
  };

  // 4. Banner Handlers
  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (!bannerTitle || !bannerUrl) return;
    try {
      const res = await fetch(`${API_BASE}/admin/banners`, {
        method: "POST",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ title: bannerTitle, imageUrl: bannerUrl, linkUrl: bannerLink })
      });
      if (res.ok) {
        showToast("Banner promo berhasil dibuat");
        setBannerTitle("");
        setBannerUrl("");
        setBannerLink("");
        fetchAllData();
      }
    } catch (err) {
      alert("Error creating banner");
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm("Hapus banner ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/banners/${bannerId}`, {
        method: "DELETE",
        headers: ADMIN_HEADERS
      });
      if (res.ok) {
        showToast("Banner dihapus");
        fetchAllData();
      }
    } catch (err) {
      alert("Error deleting banner");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Header Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">
            R
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">ReMat Admin Moderation Console</h1>
            <p className="text-xs text-slate-400">Collaborative Industrial Zero-Waste Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-medium">
            Admin: {typeof window !== "undefined" ? sessionStorage.getItem("remat_user_name") || "Administrator" : "Administrator"}
          </span>
          <button onClick={fetchAllData} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition">
            Refresh Data
          </button>
          <button onClick={() => {
            sessionStorage.clear();
            window.location.href = "http://localhost:3000/?logout=true";
          }} className="bg-red-900 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded transition font-semibold">
            Keluar
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-bounce">
          ✓ {notification}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Metric Cards Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Omset Platform</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              Rp {metrics?.summary?.totalRevenue?.toLocaleString("id-ID") || 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Status COMPLETED & PAID</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Material PENDING REVIEW</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{pendingMaterials.length}</p>
            <p className="text-xs text-amber-700 font-medium mt-1">Membutuhkan moderasi admin</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Distributor Terdaftar</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{distributors.length}</p>
            <p className="text-xs text-slate-400 mt-1">
              {distributors.filter((d) => d.isVerified).length} Terverifikasi
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Listing Aktif Marketplace</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{metrics?.summary?.activeMaterials || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Material terverifikasi & tayang</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-6 flex gap-2">
          {[
            { id: "moderation", label: `Moderasi Material (${pendingMaterials.length})` },
            { id: "distributors", label: `Verifikasi Distributor (${distributors.length})` },
            { id: "categories", label: `Kategori Limbah (${categories.length})` },
            { id: "banners", label: `Banner Promosi (${banners.length})` },
            { id: "ai-monitoring", label: "Monitoring Kualitas AI" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-800 bg-white rounded-t-lg"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: MODERASI MATERIAL */}
        {activeTab === "moderation" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Antrean Moderasi Limbah (PENDING_REVIEW)
            </h2>
            {pendingMaterials.length === 0 ? (
              <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                ✓ Tidak ada material yang membutuhkan verifikasi saat ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingMaterials.map((mat) => (
                  <div key={mat.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{mat.title}</span>
                        <span className="text-xs bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded">
                          {mat.materialCode}
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded">
                          {mat.category?.name || "Kategori"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl">{mat.description}</p>
                      <div className="text-xs text-slate-500 mt-2 flex gap-4">
                        <span>Stok: <strong>{mat.quantity} {mat.unit}</strong></span>
                        <span>Harga: <strong>Rp {Number(mat.price).toLocaleString("id-ID")}/{mat.unit}</strong></span>
                        <span>Lokasi: <strong>{mat.location}</strong></span>
                        <span>Distributor: <strong>{mat.distributor?.companyName || "N/A"}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewMaterial(mat.id, "approve")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        ✓ Setujui (ACTIVE)
                      </button>
                      <button
                        onClick={() => handleReviewMaterial(mat.id, "reject")}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        ✕ Tolak (REJECT)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VERIFIKASI DISTRIBUTOR */}
        {activeTab === "distributors" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Daftar Produsen Limbah (Distributor)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b">
                  <tr>
                    <th className="p-3">Nama Perusahaan</th>
                    <th className="p-3">Email User</th>
                    <th className="p-3">Kota</th>
                    <th className="p-3">Material Listed</th>
                    <th className="p-3">Status Verifikasi</th>
                    <th className="p-3 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {distributors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{d.companyName}</td>
                      <td className="p-3 text-slate-600">{d.user?.email || "N/A"}</td>
                      <td className="p-3 text-slate-600">{d.city}</td>
                      <td className="p-3 font-semibold">{d._count?.materials || 0}</td>
                      <td className="p-3">
                        {d.isVerified ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-semibold">
                            ✓ TERVERIFIKASI
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            BELUM VERIFIKASI
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleVerifyDistributor(d.id, d.isVerified)}
                          className={`px-3 py-1.5 rounded font-semibold text-xs transition ${
                            d.isVerified
                              ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {d.isVerified ? "Batalkan Verifikasi" : "Verifikasi Sekarang"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MANAJEMEN KATEGORI */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Tambah Kategori Baru</h3>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      setCategorySlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    placeholder="Misal: Limbah Kaca"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    placeholder="limbah-kaca"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-xs font-semibold"
                >
                  + Simpan Kategori
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Daftar Kategori Terdaftar</h3>
              <div className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{cat.name}</span>
                      <span className="ml-2 font-mono text-slate-400">({cat.slug})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BANNER PROMOSI */}
        {activeTab === "banners" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Buat Banner Promosi</h3>
              <form onSubmit={handleCreateBanner} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Judul Banner</label>
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Promo Daur Ulang Plastik"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Image URL</label>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Link URL (Opsional)</label>
                  <input
                    type="text"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="https://remat.id/promo"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-xs font-semibold"
                >
                  + Simpan Banner
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Daftar Banner Tayang</h3>
              {banners.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">Belum ada banner promosi terpasang.</p>
              ) : (
                <div className="space-y-3">
                  {banners.map((b) => (
                    <div key={b.id} className="p-3 border rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{b.title}</p>
                        <p className="text-slate-400 font-mono text-[11px] truncate max-w-xs">{b.imageUrl}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="text-red-600 hover:text-red-800 font-semibold text-xs"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: MONITORING KUALITAS AI */}
        {activeTab === "ai-monitoring" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3">
                Log Pencarian Gagal / Di Bawah Threshold (Material Alerts)
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Daftar query konsumen yang tidak menemukan hasil similarity &ge; 0.6 untuk evaluasi kualitas AI secara manual (PRD.md §5.3 no.1).
              </p>
              {aiLogs?.failedSearchAlerts?.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">Tidak ada log pencarian gagal tercatat saat ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                      <tr>
                        <th className="p-2.5">Konsumen</th>
                        <th className="p-2.5">Query Teks Konsumen</th>
                        <th className="p-2.5">Filter Lokasi</th>
                        <th className="p-2.5">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {aiLogs?.failedSearchAlerts?.map((a) => (
                        <tr key={a.id}>
                          <td className="p-2.5 font-semibold text-slate-900">
                            {a.consumer?.companyName || a.consumer?.user?.email}
                          </td>
                          <td className="p-2.5 font-mono text-emerald-800">{a.queryText}</td>
                          <td className="p-2.5 text-slate-600">{a.locationFilter || "Semua Lokasi"}</td>
                          <td className="p-2.5 text-slate-400">
                            {new Date(a.createdAt).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import AdminShell from "../components/AdminShell";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getAdminHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    "x-user-id": sessionStorage.getItem("remat_user_id") || "admin-123",
    "x-user-role": sessionStorage.getItem("remat_user_role") || "ADMIN"
  };
};

export default function VerifikasiPenjualanPage() {
  const [pendingMaterials, setPendingMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/materials/pending`, {
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (data?.data) setPendingMaterials(data.data);
    } catch (err) {
      console.error("Error fetching pending materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (materialId, action) => {
    setProcessingId(materialId);
    try {
      const res = await fetch(`${API_BASE}/admin/materials/${materialId}/review`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          action === "approve"
            ? "Material disetujui dan kini berstatus ACTIVE"
            : "Material ditolak (REJECTED)"
        );
        fetchData();
      } else {
        alert(data.error?.message || "Gagal memproses material");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat memproses material");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminShell onRefresh={fetchData}>
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Verifikasi Penjualan</h1>
            <p className="text-sm text-slate-500 mt-1">
              Antrean material yang diajukan produsen untuk ditampilkan di marketplace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-amber-100 text-amber-800 font-bold text-base px-4 py-1.5 rounded-lg border border-amber-200">
              {pendingMaterials.length} Menunggu
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <svg className="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Memuat antrean material...
          </div>
        ) : pendingMaterials.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 py-20 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Semua Bersih!</h3>
            <p className="text-sm text-slate-500">Tidak ada material yang membutuhkan verifikasi saat ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Material Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{mat.title}</h3>
                      <span className="text-xs bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded">
                        {mat.materialCode}
                      </span>
                      <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                        PENDING REVIEW
                      </span>
                      {mat.category?.name && (
                        <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-100">
                          {mat.category.name}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 mb-3 leading-relaxed max-w-3xl">
                      {mat.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-slate-400 font-medium mb-0.5">Stok</p>
                        <p className="font-bold text-slate-800">{mat.quantity} {mat.unit}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-slate-400 font-medium mb-0.5">Harga</p>
                        <p className="font-bold text-slate-800">
                          Rp {Number(mat.price).toLocaleString("id-ID")}/{mat.unit}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-slate-400 font-medium mb-0.5">Lokasi</p>
                        <p className="font-bold text-slate-800">{mat.location || "—"}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-slate-400 font-medium mb-0.5">Produsen</p>
                        <p className="font-bold text-slate-800">{mat.distributor?.companyName || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReview(mat.id, "approve")}
                      disabled={processingId === mat.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Setujui
                    </button>
                    <button
                      onClick={() => handleReview(mat.id, "reject")}
                      disabled={processingId === mat.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

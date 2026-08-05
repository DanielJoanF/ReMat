"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  Trash2,
  Plus,
  Tag,
  MapPin,
  Calendar,
  Search,
  ChevronRight,
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_ALERTS_INITIAL = [
  {
    id: "al-001",
    queryText: "Plastik PET bersih grade A",
    category: { name: "Plastik PET" },
    locationFilter: "Surabaya",
    isActive: true,
    createdAt: "2026-07-20T10:00:00Z",
    triggeredCount: 2,
  },
  {
    id: "al-002",
    queryText: "Scrap besi H2 minimal 1 ton",
    category: { name: "Logam Besi" },
    locationFilter: "Jabodetabek",
    isActive: true,
    createdAt: "2026-07-25T08:30:00Z",
    triggeredCount: 0,
  },
  {
    id: "al-003",
    queryText: "Kertas OCC kualitas baik",
    category: { name: "Kertas Daur Ulang" },
    locationFilter: null,
    isActive: false,
    createdAt: "2026-07-10T14:00:00Z",
    triggeredCount: 5,
  },
  {
    id: "al-004",
    queryText: "Karet alam bekas industri",
    category: null,
    locationFilter: "Bandung",
    isActive: true,
    createdAt: "2026-08-01T09:00:00Z",
    triggeredCount: 0,
  },
];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}

function CreateAlertModal({ onClose, onCreate }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onCreate({ query, category, location });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-remat-green-light rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-remat-green" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Buat Alert Baru</h3>
              <p className="text-xs text-gray-500">Dapatkan notifikasi saat material tersedia</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Kata Kunci Pencarian <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="alert-query-input"
                  type="text"
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Contoh: Plastik PET grade A clear"
                  className="input-base pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Kategori (opsional)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Contoh: Plastik PET"
                className="input-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Filter Lokasi (opsional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Surabaya, Jabodetabek"
                className="input-base"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Batal</button>
              <button type="submit" id="create-alert-btn" className="btn-primary flex-1 gap-2">
                <Bell className="w-4 h-4" /> Buat Alert
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS_INITIAL);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "inactive"

  const toggleAlert = async (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const deleteAlert = (id) => {
    if (!confirm("Hapus alert ini?")) return;
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const createAlert = ({ query, category, location }) => {
    const newAlert = {
      id: `al-${Date.now()}`,
      queryText: query,
      category: category ? { name: category } : null,
      locationFilter: location || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      triggeredCount: 0,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "active") return a.isActive;
    if (filter === "inactive") return !a.isActive;
    return true;
  });

  const activeCount = alerts.filter((a) => a.isActive).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-remat-green" /> Manajemen Alert
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} alert aktif — notifikasi otomatis saat material tersedia
          </p>
        </div>
        <button
          id="create-alert-modal-btn"
          onClick={() => setShowCreateModal(true)}
          className="btn-primary gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Buat Alert
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-remat-blue rounded-xl p-4 mb-6 flex items-start gap-3">
        <Bell className="w-5 h-5 text-remat-green flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <p className="font-semibold text-gray-800 mb-0.5">Cara Kerja Alert</p>
          <p>Saat material yang sesuai dengan kata kunci Anda tersedia, ReMat akan mengirimkan email notifikasi. Anda bisa mengatur atau menonaktifkan alert kapan saja.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { value: "all", label: `Semua (${alerts.length})` },
          { value: "active", label: `Aktif (${activeCount})` },
          { value: "inactive", label: `Nonaktif (${alerts.length - activeCount})` },
        ].map((tab) => (
          <button
            key={tab.value}
            id={`alert-filter-${tab.value}`}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              filter === tab.value
                ? "bg-white text-remat-green shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert Table */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`card p-4 transition-all ${
                alert.isActive ? "border-l-4 border-l-remat-green" : "border-l-4 border-l-gray-200 opacity-75"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.isActive ? "bg-remat-green-light" : "bg-gray-100"}`}>
                  <Bell className={`w-5 h-5 ${alert.isActive ? "text-remat-green" : "text-gray-400"}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{alert.queryText}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {alert.category && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Tag className="w-3 h-3" /> {alert.category.name}
                      </span>
                    )}
                    {alert.locationFilter && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3" /> {alert.locationFilter}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" /> {formatDate(alert.createdAt)}
                    </span>
                    {alert.triggeredCount > 0 && (
                      <span className="text-xs text-remat-green font-medium">
                        ✓ {alert.triggeredCount}× dipicu
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Toggle */}
                  <button
                    id={`toggle-alert-${alert.id}`}
                    onClick={() => toggleAlert(alert.id)}
                    title={alert.isActive ? "Nonaktifkan" : "Aktifkan"}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      alert.isActive ? "bg-remat-green" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        alert.isActive ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>

                  {/* Delete */}
                  <button
                    id={`delete-alert-${alert.id}`}
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick action: Search Now */}
              <div className="mt-3 ml-13 pl-13">
                <Link
                  href={`/search?q=${encodeURIComponent(alert.queryText)}`}
                  className="inline-flex items-center gap-1.5 text-xs text-remat-green font-semibold hover:underline ml-13"
                >
                  <Search className="w-3 h-3" /> Cari Sekarang <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-remat-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BellOff className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Belum Ada Alert</h3>
          <p className="text-sm text-gray-500 mb-5">Buat alert untuk mendapatkan notifikasi saat material tersedia.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Buat Alert Pertama
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreateAlertModal onClose={() => setShowCreateModal(false)} onCreate={createAlert} />
      )}
    </div>
  );
}

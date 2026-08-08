"use client";

import React, { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const REGIONS = {
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Utara", "Jakarta Timur"],
  "Jawa Barat": ["Bandung", "Bogor", "Depok", "Bekasi", "Cirebon", "Sukabumi"],
  "Jawa Tengah": ["Semarang", "Surakarta", "Magelang", "Salatiga", "Pekalongan", "Tegal"],
  "Jawa Timur": ["Surabaya", "Malang", "Sidoarjo", "Gresik", "Kediri", "Madiun"],
  "DI Yogyakarta": ["Yogyakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul"],
  "Banten": ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon"]
};

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    industryType: "",
    companyType: "",
    province: "",
    address: "",
    city: "",
  });

  const getSessionValue = (keySuffix) => {
    if (typeof window === "undefined") return "";
    return (
      sessionStorage.getItem(`remat_user_${keySuffix}`) ||
      sessionStorage.getItem(`x-user-${keySuffix}`) ||
      ""
    );
  };

  const getHeaders = () => {
    const userId = getSessionValue("id");
    const userRole = getSessionValue("role");
    return {
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-user-role": userRole,
    };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      const userId = getSessionValue("id");
      if (!userId) {
        setError("Sesi telah berakhir atau Anda belum masuk. Mengalihkan ke halaman masuk...");
        setLoading(false);
        setTimeout(() => {
          window.location.href = "http://localhost:3000/login";
        }, 2000);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
          method: "GET",
          headers: getHeaders(),
        });

        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error?.message || "Gagal mengambil data profil.");
        }

        const data = body.data;
        setUser(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          companyName:
            data.consumerProfile?.companyName ||
            data.distributorProfile?.companyName ||
            "",
          industryType: data.consumerProfile?.industryType || "",
          companyType: data.distributorProfile?.companyType || "",
          province:
            data.consumerProfile?.province ||
            data.distributorProfile?.province ||
            "",
          address:
            data.consumerProfile?.address ||
            data.distributorProfile?.address ||
            "",
          city:
            data.consumerProfile?.city ||
            data.distributorProfile?.city ||
            "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || "Gagal memperbarui profil.");
      }

      const updatedData = body.data;
      setUser(updatedData);
      setIsEditing(false);
      setSuccessMessage("Profil Anda berhasil diperbarui!");

      // Sync updated data back to sessionStorage
      if (typeof window !== "undefined") {
        if (sessionStorage.getItem("remat_user_name")) sessionStorage.setItem("remat_user_name", updatedData.name);
        if (sessionStorage.getItem("x-user-name")) sessionStorage.setItem("x-user-name", updatedData.name);
        if (sessionStorage.getItem("remat_user_email")) sessionStorage.setItem("remat_user_email", updatedData.email);
      }

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="animate-spin h-10 w-10 text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-gray-500 font-medium">Memuat profil...</span>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Terjadi Kesalahan</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const role = user?.role || "GUEST";
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "U";

  // Role Badge Color Mapper
  const roleBadgeStyles = {
    GUEST: "bg-slate-100 text-slate-700 border-slate-200",
    CONSUMER: "bg-blue-50 text-blue-700 border-blue-200",
    DISTRIBUTOR: "bg-emerald-50 text-emerald-800 border-emerald-200",
    ADMIN: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Success / Error Info */}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-slide-up">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-emerald-800">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 shadow-md">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-semibold text-red-800">{error}</span>
        </div>
      )}

      {/* Main Single Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
        {/* Card Header & Profile Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl font-black shadow-inner flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{user.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeStyles[role] || roleBadgeStyles.GUEST}`}>
                  {role}
                </span>
                <span className="text-xs text-gray-400">
                  Terdaftar {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long" }) : ""}
                </span>
              </div>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="self-start sm:self-center px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-semibold transition"
            >
              Edit Profil
            </button>
          )}
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Alamat Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Nomor Telepon</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
              />
            </div>

            {/* Role (Always Disabled) */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Peran Pengguna</label>
              <input
                type="text"
                value={role}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-sm select-none"
              />
            </div>
          </div>

          {/* Conditionally render role-specific details */}
          {(role === "CONSUMER" || role === "DISTRIBUTOR") && (
            <div className="border-t border-gray-100 pt-6 mt-6 space-y-6">
              <h4 className="text-sm font-bold text-gray-800">Detail Alamat & Operasional</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Nama Perusahaan (Only for DISTRIBUTOR) */}
                {role === "DISTRIBUTOR" && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Nama Perusahaan / Unit Usaha</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                    />
                  </div>
                )}

                {/* Provinsi */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Provinsi</label>
                  {isEditing ? (
                    <select
                      name="province"
                      value={formData.province}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cities = REGIONS[val] || [];
                        setFormData((prev) => ({
                          ...prev,
                          province: val,
                          city: cities[0] || "",
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition bg-white"
                    >
                      <option value="" disabled>Pilih Provinsi</option>
                      {Object.keys(REGIONS).map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                      {!Object.keys(REGIONS).includes(formData.province) && formData.province && (
                        <option value={formData.province}>{formData.province}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.province || "-"}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm"
                    />
                  )}
                </div>

                {/* Kota */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Kota</label>
                  {isEditing ? (
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition bg-white"
                    >
                      <option value="" disabled>Pilih Kota</option>
                      {(REGIONS[formData.province] || []).map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                      {!(REGIONS[formData.province] || []).includes(formData.city) && formData.city && (
                        <option value={formData.city}>{formData.city}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.city || "-"}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm"
                    />
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Alamat Lengkap</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition resize-none"
                />
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 mt-8">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form fields to actual user values
                  setFormData({
                    name: user.name || "",
                    email: user.email || "",
                    phone: user.phone || "",
                    companyName:
                      user.consumerProfile?.companyName ||
                      user.distributorProfile?.companyName ||
                      "",
                    industryType: user.consumerProfile?.industryType || "",
                    companyType: user.distributorProfile?.companyType || "",
                    province:
                      user.consumerProfile?.province ||
                      user.distributorProfile?.province ||
                      "",
                    address:
                      user.consumerProfile?.address ||
                      user.distributorProfile?.address ||
                      "",
                    city:
                      user.consumerProfile?.city ||
                      user.distributorProfile?.city ||
                      "",
                  });
                }}
                disabled={saving}
                className="px-5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

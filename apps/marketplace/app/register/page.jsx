"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { User, Mail, MapPin, Phone, Lock, Loader2, Sparkles, ShieldAlert, Award, Building2 } from "lucide-react";

// Mock regions list for Indonesian operational regions
const REGIONS = {
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Utara", "Jakarta Timur"],
  "Jawa Barat": ["Bandung", "Bogor", "Depok", "Bekasi", "Cirebon", "Sukabumi"],
  "Jawa Tengah": ["Semarang", "Surakarta", "Magelang", "Salatiga", "Pekalongan", "Tegal"],
  "Jawa Timur": ["Surabaya", "Malang", "Sidoarjo", "Gresik", "Kediri", "Madiun"],
  "DI Yogyakarta": ["Yogyakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul"],
  "Banten": ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon"]
};

export default function RegisterPage() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CONSUMER");
  
  // Custom region fields
  const [province, setProvince] = useState("Jawa Tengah");
  const [city, setCity] = useState("Semarang");
  const [companyName, setCompanyName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !address || !phone || !password || !role || !province || !city) {
      setError("Silakan lengkapi semua data pendaftaran.");
      return;
    }
    if (role === "DISTRIBUTOR" && !companyName) {
      setError("Silakan isi nama perusahaan atau unit usaha Anda.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await register(name, email, address, phone, password, role, province, city, companyName);
      setSuccess(true);
      setTimeout(() => {
        // Redirect to Login sub-application (port 3003)
        window.location.href = "http://localhost:3003/";
      }, 2000);
    } catch (err) {
      setError(err.message || "Gagal melakukan registrasi. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12 relative overflow-hidden"
      style={{ backgroundImage: "url('/bg-login.jpg')" }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-neutral-950/65 pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 text-white">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Daftar Akun Baru</h2>
            <p className="text-sm text-white/70 mt-1">Lengkapi data untuk bergabung dengan ReMat</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm mb-6">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-sm mb-6">
              <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-400 animate-spin" />
              <span>Registrasi berhasil! Mengalihkan Anda ke halaman login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Dropdown (Put at top to dynamically render fields) */}
            <div>
              <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                Peran Pengguna (Role)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                  <Award className="w-4 h-4" />
                </div>
                <select
                  id="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15 appearance-none bg-neutral-900/40"
                  disabled={isLoading || success}
                >
                  <option value="CONSUMER" className="bg-neutral-900 text-white">Konsumen (Akses Marketplace)</option>
                  <option value="DISTRIBUTOR" className="bg-neutral-900 text-white">Produsen (Akses Dashboard)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Agus Setiawan"
                    className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agus@email.com"
                    className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Nomor Telepon */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Province Dropdown */}
              <div>
                <label htmlFor="province" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                  Provinsi
                </label>
                <div className="relative">
                  <select
                    id="province"
                    required
                    value={province}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProvince(val);
                      const cities = REGIONS[val] || [];
                      setCity(cities[0] || "");
                    }}
                    className="input-base w-full pl-3.5 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15 appearance-none bg-neutral-900/40 font-medium"
                    disabled={isLoading || success}
                  >
                    {Object.keys(REGIONS).map((prov) => (
                      <option key={prov} value={prov} className="bg-neutral-900 text-white">{prov}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* City Dropdown */}
              <div>
                <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                  Kota / Kabupaten
                </label>
                <div className="relative">
                  <select
                    id="city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-base w-full pl-3.5 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15 appearance-none bg-neutral-900/40 font-medium"
                    disabled={isLoading || success}
                  >
                    {(REGIONS[province] || []).map((ct) => (
                      <option key={ct} value={ct} className="bg-neutral-900 text-white">{ct}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Conditional Company Name Field for Produsen */}
              {role === "DISTRIBUTOR" && (
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="companyName" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                    Nama Perusahaan / Unit Usaha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="PT Daur Ulang Mandiri"
                      className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                      disabled={isLoading || success}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Alamat Tinggal */}
            <div>
              <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                Alamat Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Gejayan, No.20, Sleman, Yogyakarta"
                  className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading || success}
              className="btn-primary w-full h-11 justify-center gap-2 mt-4 shadow-lg shadow-remat-green/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Daftar Sekarang                  
                </>
              )}
            </button>
          </form>

          {/* Bottom link */}
          <div className="mt-6 text-center text-sm text-white/70">
            Sudah memiliki akun?{" "}
            <Link href="http://localhost:3003/" className="font-semibold text-white hover:text-emerald-400 hover:underline">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

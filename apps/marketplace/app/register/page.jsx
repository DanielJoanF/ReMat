"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { User, Mail, MapPin, Phone, Lock, Loader2, Sparkles, ShieldAlert, Award } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CONSUMER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !address || !phone || !password || !role) {
      setError("Silakan lengkapi semua data pendaftaran.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await register(name, email, address, phone, password, role);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Gagal melakukan registrasi. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12 relative overflow-hidden"
      style={{ backgroundImage: "url('/bg-login.jpg')" }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-neutral-950/65 pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 text-white">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-remat-green rounded-xl flex items-center justify-center shadow-lg shadow-remat-green/20 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
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
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
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
                    placeholder="agus@remat.id"
                    className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Nomor Telepon */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+628123456789"
                    className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
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
            </div>

            {/* Alamat Tinggal */}
            <div>
              <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                Alamat Tinggal
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
                  placeholder="Jl. Diponegoro No. 24, Semarang"
                  className="input-base w-full pl-10 h-10.5 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:bg-white/15"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div>
              <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
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
                  <option value="DISTRIBUTOR" className="bg-neutral-900 text-white">Distributor (Akses Dashboard)</option>
                  <option value="ADMIN" className="bg-neutral-900 text-white">Admin Panel (Akses Moderasi)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
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
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom link */}
          <div className="mt-6 text-center text-sm text-white/70">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="font-semibold text-remat-green hover:text-emerald-400 hover:underline">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

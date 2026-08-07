"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, Loader2, Sparkles, ShieldAlert } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/marketplace";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Silakan isi email dan password Anda.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const user = await login(email, password);
      if (user.role === "CONSUMER") {
        router.push(redirect);
      }
    } catch (err) {
      setError(err.message || "Gagal masuk. Periksa kembali email dan password Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md z-10">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 text-white">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-remat-green rounded-xl flex items-center justify-center shadow-lg shadow-remat-green/20 mb-4 animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Selamat Datang Kembali</h2>
          <p className="text-sm text-white/70 mt-1">Masuk ke akun ReMat Anda</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm mb-6">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
              Alamat Email
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
                placeholder="name@company.com"
                className="input-base w-full pl-10 h-11 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:ring-remat-green focus:bg-white/15"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                Password
              </label>
            </div>
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
                className="input-base w-full pl-10 h-11 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-remat-green focus:ring-remat-green focus:bg-white/15"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full h-11 justify-center gap-2 mt-2 shadow-lg shadow-remat-green/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Bottom link */}
        <div className="mt-8 text-center text-sm text-white/70">
          Belum memiliki akun?{" "}
          <Link href="/register" className="font-semibold text-remat-green hover:text-emerald-400 hover:underline">
            Daftar Akun Baru
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div 
      className="h-[calc(100vh-64px)] w-full flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12 relative overflow-hidden"
      style={{ backgroundImage: "url('/bg-login.jpg')" }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-neutral-950/65 pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md z-10 flex items-center justify-center p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-remat-green" />
            <p className="text-sm text-white/70">Memuat halaman masuk...</p>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}

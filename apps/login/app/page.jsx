"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, ShieldAlert, Info } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/marketplace";
  const showLoginNotice = searchParams.get("redirect") && searchParams.get("redirect").includes("/marketplace/");

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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || "Gagal masuk. Periksa kembali email dan password Anda.");
      }

      const user = body.data;

      // Save user details locally in port 3003 sessionStorage
      sessionStorage.setItem("remat_user_id", user.id);
      sessionStorage.setItem("remat_user_name", user.name);
      sessionStorage.setItem("remat_user_role", user.role);
      sessionStorage.setItem("remat_user_email", user.email);

      // Perform cross-origin session transfer based on role
      if (user.role === "CONSUMER") {
        // Redirect back to Marketplace (port 3000)
        const targetUrl = `http://localhost:3000${redirect.startsWith("http") ? "/marketplace" : redirect}?session_id=${user.id}&session_name=${encodeURIComponent(user.name)}&session_role=CONSUMER&session_email=${encodeURIComponent(user.email)}`;
        window.location.href = targetUrl;
      } else if (user.role === "DISTRIBUTOR") {
        // Redirect to Distributor Dashboard (port 3002)
        const targetUrl = `http://localhost:3002/?session_id=${user.id}&session_name=${encodeURIComponent(user.name)}&session_role=DISTRIBUTOR`;
        window.location.href = targetUrl;
      } else if (user.role === "ADMIN") {
        // Redirect to Admin Panel (port 3001)
        const targetUrl = `http://localhost:3001/?session_id=${user.id}&session_name=${encodeURIComponent(user.name)}&session_role=ADMIN`;
        window.location.href = targetUrl;
      } else {
        setError("Role tidak dikenal. Silakan hubungi admin.");
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Selamat Datang Kembali</h2>
          <p className="text-sm text-white/70 mt-1">Masuk ke akun ReMat Anda</p>
        </div>

        {showLoginNotice && (
          <div className="flex items-center gap-3 p-4 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-200 text-sm mb-6">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <span>Silakan login terlebih dahulu untuk dapat melanjutkan aktivitas Anda.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm mb-6">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
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
                className="input-base w-full pl-10 h-11 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-emerald-600 focus:bg-white/15"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white">
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
                className="input-base w-full pl-10 h-11 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-emerald-600 focus:bg-white/15"
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
              </>
            )}
          </button>
        </form>

        {/* Bottom link */}
        <div className="mt-8 text-center text-sm text-white/70">
          Belum memiliki akun?{" "}
          <a href="http://localhost:3000/register" className="font-semibold text-white hover:text-emerald-400 hover:underline">
            Daftar Akun Baru
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div 
      className="h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12 relative overflow-hidden"
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

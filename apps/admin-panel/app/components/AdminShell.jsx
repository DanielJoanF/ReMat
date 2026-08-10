"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    href: "/verifikasi-penjualan",
    label: "Verifikasi Penjualan",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export default function AdminShell({ children, onRefresh }) {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("Administrator");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = sessionStorage.getItem("remat_user_name") || "Administrator";
      setAdminName(name);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "http://localhost:3000/?logout=true";
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md z-30 sticky top-0">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-300 hover:text-white p-1.5 rounded"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ReMat Logo" className="h-10 w-auto" />
          <div className="hidden sm:block">
            <p className="font-bold text-sm tracking-tight leading-tight">Admin Console</p>
            <p className="text-[10px] text-slate-400">Collaborative Industrial Zero-Waste Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-medium items-center gap-1.5">            
            {adminName}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          <Link href="/profile" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition">
            Profil
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-900 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded transition font-semibold"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-20 w-56 bg-slate-900 text-slate-100
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            flex flex-col border-r border-slate-800 pt-0 lg:pt-0
          `}
          style={{ top: "57px" }}
        >
          <nav className="flex-1 px-3 py-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">
              Menu Utama
            </p>
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                    ${active
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pb-4 border-t border-slate-800 pt-3">
            <p className="text-[10px] text-slate-600 text-center">ReMat Admin v2.0</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

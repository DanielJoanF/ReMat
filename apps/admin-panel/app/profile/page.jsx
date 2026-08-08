"use client";

import { ProfilePage } from "@remat/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminProfileRoute() {
  const [adminName, setAdminName] = useState("Administrator");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = sessionStorage.getItem("remat_user_name") || "Administrator";
      setAdminName(name);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Header Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex flex-col items-start gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" className="h-14 w-auto" />
          {/* <div>
            <h1 className="font-bold text-md tracking-tight leading-tight">Admin Moderation Console</h1>
            <p className="text-[10px] text-slate-400">Collaborative Industrial Zero-Waste Platform</p>
          </div> */}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-medium">
            Admin: {adminName}
          </span>
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition font-semibold">
            Kembali ke Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <ProfilePage />
      </div>
    </div>
  );
}

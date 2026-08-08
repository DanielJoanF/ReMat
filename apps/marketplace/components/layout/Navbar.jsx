"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  User,
  LogOut,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/search", label: "AI Search" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, setRole, logout, ROLES } = useAuth();

  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleBadgeColor = {
    GUEST: "bg-gray-100 text-gray-600",
    CONSUMER: "bg-blue-50 text-blue-700",
    DISTRIBUTOR: "bg-remat-green-light text-remat-green",
    ADMIN: "bg-red-50 text-red-700",
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 mr-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-remat-green bg-remat-green-light"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">            


            {/* Distributor Dashboard link */}
            {role === "DISTRIBUTOR" && (
              <Link href="/distributor" className="btn-ghost text-xs gap-1.5">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}

            {/* User menu or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-remat-green text-white text-xs font-bold flex items-center justify-center">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {role === "CONSUMER" && (
                      <Link href="/consumer/orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Package className="w-4 h-4" /> Pesanan Saya
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="w-4 h-4" /> Profil
                    </Link>
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="http://localhost:3003/"
                id="signin-btn"
                className="btn-primary text-sm px-4 py-2"
              >
                Masuk
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

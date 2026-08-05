"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ShoppingCart,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import useCartStore from "@/store/cart";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/search", label: "AI Search" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, setRole, ROLES } = useAuth();
  const totalItems = useCartStore((s) => s.getTotalItems());

  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleLabel = {
    GUEST: "Tamu",
    CONSUMER: "Konsumen",
    DISTRIBUTOR: "Distributor",
    ADMIN: "Admin",
  };

  const roleBadgeColor = {
    GUEST: "bg-gray-100 text-gray-600",
    CONSUMER: "bg-blue-50 text-blue-700",
    DISTRIBUTOR: "bg-remat-green-light text-remat-green",
    ADMIN: "bg-red-50 text-red-700",
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
            <div className="w-8 h-8 bg-remat-green rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              Re<span className="text-remat-green">Mat</span>
            </span>
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
            {/* Dev: Role Switcher */}
            <div className="relative">
              <button
                id="role-switcher-btn"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${roleBadgeColor[role]} border-current/20 hover:opacity-80 transition-opacity`}
                title="Dev: Ganti Role"
              >
                <Settings className="w-3 h-3" />
                {roleLabel[role]}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showRoleSwitcher && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                  <p className="px-3 py-1 text-xs text-gray-400 font-medium">Dev: Ganti Role</p>
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      id={`role-${r.toLowerCase()}`}
                      onClick={() => { setRole(r); setShowRoleSwitcher(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${role === r ? "text-remat-green font-semibold" : "text-gray-700"}`}
                    >
                      {roleLabel[r]}
                      {role === r && <span className="w-2 h-2 rounded-full bg-remat-green" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart (Consumer only) */}
            {role === "CONSUMER" && (
              <Link href="/consumer/cart" id="cart-btn" className="relative p-2 text-gray-600 hover:text-remat-green hover:bg-remat-green-light rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-remat-green text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>
            )}

            {/* Alerts (Consumer only) */}
            {role === "CONSUMER" && (
              <Link href="/consumer/alerts" className="p-2 text-gray-600 hover:text-remat-green hover:bg-remat-green-light rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </Link>
            )}

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
                      onClick={() => { setRole("GUEST"); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="signin-btn"
                onClick={() => { setRole("CONSUMER"); }}
                className="btn-primary text-sm px-4 py-2"
              >
                Masuk
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

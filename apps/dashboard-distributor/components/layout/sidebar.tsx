'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  ShoppingCart,
  BarChart3,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Recycle,
  Plus,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Avatar } from '@/components/ui/avatar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Kelola Material', href: '/materials', icon: Box },
  { label: 'Pesanan', href: '/orders', icon: ShoppingCart },
  { label: 'Laporan Sirkular', href: '/circular', icon: BarChart3 },
  { label: 'Profil Toko', href: '/profile', icon: User },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ── Profile header + brand ──────────────────────────────────────────────
function BrandHeader({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1.5 px-4 py-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
      <div>
        <p className="text-[11px] font-semibold text-[#475569] leading-tight">Distributor Dashboard</p>
      </div>
    </div>
  );
}

// ── Profile card (Profile Toko) ────────────────────────────────────────
export function ProfileCard({ collapsed }: { collapsed: boolean }) {
  const { user, isReady } = useAuth();

  // Guard: only render user-dependent content after auth resolves (client-side),
  // so SSR and hydration produce identical markup.
  if (!isReady) return null;

  const name = user?.name || 'ReMat Distributor';
  const role = 'Industrial Waste Hub';

  if (collapsed) {
    return (
      <Link href="/profile" className="flex flex-col items-center gap-2 px-2 pb-4 transition-all" title="Profil Toko">
        <Avatar name={name} size="lg" className="ring-2 ring-[#DBEAFE] hover:ring-[#1D4ED8]" />
      </Link>
    );
  }

  return (
    <Link href="/profile" className="block mx-3 mb-4">
      <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 shadow-sm hover:bg-slate-50 transition cursor-pointer">
        <div className="relative flex-shrink-0">
          <Avatar name={name} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#065F46] ring-2 ring-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-[#0F172A]">{name}</p>
          <p className="truncate text-[11px] text-[#64748B]">{role}</p>
        </div>
      </div>
    </Link>
  );
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Post Material CTA (top of navigation)
  const postMaterialCta = (
    <Link
      href="/materials/create"
      onClick={() => setMobileOpen(false)}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition-all bg-[#065F46] hover:bg-[#047857] shadow-sm active:scale-[0.98]',
        collapsed && 'px-1 text-[10px]'
      )}
      title={collapsed ? 'Tambah Material' : 'Tambah Material'}
    >
      <Plus className={cn('h-4 w-4', collapsed && 'h-5 w-5')} />
      {!collapsed && 'Tambah Material'}
    </Link>
  );

  const navContent = (
    <div className="flex flex-col gap-1 px-3 mt-2">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-[#DBEAFE] text-[#1D4ED8] font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className={cn('h-[18px] w-[18px] flex-shrink-0', active ? 'text-[#1D4ED8]' : 'text-[#A3AAB5]')} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );

  const footerLinks = (
    <div className="space-y-1 px-3 pb-2">
      <button
              type="button"
              onClick={() => window.open('mailto:support@remat.id', '_blank')}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? 'Bantuan' : undefined}
            >
              <HelpCircle className="h-[18px] w-[18px] text-[#A3AAB5]" />
              {!collapsed && <span>Bantuan</span>}
            </button>
      <button
        onClick={() => { logout(); }}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? 'Keluar' : undefined}
      >
        <LogOut className="h-[18px] w-[18px] text-[#A3AAB5]" />
        {!collapsed && <span>Keluar</span>}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
      >
        <Menu className="h-5 w-5 text-on-surface" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Both sidebars share the same content, wrapped for reuse */}
      {[
        {
          key: 'mobile',
          className: cn(
            'fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col transition-transform duration-300 lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          ),
          close: (
            <button onClick={() => setMobileOpen(false)} className="rounded p-1 hover:bg-surface-container-low">
              <X className="h-4 w-4 text-on-surface-variant" />
            </button>
          ),
        },
        {
          key: 'desktop',
          className: cn(
            'hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-[#E2E8F0] transition-all duration-300',
            collapsed ? 'w-[72px]' : 'w-[240px]'
          ),
          close: null,
        },
        ].map(({ key, className, close }) => (
          <aside key={key} className={className}>
            <div className="flex items-center justify-between">
              <BrandHeader collapsed={collapsed && key === 'desktop'} />
              {close}
            </div>

            <ProfileCard collapsed={collapsed && key === 'desktop'} />

            <div className={cn('px-3', collapsed && key === 'desktop' && 'px-2')}>
              {postMaterialCta}
            </div>

            {navContent}

            <div className="mt-auto border-t border-[#E2E8F0] pt-2">
              {footerLinks}

              {/* Collapse toggle (desktop only) */}
              {key === 'desktop' && (
                <button
                  onClick={onToggleCollapse}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-on-surface-variant hover:bg-surface-container-low',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
                  {!collapsed && <span>Tutup Sidebar</span>}
                </button>
              )}
            </div>
          </aside>
        ))}
    </>
  );
}
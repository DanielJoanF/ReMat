'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './notification-bell';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Ringkasan', subtitle: 'Ringkasan performa & aktivitas pengelolaan limbah Anda.' },
  '/': { title: 'Ringkasan', subtitle: 'Ringkasan performa & aktivitas pengelolaan limbah Anda.' },
  '/materials': { title: 'Kelola Material', subtitle: 'Kelola stok material daur ulang Anda.' },
  '/materials/create': { title: 'Tambah Material', subtitle: 'Isi informasi material baru.' },
  '/orders': { title: 'Pesanan', subtitle: 'Pantau dan kelola semua transaksi penjualan material Anda.' },
  '/circular': { title: 'Laporan Sirkular', subtitle: 'Pantau dampak ekonomi sirkular dari aktivitas daur ulang material.' },
  '/alerts': { title: 'Alert', subtitle: 'Kelola notifikasi dan alert terkait aktivitas Anda.' },
  '/profile': { title: 'Profil Toko', subtitle: 'Kelola informasi profil produsen dan toko Anda.' },
};

// Route resolver: longest-prefix match so nested routes (detail, edit, documents)
// fall back to their section, never to the dashboard.
const ROUTE_META: Array<[string, { title: string; subtitle: string }]> = [
  ['/materials/create', pageMeta['/materials/create']],
  ['/materials', pageMeta['/materials']],
  ['/orders', pageMeta['/orders']],
  ['/circular', pageMeta['/circular']],
  ['/profile', pageMeta['/profile']],
];

function resolveMeta(pathname: string): { title: string; subtitle: string } {
  // Sub-routes of materials keep their specific titles (edit, documents)
  if (/\/materials\/[^/]+\/edit/.test(pathname)) {
    return { title: 'Edit Material', subtitle: 'Perbarui informasi material.' };
  }
  if (/\/materials\/[^/]+\/documents/.test(pathname)) {
    return { title: 'Dokumen Material', subtitle: 'Kelola dokumen dan foto material.' };
  }
  for (const [prefix, meta] of ROUTE_META) {
    if (pathname === prefix || pathname.startsWith(prefix === '/' ? '/' : `${prefix}/`)) {
      return meta;
    }
  }
  return pageMeta['/dashboard'];
}

function HeaderInner() {
  const pathname = usePathname();

  const meta = resolveMeta(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-5 lg:px-8">
      <div className="ml-12 lg:ml-0">
        <h1 className="text-[22px] font-semibold text-[#0F172A] leading-tight">{meta.title}</h1>
        <p className="hidden sm:block text-[13px] text-[#64748B] mt-0.5">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
      </div>
    </header>
  );
}

export function Header() {
  return (
    <Suspense>
      <HeaderInner />
    </Suspense>
  );
}
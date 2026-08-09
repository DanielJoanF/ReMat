'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Ringkasan', subtitle: 'Ringkasan performa & aktivitas pengelolaan limbah Anda.' },
  '/': { title: 'Ringkasan', subtitle: 'Ringkasan performa & aktivitas pengelolaan limbah Anda.' },
  '/materials': { title: 'Kelola Material', subtitle: 'Kelola stok material daur ulang Anda.' },
  '/materials/create': { title: 'Tambah Material', subtitle: 'Isi informasi material baru.' },
  '/orders': { title: 'Pesanan', subtitle: 'Pantau dan kelola semua transaksi penjualan material Anda.' },
  '/circular': { title: 'Laporan Sirkular', subtitle: 'Pantau dampak ekonomi sirkular dari aktivitas daur ulang material.' },
  '/alerts': { title: 'Alert', subtitle: 'Kelola notifikasi dan alert terkait aktivitas Anda.' },
  '/settings': { title: 'Pengaturan', subtitle: 'Kelola preferensi akun dan notifikasi distributor Anda.' },
  '/profile': { title: 'Profil Toko', subtitle: 'Kelola informasi profil distributor dan toko Anda.' },
};

// Route resolver: longest-prefix match so nested routes (detail, edit, documents)
// fall back to their section, never to the dashboard.
const ROUTE_META: Array<[string, { title: string; subtitle: string }]> = [
  ['/materials/create', pageMeta['/materials/create']],
  ['/materials', pageMeta['/materials']],
  ['/orders', pageMeta['/orders']],
  ['/circular', pageMeta['/circular']],
  ['/alerts', pageMeta['/alerts']],
  ['/settings', pageMeta['/settings']],
  ['/profile', pageMeta['/profile']],
  ['/', pageMeta['/']],
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

// Pages whose list is searchable — the header search writes a query param
const SEARCHABLE: Record<string, string> = {
  '/materials': 'search',
  '/orders': 'search',
};

function HeaderInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  const meta = resolveMeta(pathname);

  const searchableKey = SEARCHABLE[pathname];

  const onSearchChange = (value: string) => {
    setQuery(value);
    if (!searchableKey) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set(searchableKey, value.trim());
    else params.delete(searchableKey);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-5 lg:px-8">
      <div className="ml-12 lg:ml-0">
        <h1 className="text-[22px] font-semibold text-[#0F172A] leading-tight">{meta.title}</h1>
        <p className="hidden sm:block text-[13px] text-[#64748B] mt-0.5">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {searchableKey && (
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3AAB5]" />
              <input
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                type="text"
                placeholder="Cari..."
                className="w-64 rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#065F46] focus:outline-none focus:ring-1 focus:ring-[#065F46]"
              />
            </div>
          </div>
        )}
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
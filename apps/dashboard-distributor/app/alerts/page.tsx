'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Halaman alert (khusus CONSUMER) tidak dipakai di dashboard distributor.
// Menu "Pengaturan" kini mengarah ke /settings — redirect ke sana.
export default function AlertsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings');
  }, [router]);

  return null;
}
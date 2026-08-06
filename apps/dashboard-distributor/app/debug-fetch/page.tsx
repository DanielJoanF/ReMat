'use client';

import { useEffect, useState } from 'react';
import { getData } from '@/lib/api-client';

export default function DebugFetchPage() {
  const [raw, setRaw] = useState<string>('loading...');

  useEffect(() => {
    (async () => {
      try {
        const res = await getData<{ data: unknown[]; pagination?: unknown }>('/materials/my', { page: 1, limit: 10 });
        setRaw(`OK count=${res.data?.length ?? '?'} pagination=${JSON.stringify(res.pagination ?? null)}`);
      } catch (e) {
        setRaw(`ERR: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h2>Debug Fetch /materials/my</h2>
      <pre>{raw}</pre>
    </div>
  );
}
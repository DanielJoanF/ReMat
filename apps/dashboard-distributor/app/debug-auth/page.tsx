'use client';

import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const [values, setValues] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setValues({
      'x-user-id': localStorage.getItem('x-user-id'),
      'x-user-role': localStorage.getItem('x-user-role'),
      'x-user-name': localStorage.getItem('x-user-name'),
    });
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h2>Debug Auth (origin 3002)</h2>
      <pre>{JSON.stringify(values, null, 2)}</pre>
    </div>
  );
}
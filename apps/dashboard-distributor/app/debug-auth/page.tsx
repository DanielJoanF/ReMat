'use client';

import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const [values, setValues] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setValues({
      'sessionStorage:x-user-id': sessionStorage.getItem('x-user-id'),
      'sessionStorage:x-user-role': sessionStorage.getItem('x-user-role'),
      'sessionStorage:x-user-name': sessionStorage.getItem('x-user-name'),
      'localStorage:x-user-id': localStorage.getItem('x-user-id'),
      'localStorage:x-user-role': localStorage.getItem('x-user-role'),
      'localStorage:x-user-name': localStorage.getItem('x-user-name'),
    });
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h2>Debug Auth (origin 3002)</h2>
      <pre>{JSON.stringify(values, null, 2)}</pre>
    </div>
  );
}
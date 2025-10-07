import React from 'react';

/**
 * Layout untuk halaman pre-test.
 * Karena halaman pre-test sudah mandiri, layout ini hanya berfungsi
 * untuk me-render children (page.tsx) tanpa menambahkan elemen UI tambahan.
 */
export default function PreTestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
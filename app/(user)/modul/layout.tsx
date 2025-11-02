"use client"

/**
 * Layout spesifik untuk halaman modul.
 * Hanya membungkus children tanpa menambahkan elemen UI tambahan,
 * karena UI utama (Sidebar, Navbar) sudah disediakan oleh layout (user).
 */
export default function ModulLayout({ children }: { children: React.ReactNode }) {
  // UIProvider dan struktur utama sekarang ada di app/(user)/layout.tsx
  return <>{children}</>;
}
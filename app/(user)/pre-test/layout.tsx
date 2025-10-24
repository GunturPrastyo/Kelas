"use client"

import { UIProvider } from "@/context/UIContext";

/**
 * Layout untuk halaman pre-test.
 * Dibungkus dengan UIProvider agar tema (dark/light mode) konsisten
 * dengan bagian lain dari aplikasi.
 */
export default function PreTestLayout({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <div className="dark:bg-gray-900">
        {children}
      </div>
    </UIProvider>
  );
}
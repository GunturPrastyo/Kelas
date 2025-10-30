"use client"

import { UIProvider, useUI } from "@/context/UIContext"
import Navbar from "@/components/navbarUser"
import Sidebar from "@/components/sidebarUser"

/**
 * Layout untuk halaman profil pengguna.
 * Membungkus konten dengan UIProvider dan layout dasar (Sidebar, Navbar).
 */
function ProfileContent({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleMobileDrawer } = useUI()

  return (
    <div
      className="font-poppins bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex min-h-screen"      
      suppressHydrationWarning={true}
    >
      <Sidebar />

      {/* Mobile Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileDrawer}
          aria-hidden="true"
        ></div>
      )}

      <div
        id="main-content"
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <Navbar />
        <main
          id="main-container"
          className={`overflow-y-auto flex-1 w-full transition-all duration-300 ease-in-out`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <UIProvider><ProfileContent>{children}</ProfileContent></UIProvider>
}
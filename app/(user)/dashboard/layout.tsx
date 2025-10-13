"use client";

import { UIProvider, useUI } from "@/context/UIContext";
import Navbar from "@/components/navbarUser";
import Sidebar from "@/components/sidebarUser";
import AuthGuard from "@/components/AuthGuard";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleMobileDrawer } = useUI();

  return (
    <div className="font-poppins bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Overlay saat mode mobile */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileDrawer}
        ></div>
      )}

      {/* Konten utama */}
      <div
        id="main-content"
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <Navbar />

        {/* Isi halaman */}
        <main
          id="main-container"
          className={`p-4 sm:p-6 space-y-6 sm:space-y-8 mx-auto overflow-y-auto flex-1 w-full transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? "sm:max-w-full" : "sm:max-w-7xl"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <UIProvider>
        <DashboardContent>{children}</DashboardContent>
      </UIProvider>
    </AuthGuard>
  );
}
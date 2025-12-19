"use client";

import React from "react";
import { UIProvider, useUI } from "@/context/UIContext";
import Navbar from "@/components/NavbarAdmin";
import Sidebar from "@/components/SidebarAdmin";
import { AlertProvider } from "@/context/AlertContext";
import AlertDialog from "@/components/AlertDialog";
import AuthGuard from "@/components/AuthGuard";


function AdminPagesContent({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleMobileDrawer } = useUI();

  return (
    <div className="font-poppins bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex min-h-screen">
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
          className="p-4 sm:p-6 overflow-y-auto flex-1 w-full"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Layout utama untuk seluruh area admin.
 * Membungkus semua halaman admin dengan AuthGuard, UIProvider, dan AlertProvider.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <UIProvider>
        <AlertProvider>
          <AdminPagesContent>{children}</AdminPagesContent>
          <AlertDialog />
        </AlertProvider>
      </UIProvider>
    </AuthGuard>
  );
}
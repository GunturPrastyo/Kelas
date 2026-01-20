"use client";

import AuthGuard from "@/components/AuthGuard";
import NavbarUser from "@/components/navbarUser";
import SidebarUser from "@/components/sidebarUser";
import { UIProvider, useUI } from "@/context/UIContext";
import { AlertProvider } from "@/context/AlertContext";
import AlertDialog from "@/components/AlertDialog";
import { useEffect } from "react";
import { authFetch } from "@/lib/authFetch";

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleMobileDrawer } = useUI();

  // --- LOGIKA BARU: Heartbeat User Online ---
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        // Kirim sinyal 'heartbeat' ke backend
        await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testType: "heartbeat" }),
        });
      } catch (error) {
        // Silent error agar tidak mengganggu user
        console.error("Gagal mengirim heartbeat aktivitas:", error);
      }
    };

    // Kirim segera saat halaman dimuat
    sendHeartbeat();

    // Kirim ulang setiap 5 menit (300.000 ms)
    // Backend menghitung user online berdasarkan aktivitas 10 menit terakhir,
    // jadi interval 5 menit aman untuk menjaga status tetap online.
    const interval = setInterval(sendHeartbeat, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-poppins bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex min-h-screen">
      <SidebarUser />

      {/* Mobile Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileDrawer}
          aria-hidden="true"
        />
      )}

      <div
        id="main-content"
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <NavbarUser />
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

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <UIProvider>
        <AlertProvider>
          <UserLayoutContent>{children}</UserLayoutContent>
          <AlertDialog />
        </AlertProvider>
      </UIProvider>
    </AuthGuard>
  );
}
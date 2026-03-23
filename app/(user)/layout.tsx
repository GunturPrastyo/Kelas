"use client";

import AuthGuard from "@/components/AuthGuard";
import NavbarUser from "@/components/navbarUser";
import SidebarUser from "@/components/sidebarUser";
import { UIProvider, useUI } from "@/context/UIContext";
import { AlertProvider } from "@/context/AlertContext";
import AlertDialog from "@/components/AlertDialog";

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useUI();

  return (
    <div className="font-poppins bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex min-h-screen">
      <SidebarUser />

      <div
        id="main-content"
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden pb-16 md:pb-0 ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-48 "
        }`}
      >
        <NavbarUser />
        <main
          id="main-container"
          className="p-4 sm:p-6 space-y-6 sm:space-y-8 mx-auto overflow-y-auto flex-1 w-full transition-all duration-300 ease-in-out sm:max-w-full"
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
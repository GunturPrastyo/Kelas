"use client"

import Link from "next/link"
import { useEffect } from "react"
import { usePathname, useRouter } from 'next/navigation';
import { useUI } from "@/context/UIContext"
import { LogOut } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "/dashboard.png", alt: "Dashboard Icon" },
    { href: "/modul", label: "Modul", icon: "/modules.png", alt: "Modul Icon" },
    { href: "/analitik-belajar", label: "Analitik", icon: "/analitik.png", alt: "Analitik Icon" },
    { href: "/profil", label: "Profil", icon: "/profile.png", alt: "Profil Icon" },
];

export default function Sidebar() {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleMobileDrawer, toggleSidebar } = useUI();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
   
    if (window.innerWidth >= 768 && !isSidebarCollapsed) {
    
      toggleSidebar();
    }
  }, []); 

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Gagal melakukan logout di server:", error);
    } finally {
    
      localStorage.removeItem("user");
      localStorage.removeItem("token"); 
      router.push("/login");
    }
  };

  return (
    <aside
      id="sidebar"
      className={`fixed z-50 transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
        /* Mobile (Bottom Nav) */
        bottom-0 left-0 w-full h-16 border-t flex flex-row items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]
        /* Desktop (Sidebar) */
        md:top-0 md:h-screen md:border-t-0 md:border-r md:flex-col md:justify-start md:px-0 md:pb-0
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
    >
      {/* Sidebar Header (Desktop) */}
      <div className={`hidden md:flex px-4 h-20 items-center gap-3 flex-shrink-0 ${isSidebarCollapsed ? 'justify-center ml-4' : 'justify-start'}`}>
        <button
          id="sidebar-toggle"
          type="button"
          className="p-2 text-gray-500 rounded-lg hidden md:block hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Toggle sidebar</span>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div id="sidebar-title-container" className="flex-1 flex items-center gap-4 overflow-hidden" >
          {!isSidebarCollapsed && (
            <img id="sidebar-title" src="/logo.webp" alt="KELAS Logo" className="ml-4 sm:ml-2 h-10 sm:h-8 w-auto transition-opacity duration-300" />
          )}
        </div>
      </div>

      {/* Navigasi Sidebar */}
      <nav className="flex-1 flex flex-row md:flex-col w-full md:w-auto md:space-y-2 md:px-4 md:overflow-y-auto justify-around md:justify-start items-center md:items-stretch h-full md:h-auto">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 p-2 md:p-3 rounded-xl md:rounded-lg transition-all duration-300 ease-out ${active ? 'text-blue-600 dark:text-blue-400 md:bg-blue-100 md:dark:bg-gray-700 md:text-blue-600 md:dark:text-white max-md:-translate-y-2 max-md:scale-110' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 md:hover:bg-gray-200/50 md:dark:hover:bg-gray-700 max-md:translate-y-0 max-md:scale-100'}`}
            >
              <img src={link.icon} alt={link.alt} className={`flex-shrink-0 transition-all duration-300 w-6 h-6 md:w-8 md:h-auto ${active ? 'opacity-100 drop-shadow-md' : 'opacity-70'}`} />
              <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 text-[10px] md:text-sm font-medium ${isSidebarCollapsed ? 'md:opacity-0 md:hidden' : 'md:opacity-100'} ${active ? 'font-bold md:font-semibold' : ''}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Tombol Logout (Desktop) */}
      <div className="hidden md:block px-4 py-4 mt-auto">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 p-3 rounded-lg w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={28} className="flex-shrink-0" />
          <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
            Keluar
          </span>
        </button>
      </div>
    </aside>
  )
}

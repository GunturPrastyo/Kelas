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
  
    { href: "/analitik-belajar", label: "Analitik Belajar", icon: "/analitik.png", alt: "Analitik Icon" },
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
      className={`fixed top-0 left-0 z-50 h-screen bg-slate-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
    >
      {/* Sidebar Header */}
      <div className={`px-4 h-20 flex items-center gap-3 flex-shrink-0 ${isSidebarCollapsed ? 'justify-center ml-4' : 'justify-start'}`}>
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
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link flex items-center gap-4 p-3 rounded-lg transition-colors ${active ? 'bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-white' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
            >
              <img src={link.icon} alt={link.alt} className="w-8 h-auto flex-shrink-0" />
              <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'} ${active ? 'text-blue-600 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Tombol Logout */}
      <div className="px-4 py-4 mt-auto">
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

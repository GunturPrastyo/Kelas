"use client"

import Link from "next/link"
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation';
import { useUI } from "@/context/UIContext"
import { LogOut } from "lucide-react";

const adminNavLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "/dashboard.png", alt: "Dashboard Icon" },
  { href: "/admin/modul", label: "Modul dan Tes", icon: "/modules.png", alt: "Modul Icon" },
  { href: "/admin/manajemen-pengguna", label: "Manajemen Pengguna", icon: "/profile.png", alt: "Users Icon" },
  { href: "/admin/analitik", label: "Analitik", icon: "/analitik.png", alt: "Analitik Icon" },
  // { href: "/admin/profil", label: "Profil", icon: "/profile.png", alt: "Profil Icon" },
];

export default function SidebarAdmin() {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleSidebar } = useUI()
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include", // Penting untuk mengirim cookie
      });
    } catch (error) {
      console.error("Gagal melakukan logout di server:", error);
    } finally {
      // Hapus data sisi klien apa pun yang terjadi
      localStorage.removeItem("user");
      localStorage.removeItem("token"); // Hapus sisa token jika masih ada
      router.push("/login");
    }
  };

  return (
    <aside
      id="sidebar-admin"
      className={`fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
    >
      {/* Sidebar Header */}
      <div className={`px-4 h-20 flex items-center gap-3 flex-shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
        <button
          type="button"
          className="p-2 text-gray-500 rounded-lg hidden md:block hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Toggle sidebar</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1 flex items-center gap-4 overflow-hidden" >
          {!isSidebarCollapsed && (
            <Image src="/logo.png" alt="KELAS Logo" width={150} height={40} className="h-10 w-auto transition-opacity duration-300" priority />
          )}
        </div>
      </div>

      {/* Navigasi Sidebar */}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
        {adminNavLinks.map((link) => {
          const active = isActive(link.href);
          return (
          <Link key={link.href} href={link.href} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${active ? 'bg-blue-50 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Image src={link.icon} alt={link.alt} width={28} height={28} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 text-sm ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'} ${active ? 'text-blue-600 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
              {link.label}
            </span>
          </Link>
        )})}
      </nav>

      {/* Tombol Logout */}
      <div className="px-4 py-4 mt-auto">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 p-3 rounded-lg w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={28} className="flex-shrink-0" />
          <span className={`whitespace-nowrap transition-opacity duration-300 text-sm ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
            Keluar
          </span>
        </button>
      </div>
    </aside>
  )
}
"use client"

import Link from "next/link"
import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { useUI } from "@/context/UIContext"
import { LogOut } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

const adminNavLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "/dashboard.png", alt: "Dashboard Icon" },
  { href: "/admin/modul", label: "Modul", icon: "/modules.png", alt: "Modul Icon" },
  { href: "/admin/manajemen-pengguna", label: "Pengguna", icon: "/profile.png", alt: "Users Icon" },
  { href: "/admin/analitik", label: "Analitik", icon: "/analitik.png", alt: "Analitik Icon" },
  // { href: "/admin/profil", label: "Profil", icon: "/profile.png", alt: "Profil Icon" },
];

interface User {
  role: 'user' | 'admin' | 'super_admin';
}

export default function SidebarAdmin() {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleSidebar } = useUI()
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      try {
        const parsedUser: User = JSON.parse(userRaw);
        setUser(parsedUser);
      } catch (e) {
        console.error("Gagal mengurai pengguna dari localStorage", e);
      }
    }
  }, []);

  const visibleNavLinks = useMemo(() => {
    if (!user) {
      return [];
    }
    return adminNavLinks;
  }, [user]);

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
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
      // Hapus data sisi klien apa pun yang terjadi
      localStorage.removeItem("user");
      localStorage.removeItem("token"); // Hapus sisa token jika masih ada
      router.push("/login");
    }
  };

  return (
    <aside
      id="sidebar-admin"
      className={`fixed z-50 transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
        bottom-0 left-0 w-full h-16 border-t flex flex-row items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]
        md:top-0 md:h-screen md:border-t-0 md:border-r md:flex-col md:justify-start md:px-0 md:pb-0
        ${mounted ? (isSidebarCollapsed ? 'md:w-20' : 'md:w-64') : 'md:w-64'}`}
    >
      {/* Sidebar Header (Desktop) */}
      <div className={`hidden md:flex px-4 h-20 items-center gap-3 flex-shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`} suppressHydrationWarning>
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
        <div className="flex-1 flex items-center gap-4 overflow-hidden" suppressHydrationWarning>
          {mounted && !isSidebarCollapsed && (
            <img src="/logo.webp" alt="KELAS Logo" className="h-10 w-auto transition-opacity duration-300" />
          )}
        </div>
      </div>

      {/* Navigasi Sidebar */}
      <nav className="flex-1 flex flex-row md:flex-col w-full md:w-auto md:space-y-2 md:px-4 md:overflow-y-auto justify-around md:justify-start items-center md:items-stretch h-full md:h-auto">
        {visibleNavLinks.map((link) => {
          const active = isActive(link.href);
          return (
          <Link key={link.href} href={link.href} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 p-2 md:p-3 rounded-xl md:rounded-lg transition-colors ${active ? 'text-blue-600 dark:text-blue-400 md:bg-blue-50 md:dark:bg-gray-700 md:text-blue-600 md:dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 md:hover:bg-gray-100 md:dark:hover:bg-gray-700'}`}>
            <img src={link.icon} alt={link.alt} className={`flex-shrink-0 transition-opacity w-5 h-5 md:w-7 md:h-7 ${active ? 'opacity-100' : 'opacity-70'}`} />
            <span className={`whitespace-nowrap transition-opacity duration-300 text-[10px] md:text-sm font-medium ${isSidebarCollapsed ? 'md:opacity-0 md:hidden' : 'md:opacity-100'} ${active ? 'font-bold md:font-semibold' : ''}`}>
              {link.label}
            </span>
          </Link>
        )})}
      </nav>

      {/* Tombol Logout (Desktop) */}
      <div className="hidden md:block px-4 py-4 mt-auto" suppressHydrationWarning>
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
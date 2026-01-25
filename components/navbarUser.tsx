"use client"

import { useState, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useUI } from "@/context/UIContext"
import NotificationBell from "./NotificationBell" // Import komponen notifikasi
import UserDropdown from "./UserDropdown" // Import komponen UserDropdown
import GlobalSearch from "./GlobalSearch"; // 1. Impor komponen GlobalSearch
import { Sun, Cloud, Sunset, Moon } from "lucide-react"

interface User {
  name: string;
}

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      return { text: "Selamat Pagi", icon: <Sun className="w-5 h-5 text-amber-500" /> };
    }
    if (hour >= 11 && hour < 15) {
      return { text: "Selamat Siang", icon: <Cloud className="w-5 h-5 text-sky-500" /> };
    }
    if (hour >= 15 && hour < 19) {
      return { text: "Selamat Sore", icon: <Sunset className="w-5 h-5 text-orange-500" /> };
    }
    return { text: "Selamat Malam", icon: <Moon className="w-5 h-5 text-indigo-500" /> };
  }, []);


  const { theme, setTheme } = useTheme()
  const { isSidebarCollapsed, toggleMobileDrawer, searchQuery, setSearchQuery } = useUI()
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      const parsedUser = JSON.parse(userRaw);
      setUser(parsedUser);
    }
  }, []);

  // Logika untuk placeholder search bar
  const getPlaceholder = () => {
    if (pathname === '/admin/modul') return "Cari modul...";
    if (/^\/admin\/modul\/[^/]+$/.test(pathname)) return "Cari topik...";
    return isAdminPage ? "Search di halaman admin..." : "Mau belajar apa hari ini?";
  }

  return (
    <header
      suppressHydrationWarning
      className={`bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/80 dark:border-gray-700/80 p-4 flex justify-between items-center backdrop-blur-sm fixed w-full max-w-full top-0 right-0 z-40 gap-4 h-20 mb-10 transition-all duration-300 ${
        isSidebarCollapsed ? "w-full p-0 sm:pl-25" : "w-full sm:w-10/12"
      }`}
    >
      {/* Kiri */}
      <div id="header-left" className="flex items-center flex-shrink-0" suppressHydrationWarning>
        {/* Tombol Mobile Drawer */}
        <button
          id="mobile-drawer-toggle"
          type="button"
          className=" text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          onClick={toggleMobileDrawer}
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div id="header-title-placeholder" suppressHydrationWarning>
          {isSidebarCollapsed && (
            <img src="/logo.webp" alt="KELAS Logo" width={150} height={40} className="h-8 w-auto ml-2" />
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 flex justify-center " suppressHydrationWarning>
        <GlobalSearch />
      </div>

      {/* Kanan */}
      <div className="flex items-center gap-0 ms:gap-5 flex-shrink-0" suppressHydrationWarning>
     

        {/* Icon group (Theme + Notifikasi) */}
        <div className="flex items-center gap-2 sm:gap-4" suppressHydrationWarning>
          {mounted && (
            <button
              id="theme-toggle"
              type="button"
              className="hidden sm:block text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                // Ikon Matahari (Light Mode)
                <svg id="theme-toggle-light-icon" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              ) : (
                // Ikon Bulan (Dark Mode)
                <svg id="theme-toggle-dark-icon" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
              )}
            </button>
          )}

          {/* Ganti notifikasi placeholder dengan komponen fungsional */}
          <NotificationBell />
             {/* Sambutan Pengguna */}
          {mounted && user && (
            <div className="hidden md:flex items-center gap-2">
              {greeting.icon}
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {greeting.text}, <span className="font-semibold">{user.name.split(" ").slice(0, 2).join(" ")}!</span>
              </p>
            </div>
          )}
        </div>

        <UserDropdown />
      </div>
    </header>
  )
}

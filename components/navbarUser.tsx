"use client"

import { useState, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useUI } from "@/context/UIContext"
import Image from "next/image"
import NotificationBell from "./NotificationBell" // Import komponen notifikasi
import UserDropdown from "./UserDropdown" // Import komponen UserDropdown
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
      className={`bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/80 dark:border-gray-700/80 p-4 flex flex-wrap md:flex-nowrap justify-between items-center backdrop-blur-sm fixed max-w-full top-0 right-0 z-40 gap-3 h-20 mb-10 transition-all duration-300 ${
        isSidebarCollapsed ? "w-full p-0 sm:pl-25" : "w-full sm:w-10/12"
      }`}
    >
      {/* Kiri */}
      <div id="header-left" className="flex items-center gap-4 left-0 flex-shrink-0">
        {/* Tombol Mobile Drawer */}
        <button
          id="mobile-drawer-toggle"
          type="button"
          className="p-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          onClick={toggleMobileDrawer}
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div id="header-title-placeholder">
          {isSidebarCollapsed && (
            <Image src="/logo.png" alt="KELAS Logo" width={150} height={40} className="h-10 w-auto" />
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form className="hidden md:flex order-3 md:order-2 w-full md:w-auto flex-grow max-w-full md:max-w-4xl mx-auto">
        <label htmlFor="navbar-search" className="sr-only">Search</label>
        <div className="relative w-full">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
            </svg>
          </div>
          <input
            type="text"
            id="navbar-search"
            className="bg-gray-100 border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-800"
            placeholder={getPlaceholder()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
        </div>
        {/* <button type="submit" className="hidden sm:flex justify-center items-center py-2.5 px-3 ms-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
          <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
          </svg>
        </button> */}
      </form>

      {/* Kanan */}
      <div className="flex items-center gap-3 md:gap-5 order-2 md:order-3 flex-shrink-0">
     

        {/* Icon group (Theme + Notifikasi) */}
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              id="theme-toggle"
              type="button"
              className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5"
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
        {user && (
          <p className="hidden md:block text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {" "}
            {greeting.text}, <span className="font-semibold">{user.name.split(" ").slice(0, 2).join(" ")}!</span>
          </p>
        )}
        </div>

        <UserDropdown />
      </div>
    </header>
  )
}

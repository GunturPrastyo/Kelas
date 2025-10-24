"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useUI } from "@/context/UIContext"

interface User {
  name: string;
  avatar?: string;
}

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { isSidebarCollapsed, toggleMobileDrawer, searchQuery, setSearchQuery } = useUI()
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    setMounted(true);
  }, []);

  // Logika untuk placeholder search bar
  const getPlaceholder = () => {
    if (pathname === '/admin/modul') return "Cari modul...";
    if (/^\/admin\/modul\/[^/]+$/.test(pathname)) return "Cari topik...";
    return isAdminPage ? "Search di halaman admin..." : "Mau belajar apa hari ini?";
  }

  return (
    <header
      className="bg-white/80 dark:bg-gray-800/80 shadow-md p-4 flex flex-wrap md:flex-nowrap justify-between items-center backdrop-blur-sm sticky top-0 z-40 gap-3"
    >
      {/* Kiri */}
      <div id="header-left" className="flex items-center gap-4 flex-shrink-0">
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
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-800"
            placeholder={getPlaceholder()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="hidden sm:flex justify-center items-center py-2.5 px-3 ms-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
          <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
          </svg>
        </button>
      </form>

      {/* Kanan */}
      <div className="flex items-center gap-5 order-2 md:order-3 flex-shrink-0">
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

          {/* Notifikasi */}
          <div className="relative">
            <button id="notification-toggle" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" className="w-6 h-6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span id="notification-badge" className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">3</span>
            </button>
          </div>
        </div>

        {/* Nama user */}
        {user ? (
          <>
            <span className="hidden lg:inline">Halo, <strong>{user.name.split(' ')[0]}</strong></span>
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} width={40} height={40} className="rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        )}
      </div>
    </header>
  )
}

"use client"

import Link from "next/link"
import Image from "next/image"
import { useUI } from "@/context/UIContext"

export default function Sidebar() {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleMobileDrawer, toggleSidebar } = useUI()

  return (
    <aside
      id="sidebar"
      className={`fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ease-in-out flex flex-col
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
    >
      {/* Sidebar Header */}
      <div className={`px-4 py-5 flex items-center gap-3 flex-shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
        <button
          id="sidebar-toggle"
          type="button"
          className="p-2 text-gray-500 rounded-lg hidden md:block hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Toggle sidebar</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div id="sidebar-title-container" className="flex-1 flex items-center gap-4 overflow-hidden" >
          {!isSidebarCollapsed && (
            <Image id="sidebar-title" src="/logo.png" alt="KELAS Logo" width={150} height={40} className="h-10 w-auto transition-opacity duration-300" />
          )}
        </div>
      </div>

      {/* Navigasi Sidebar */}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
        {/* Pastikan icon ada di folder /public */}
        <Link href="/dashboard" className="nav-link flex items-center gap-4 p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700"><Image src="/dashboard.png" alt="Dashboard Icon" width={28} height={28} className="flex-shrink-0" /> <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>Dashboard</span></Link>
        <Link href="/dashboard/modul" className="nav-link flex items-center gap-4 p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700"><Image src="/modules.png" alt="Modul Icon" width={28} height={28} className="flex-shrink-0" /> <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>Modul</span></Link>
        <Link href="/dashboard/tes" className="nav-link flex items-center gap-4 p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700"><Image src="/exam.png" alt="exam Icon" width={28} height={28} className="flex-shrink-0" /> <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>Pre Tes & Post</span></Link>
        <Link href="/dashboard/analitik" className="nav-link flex items-center gap-4 p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700"><Image src="/analitik.png" alt="Analitik Icon" width={28} height={28} className="flex-shrink-0" /> <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>Analitik Belajar</span></Link>
        <Link href="/dashboard/profil" className="nav-link flex items-center gap-4 p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700"><Image src="/profile.png" alt="profile Icon" width={28} height={28} className="flex-shrink-0" /> <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>Profil</span></Link>
      </nav>

      {/* Mobile Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={toggleMobileDrawer}
        ></div>
      )}
    </aside>
  )
}

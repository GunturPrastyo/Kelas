"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from 'next/navigation'
import { useUI } from "@/context/UIContext"

const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "/dashboard.png", alt: "Dashboard Icon" },
    { href: "/dashboard/modul", label: "Modul", icon: "/modules.png", alt: "Modul Icon" },
    { href: "/pre-test", label: "Pre Tes & Post", icon: "/exam.png", alt: "Tes Icon" },
    { href: "/dashboard/analitik", label: "Analitik Belajar", icon: "/analitik.png", alt: "Analitik Icon" },
    { href: "/dashboard/profil", label: "Profil", icon: "/profile.png", alt: "Profil Icon" },
];

export default function Sidebar() {
  const { isSidebarCollapsed, isMobileDrawerOpen, toggleMobileDrawer, toggleSidebar } = useUI();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

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
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link flex items-center gap-4 p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700 ${active ? 'bg-blue-100 dark:bg-gray-700 font-semibold' : ''}`}
            >
              <Image src={link.icon} alt={link.alt} width={28} height={28} className="flex-shrink-0" />
              <span className={`sidebar-text whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'} ${active ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
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

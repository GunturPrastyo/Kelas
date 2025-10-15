"use client"

import { useUI } from "@/context/UIContext";
import Image from "next/image";

export default function NavbarAdmin() {
    const { toggleMobileDrawer } = useUI();

    return (
        <header className="sticky top-0 z-30 w-full px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between h-16">
                {/* Tombol untuk membuka sidebar di mobile */}
                <button
                    type="button"
                    className="p-2 mr-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
                    onClick={toggleMobileDrawer}
                >
                    <span className="sr-only">Open sidebar</span>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                    </svg>
                </button>

                {/* Spacer untuk mendorong item ke kanan */}
                <div className="flex-1"></div>

                {/* Menu Profil Pengguna */}
                <div className="flex items-center ml-3">
                    <div>
                        <button type="button" className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600" id="user-menu-button" aria-expanded="false">
                            <span className="sr-only">Open user menu</span>
                            <Image className="w-8 h-8 rounded-full" src="/profile.png" alt="user photo" width={32} height={32} />
                        </button>
                    </div>
                    {/* Dropdown menu bisa ditambahkan di sini */}
                </div>
            </div>
        </header>
    );
}
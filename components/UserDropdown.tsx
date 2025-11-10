"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Mail } from 'lucide-react';

interface User {
    name: string;
    email: string;
    avatar?: string;
}

export default function UserDropdown() {
    const [user, setUser] = useState<User | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Ambil data pengguna dari localStorage
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
            setUser(JSON.parse(userRaw));
        }

        // Tambahkan event listener untuk menutup dropdown saat klik di luar
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        // Hapus data dari localStorage dan redirect ke halaman login
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (!user) {
        // Tampilkan placeholder atau tidak sama sekali jika user belum login
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
                <Image
                    src={user.avatar || '/default-avatar.png'} // Sediakan gambar avatar default
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="rounded-full object-cover transition"
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50">
                    <div className="p-4 border-b dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
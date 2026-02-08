"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import Avatar from './Avatar'; // Import the Avatar component
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Sun, Cloud, Sunset, Moon, BookUp, Award, Settings, HelpCircle, ChevronRight, Info, Download, LayoutDashboard } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import HelpModal from './HelpModal'; // Impor modal bantuan
import { useAlert } from '@/context/AlertContext'; // 1. Impor useAlert

interface User {
    name: string;
    email: string;
    avatar?: string;
    role?: 'user' | 'admin' | 'super_admin';
}
interface Module {
    _id: string;
    title: string;
    slug: string;
    status: 'Selesai' | 'Berjalan' | 'Terkunci' | 'Belum Mulai';
    progress: number;
    totalTopics?: number;
    completedTopics?: number;
}

export default function UserDropdown() {
    const [user, setUser] = useState<User | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { theme, setTheme } = useTheme();
    const { showAlert } = useAlert(); // 2. Inisialisasi useAlert

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [overallProgress, setOverallProgress] = useState(0);
    const [lastModule, setLastModule] = useState<Module | null>(null);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) {
            return { text: "Selamat pagi", icon: <Sun className="w-5 h-5 text-amber-500" /> };
        }
        if (hour >= 11 && hour < 15) {
            return { text: "Selamat Siang", icon: <Cloud className="w-5 h-5 text-sky-500" /> };
        }
        if (hour >= 15 && hour < 19) {
            return { text: "Selamat Sore", icon: <Sunset className="w-5 h-5 text-orange-500" /> };
        }
        return { text: "Selamat Malam", icon: <Moon className="w-5 h-5 text-indigo-500" /> };
    }, []);

    const fetchDropdownData = async () => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`);
            
            if (res.ok) {
                const modules: Module[] = await res.json();
                const totalModules = modules.length;
                if (totalModules > 0) { 
                    // Kalkulasi progres berdasarkan total topik yang selesai (disamakan dengan dashboard)
                    const totalAllTopics = modules.reduce((sum, module) => sum + (module.totalTopics || 0), 0);
                    const totalCompletedTopics = modules.reduce((sum, module) => sum + (module.completedTopics || 0), 0);
                    const newOverallProgress = totalAllTopics > 0 ? Math.round((totalCompletedTopics / totalAllTopics) * 100) : 0;
                    setOverallProgress(newOverallProgress);

                    // Logika untuk menemukan modul terakhir yang sedang dikerjakan tetap sama
                    const lastInProgress = modules.find(m => m.status === 'Berjalan');
                    setLastModule(lastInProgress || null);
                }
            }
        } catch (error) {
            console.error("Gagal mengambil data untuk dropdown:", error);
        }
    };


    useEffect(() => {
        setMounted(true);
        // Ambil data pengguna dari localStorage
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
            const userData = JSON.parse(userRaw);
            setUser(userData);
            // Hanya fetch data progress jika user adalah siswa
            if (userData.role === 'user') fetchDropdownData();
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

    // Tambahkan useEffect baru untuk mendengarkan event 'progressUpdated'
    useEffect(() => {
        const handleProgressUpdate = () => {
            fetchDropdownData(); // Panggil ulang fungsi fetch data saat event diterima
        };
        window.addEventListener('progressUpdated', handleProgressUpdate);
        return () => window.removeEventListener('progressUpdated', handleProgressUpdate);
    }, []); // Dependency kosong agar hanya berjalan sekali

    // Tambahkan useEffect untuk mendengarkan event 'user-updated' agar data user sinkron
    useEffect(() => {
        const handleUserUpdate = () => {
            const userRaw = localStorage.getItem('user');
            if (userRaw) {
                setUser(JSON.parse(userRaw));
            }
        };
        window.addEventListener('user-updated', handleUserUpdate);
        return () => window.removeEventListener('user-updated', handleUserUpdate);
    }, []);

    // Efek untuk menangani logout otomatis saat browser/tab ditutup
    useEffect(() => {
        const handleBeforeUnload = () => {
            const token = localStorage.getItem('token');
            if (token) {
                // Gunakan fetch native dengan keepalive: true agar request terkirim saat closing
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Authorization': `Bearer ${token}` // Header sesuai middleware auth
                    },
                    keepalive: true
                }).catch(err => console.error("Auto-logout failed:", err));
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const handleLogout = async () => {
        try {
            // Trigger logout di backend agar status online (lastActiveAt) direset
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`, {
                method: 'POST',
                // Tidak perlu signal di sini karena kita INGIN ini selesai
            });
        } catch (error) {
            console.error("Gagal logout dari server:", error);
        }
        // Hapus data dari localStorage dan redirect ke halaman login
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
    };

    // 3. Fungsi untuk menangani klik pada ikon info sertifikat
    const handleCertificateInfoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        showAlert({
            title: 'Sertifikat Terkunci',
            message: 'Anda harus menyelesaikan 100% dari semua modul untuk dapat melihat dan mengunduh sertifikat.',
            confirmText: 'Mengerti'
        });
    };

    if (!mounted || !user) {
        // Tampilkan placeholder atau tidak sama sekali jika user belum login
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            <button onClick={() => setIsOpen(!isOpen)} className="ml-4 focus:outline-none">
                <Avatar
                    user={user}
                    size={256}
                    className="transition rounded-full w-8 sm:w-10 h-8 sm:h-10 object-cover"
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 origin-top-right bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-150 ease-out transform opacity-100 scale-100">
                    {/* Greeting untuk Mobile */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 md:hidden">
                        <div className="flex items-center gap-2">
                            {greeting.icon}
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {greeting.text}, <span className="font-semibold truncate">{user.name}!</span>
                            </p>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <Avatar user={user} size={256} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate" title={user.name}>{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email}>{user.email}</p>
                                {user.role && user.role !== 'user' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mt-1 capitalize">
                                        {user.role.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Belajar */}
                    {user.role === 'user' && (
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress Belajar</label>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{overallProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${overallProgress}%` }}></div>
                        </div>
                    </div>
                    )}

                    {/* Menu Items */}
                    <div className="p-2">
                        {user.role !== 'user' && (
                            <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                                <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span>Dashboard Admin</span>
                            </Link>
                        )}

                        {/* {user.role === 'user' && lastModule && (
                            <Link href={`/modul/${lastModule.slug}`} onClick={() => setIsOpen(false)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                                <BookUp className="w-5 h-5 text-gray-500" />
                                <span className="flex-1 truncate">Lanjut dari: {lastModule.title}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </Link>
                        )} */}
                        {user.role === 'user' && (
                            <Link href="/profil" onClick={() => setIsOpen(false)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                                <UserIcon className="w-5 h-5" />
                                <span>Profil Saya</span>
                            </Link>
                        )}
                        {/* 4. Modifikasi Link Sertifikat */}
                        {user.role === 'user' && (
                            <div className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${overallProgress === 100 ? 'hover:bg-gray-100 dark:hover:bg-gray-700/50' : ''}`}>
                            <Link
                                href={overallProgress === 100 ? "/profil" : "#"}
                                onClick={(e) => {
                                    if (overallProgress < 100) e.preventDefault();
                                    else setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 flex-1 text-sm text-gray-700 dark:text-gray-300 ${overallProgress < 100 ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                                <Award className="w-5 h-5" />
                                <span>Sertifikat Saya</span>
                            </Link>
                            {overallProgress === 100 ? (
                                <Link href="/profil" onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                                    <Download size={16} />
                                </Link>
                            ) : (
                                <button onClick={handleCertificateInfoClick} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400">
                                    <Info size={16} />
                                </button>
                            )}
                        </div>
                        )}
                        <Link href="/profil?tab=settings" onClick={() => setIsOpen(false)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                            <Settings className="w-5 h-5" />
                            <span>Pengaturan</span>
                        </Link>
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                            <span className="flex items-center gap-3">
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                <span>Mode Tampilan</span>
                            </span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Terang' : 'Gelap'}</span>
                        </button>
                        {user.role === 'user' && (
                            <button onClick={() => { setIsHelpModalOpen(true); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                                <HelpCircle className="w-5 h-5" />
                                <span>Bantuan</span>
                            </button>
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
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
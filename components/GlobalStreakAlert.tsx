"use client";

import { useState, useEffect, useRef } from 'react';
import { Flame, X } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { usePathname } from 'next/navigation';

interface User {
    role?: string;
}

export default function GlobalStreakAlert() {
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [streakCount, setStreakCount] = useState(0);
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const loadUser = () => {
            const userRaw = localStorage.getItem('user');
            if (userRaw) {
                try {
                    setUser(JSON.parse(userRaw));
                } catch (e) {
                    console.error("Error parsing user data", e);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        loadUser();
        window.addEventListener('user-updated', loadUser);
        return () => window.removeEventListener('user-updated', loadUser);
    }, []);

    useEffect(() => {
        const checkStreak = async () => {
            // Jangan jalankan di halaman login/register
            if (!user || user.role !== 'user' || pathname === '/login' || pathname === '/register') return;

            try {
                const [analyticsRes, statusRes] = await Promise.all([
                    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/analytics`),
                    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/user-status`)
                ]);

                if (analyticsRes.ok && statusRes.ok) {
                    const analyticsData = await analyticsRes.json();
                    const statusData = await statusRes.json();
                    const currentStreak = analyticsData.dailyStreak || 0;
                    
                    if (currentStreak > 0) {
                        const today = new Date().toDateString();
                        const lastShownDate = statusData.lastStreakShownDate ? new Date(statusData.lastStreakShownDate).toDateString() : null;
                        
                        // Tampilkan jika belum pernah ditampilkan hari ini
                        if (lastShownDate !== today) {
                            setStreakCount(currentStreak);
                            setShowStreakModal(true);
                            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/user-status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ key: 'lastStreakShownDate', value: new Date() })
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Gagal memeriksa streak harian:", error);
            }
        };

        checkStreak();

        // Polling setiap 1 menit (60000 ms) untuk mengecek update streak saat user aktif
        intervalRef.current = setInterval(checkStreak, 60000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user, pathname]);

    if (!showStreakModal) return null;

    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center relative transform transition-all scale-100 animate-in zoom-in-95 duration-300 border-2 border-orange-100 dark:border-orange-900/50">
          <button 
            onClick={() => setShowStreakModal(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
              <div className="bg-gradient-to-br from-orange-400 to-red-500 p-4 rounded-full shadow-lg relative z-10">
                  <Flame size={48} className="text-white fill-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Streak {streakCount} Hari! 🔥
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
            Luar biasa! Kamu telah konsisten belajar selama <span className="font-bold text-orange-500">{streakCount} hari</span> berturut-turut. Pertahankan momentum ini!
          </p>
          
          <button
            onClick={() => setShowStreakModal(false)}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Siap Lanjut Belajar!
          </button>
        </div>
      </div>
    );
}
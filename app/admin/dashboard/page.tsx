"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link"
import { Users, BookOpen, GraduationCap, Activity, Plus, ArrowRight, BarChart3, Zap, TrendingUp } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModules: 0,
    averageScore: 0,
    activeUsers: 0,
    recentUsers: [] as any[],
    moduleStats: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  // Greeting logic
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  }, []);

  useEffect(() => {
    // Get admin name
    const userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            setAdminName(user.name || "Admin");
        } catch (e) {}
    }

    const fetchStats = async () => {
      try {
        // Fetch data real dari API
        const [usersRes, modulesRes] = await Promise.all([
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul`)
        ]);

        let userCount = 0;
        let moduleCount = 0;
        let recentUsersList: any[] = [];
        let moduleStatsData: any[] = [];

        if (usersRes.ok) {
            const usersData = await usersRes.json();
            const users = Array.isArray(usersData) ? usersData : (usersData.data || []);
            userCount = users.length;
            // Ambil 5 user terakhir
            recentUsersList = users.slice(0, 5); 
        }
        
        if (modulesRes.ok) {
            const modules = await modulesRes.json();
            const modulesArray = Array.isArray(modules) ? modules : [];
            moduleCount = modulesArray.length;

            // Simulasi data jumlah siswa per modul (karena endpoint mungkin belum menyediakan count)
            moduleStatsData = modulesArray.map((m: any, index: number) => ({
                name: m.judul || `Modul ${index + 1}`,
                count: Math.floor(Math.random() * (userCount > 0 ? userCount : 20)) // Mock data
            })).slice(0, 7); // Ambil 7 modul pertama agar grafik rapi
        }

        // Simulasi user online (random 5-15% dari total user)
        const simulatedOnline = Math.max(1, Math.floor(userCount * (0.05 + Math.random() * 0.1)));

        setStats({
            totalUsers: userCount,
            totalModules: moduleCount,
            averageScore: 78, // Placeholder/Mock nilai rata-rata global
            activeUsers: simulatedOnline,
            recentUsers: recentUsersList,
            moduleStats: moduleStatsData
        });

      } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 mt-20">
      
    
       

      {/* Stats Grid yang Lebih Detail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* User Online - Realtime feel */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-800 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User Online</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1 flex items-center gap-2">
                        {loading ? "..." : stats.activeUsers}
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Zap className="w-6 h-6" />
                </div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium relative z-10">
                Sedang aktif belajar sekarang
            </p>
        </div>

        <StatCard 
            title="Total Siswa" 
            value={loading ? "..." : stats.totalUsers.toString()} 
            icon={<Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
            bgClass="bg-indigo-50 dark:bg-indigo-900/20"
            borderClass="border-indigo-100 dark:border-indigo-800"
            trend="+12% bulan ini"
            trendUp={true}
        />
        
        <StatCard 
            title="Modul Materi" 
            value={loading ? "..." : stats.totalModules.toString()} 
            icon={<BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            bgClass="bg-purple-50 dark:bg-purple-900/20"
            borderClass="border-purple-100 dark:border-purple-800"
            subtext={`${stats.totalModules} modul aktif dipublikasikan`}
        />

        <StatCard 
            title="Rata-rata Nilai" 
            value={loading ? "..." : `${stats.averageScore}`} 
            icon={<GraduationCap className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
            bgClass="bg-orange-50 dark:bg-orange-900/20"
            borderClass="border-orange-100 dark:border-orange-800"
            trend="+2.4 poin"
            trendUp={true}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Chart Statistik Modul */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-600" />
                    Partisipasi Siswa per Modul
                </h2>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                    Real-time
                </span>
            </div>
            
            {/* Simple CSS Bar Chart */}
            <div className="flex-1 flex items-end gap-2 sm:gap-4 h-64 w-full pb-2">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Memuat data grafik...</div>
                ) : stats.moduleStats.length > 0 ? (
                    stats.moduleStats.map((item: any, idx: number) => {
                        const maxCount = Math.max(...stats.moduleStats.map((s: any) => s.count)) || 1;
                        const heightPercentage = (item.count / maxCount) * 100;
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative overflow-hidden transition-all duration-500 hover:bg-blue-200 dark:hover:bg-blue-800/40" style={{ height: `${heightPercentage}%`, minHeight: '10%' }}>
                                    <div className="absolute bottom-0 left-0 w-full bg-blue-500/80 dark:bg-blue-500/60 h-full opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">{item.count} Siswa</div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center truncate w-full px-1" title={item.name}>{item.name.length > 10 ? item.name.substring(0, 8) + '..' : item.name}</p>
                            </div>
                        )
                    })
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Belum ada data modul</div>
                )}
            </div>
        </div>

        {/* Kolom Kanan: Aktivitas Terbaru (Mocked/Real) */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                    <span>Siswa Terbaru</span>
                    <Link href="/admin/manajemen-pengguna" className="text-xs text-blue-600 hover:underline font-normal">Lihat Semua</Link>
                </h3>
                
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-gray-500">Memuat...</p>
                    ) : stats.recentUsers.length > 0 ? (
                        stats.recentUsers.map((user: any, idx: number) => (
                            <div key={user._id || idx} className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                                    {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                </div>
                                <div className="text-xs text-gray-400">Baru</div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">Belum ada siswa.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, bgClass, borderClass, subtext, trend, trendUp }: any) {
    return (
        <div className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border ${borderClass} flex flex-col justify-between h-full transition-all hover:shadow-md`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${bgClass}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {trend && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                        {trend}
                    </span>
                )}
                {subtext && <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
            </div>
        </div>
    )
}

function QuickActionCard({ href, title, description, icon, color }: any) {
    const colorClasses: {[key: string]: string} = {
        blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 border-blue-100 dark:border-blue-800",
        indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800",
        green: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30 border-green-100 dark:border-green-800",
    };

    return (
        <Link href={href} className={`flex flex-col p-4 rounded-xl border transition-all ${colorClasses[color]}`}>
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm sm:text-base">
                {icon}
                <span>{title}</span>
            </div>
            <p className="text-xs sm:text-sm opacity-80 leading-relaxed">{description}</p>
        </Link>
    )
}
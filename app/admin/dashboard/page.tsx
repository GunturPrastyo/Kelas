"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link"
import Image from "next/image";
import { Users, BookOpen, GraduationCap, Activity, Plus, ArrowRight, BarChart3, Zap, TrendingUp } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    avatar?: string;
    createdAt: string;
}

const getAvatarUrl = (user: User): string => {
    if (user.avatar && user.avatar.startsWith('http')) {
        return user.avatar;
    }
    if (user.avatar) {
        return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.avatar}`;
    }
    const encodedName = encodeURIComponent(user.name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&rounded=true`;
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModules: 0,
    averageScore: 0,
    recentUsers: [] as User[],
    moduleStats: [] as any[]
  });
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

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
        const [usersRes, modulesRes, analyticsRes] = await Promise.all([
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/admin-analytics`)
        ]);

        let userCount = 0;
        let moduleCount = 0;
        let recentUsersList: User[] = [];
        let moduleStatsData: any[] = [];
        let avgScore = 0;

        if (usersRes.ok) {
            const usersData = await usersRes.json();
            let users: User[] = Array.isArray(usersData) ? usersData : (usersData.data || []);
            
            // Filter admin agar tidak tampil di list siswa terbaru
            users = users.filter((u: User) => u.role !== 'admin');
            
            // Urutkan user berdasarkan tanggal pembuatan (terbaru paling atas)
            users.sort((a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Ambil 5 user terakhir
            recentUsersList = users.slice(0, 5); 
        }
        
        if (modulesRes.ok) {
            const modules = await modulesRes.json();
            const modulesArray = Array.isArray(modules) ? modules : [];
            moduleCount = modulesArray.length;

            // Fallback: inisialisasi moduleStatsData dengan data modul (count 0)
            // Ini memastikan chart tetap muncul dengan nama modul meskipun belum ada data analitik
            moduleStatsData = modulesArray.map((m: any) => ({
                name: m.title,
                count: 0
            }));
        }

        if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json();
            userCount = analyticsData.totalUsers || 0;
            avgScore = analyticsData.overallAverageScore || 0;
            setActiveUsers(analyticsData.onlineUsers ?? 0);

            // Gunakan data real dari moduleAnalytics jika tersedia dan tidak kosong
            if (analyticsData.moduleAnalytics && Array.isArray(analyticsData.moduleAnalytics) && analyticsData.moduleAnalytics.length > 0) {
                moduleStatsData = analyticsData.moduleAnalytics.map((m: any) => ({
                    name: m.moduleTitle,
                    count: m.totalStudents
                }));
            }
        }

        setStats({
            totalUsers: userCount,
            totalModules: moduleCount,
            averageScore: avgScore,
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

  // --- POLLING: Update User Online Secara Berkala ---
  useEffect(() => {
    const fetchOnlineUsers = async () => {
        try {
            // Tambahkan timestamp (_t) agar browser/CDN tidak melakukan caching pada request ini
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/admin-analytics?type=online-users&_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                // Gunakan nullish coalescing (??) untuk memastikan nilai tidak undefined/null
                setActiveUsers(data.onlineUsers ?? 0);
            }
        } catch (error) {
            console.error("Gagal memuat user online:", error);
        }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chartRef.current && stats.moduleStats.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: stats.moduleStats.map((m: any) => m.name),
            datasets: [
              {
                label: "Partisipasi Siswa",
                data: stats.moduleStats.map((m: any) => m.count),
                backgroundColor: "rgba(59, 130, 246, 0.6)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 0,
                borderRadius: 4,
                barThickness: 20,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.raw} Siswa`,
                },
              },
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                },
              },
              y: {
                grid: {
                  display: false,
                },
              },
            },
          },
        });
      }
    }

    return () => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
    };
  }, [stats.moduleStats]);

  return (
    <div className="space-y-8 mt-20">
      
    
       

      {/* Stats Grid yang Lebih Detail */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* User Online - Realtime feel */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-2xl shadow-sm group hover:shadow-lg transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-700 opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">User Online</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
                        {loading ? "..." : activeUsers}
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </h3>
                    <p className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium mt-2 flex items-center gap-1">
                        <Zap size={12} fill="currentColor" />
                        Sedang aktif belajar
                    </p>
                </div>
                <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                    <Zap className="w-5 h-5 md:w-6 md:h-6" />
                </div>
            </div>
        </div>

        <StatCard 
            title="Total Siswa" 
            value={loading ? "..." : stats.totalUsers.toString()} 
            icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
            color="indigo"
            trend="+12% bulan ini"
            trendUp={true}
        />
        
        <StatCard 
            title="Modul Materi" 
            value={loading ? "..." : stats.totalModules.toString()} 
            icon={<BookOpen className="w-5 h-5 md:w-6 md:h-6" />}
            color="purple"
            subtext={`${stats.totalModules} modul aktif dipublikasikan`}
        />

        <StatCard 
            title="Rata-rata Nilai" 
            value={loading ? "..." : `${stats.averageScore}`} 
            icon={<GraduationCap className="w-5 h-5 md:w-6 md:h-6" />}
            color="orange"
            trend="+2.4 poin"
            trendUp={true}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Chart Statistik Modul */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <BarChart3 size={20} className="text-gray-600 dark:text-gray-400" />
                    Partisipasi Siswa per Modul
                </h2>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                    Real-time
                </span>
            </div>
            
            {/* Chart.js Bar Chart */}
            <div className="flex-1 w-full h-64 relative">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Memuat data grafik...</div>
                ) : stats.moduleStats.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Belum ada data modul</div>
                )}
            </div>
        </div>

        {/* Kolom Kanan: Aktivitas Terbaru (Mocked/Real) */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6 h-full">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                    <span>Siswa Terbaru</span>
                    <Link href="/admin/analitik#analitik-siswa" className="text-xs text-blue-600 hover:underline font-normal">Lihat Analitik</Link>
                </h3>
                
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-gray-500">Memuat...</p>
                    ) : stats.recentUsers.length > 0 ? (
                        stats.recentUsers.map((user, idx) => (
                            <div key={user._id || idx} className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                <Image
                                    src={getAvatarUrl(user)}
                                    alt={user.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                </div>
                                <div className="text-xs text-gray-400 whitespace-nowrap">{getTimeAgo(user.createdAt)}</div>
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

function StatCard({ title, value, icon, color = "blue", subtext, trend, trendUp }: any) {
    const colorStyles: any = {
        blue: {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            cardBg: "bg-blue-50 dark:bg-blue-900/10",
            border: "border-blue-200 dark:border-blue-800",
            gradient: "from-blue-500 to-blue-600",
        },
        indigo: {
            bg: "bg-indigo-100 dark:bg-indigo-900/30",
            cardBg: "bg-indigo-50 dark:bg-indigo-900/10",
            border: "border-indigo-200 dark:border-indigo-800",
            gradient: "from-indigo-500 to-indigo-600",
        },
        purple: {
            bg: "bg-purple-100 dark:bg-purple-900/30",
            cardBg: "bg-purple-50 dark:bg-purple-900/10",
            border: "border-purple-200 dark:border-purple-800",
            gradient: "from-purple-500 to-purple-600",
        },
        orange: {
            bg: "bg-orange-100 dark:bg-orange-900/30",
            cardBg: "bg-orange-50 dark:bg-orange-900/10",
            border: "border-orange-200 dark:border-orange-800",
            gradient: "from-orange-500 to-orange-600",
        },
        green: {
            bg: "bg-green-100 dark:bg-green-900/30",
            cardBg: "bg-green-50 dark:bg-green-900/10",
            border: "border-green-200 dark:border-green-800",
            gradient: "from-green-500 to-green-600",
        }
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <div className={`relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-6 rounded-2xl shadow-sm group hover:shadow-lg transition-all duration-300`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-700 opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out`}></div>
            
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{value}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        {trend && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                {trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                                {trend}
                            </span>
                        )}
                        {subtext && <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
                    </div>
                </div>
                <div className={`p-2 md:p-3 rounded-xl text-white shadow-md bg-gradient-to-br ${style.gradient}`}>
                    {icon}
                </div>
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
        <Link href={href} className={`flex flex-col p-4 rounded-xl transition-all ${colorClasses[color]}`}>
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm sm:text-base">
                {icon}
                <span>{title}</span>
            </div>
            <p className="text-xs sm:text-sm opacity-80 leading-relaxed">{description}</p>
        </Link>
    )
}

function getTimeAgo(dateString: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " thn lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bln lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hr lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mnt lalu";
    return "Baru saja";
}
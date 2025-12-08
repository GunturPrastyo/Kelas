"use client";

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { BarChart, Users, Clock, Percent, Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, PieChart, UserCheck } from 'lucide-react';

interface AdminAnalyticsData {
    totalUsers?: number;
    totalStudyHours?: number;
    averageProgress?: number;
    overallAverageScore?: number;
    weakestTopicOverall?: {
        topicTitle: string;
        averageScore: number;
    };
    // Tambahkan tipe data lain yang mungkin akan ada
    activeUsers?: number;
    averageRemedialRate?: number;
    moduleAnalytics?: any[];
    userAnalytics?: any[];
}

const StatCard = ({ title, value, icon, change, changeType, unit, subtext }: { title: string, value: string | number, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' | 'neutral', unit?: string, subtext?: string }) => {
    const isIncrease = changeType === 'increase';
    const isDecrease = changeType === 'decrease';

    const changeColor = isIncrease ? 'text-green-600' : isDecrease ? 'text-blue-600' : 'text-indigo-600';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl flex items-start gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                {icon}
            </div>
            <div>
                <h2 className="text-sm text-gray-500 dark:text-gray-400">{title}</h2>
                <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">
                    {value}{unit && <span className="text-xl">{unit}</span>}
                </p>
                {change && (
                    <span className={`${changeColor} text-sm font-medium`}>{change}</span>
                )}
                 {subtext && (
                    <span className="text-indigo-600 text-sm">{subtext}</span>
                )}
            </div>
        </div>
    );
};

const InsightCard = ({ title, value, subtext, icon, badge, badgeColor }: { title: string, value: string, subtext?: string, icon: React.ReactNode, badge: string, badgeColor: string }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl">
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <h2 className="text-sm text-gray-500 dark:text-gray-400">{title}</h2>
            </div>
            <p className="text-xl font-semibold mt-1 text-gray-800 dark:text-gray-200">{value}</p>
            <span className={`px-2 py-1 ${badgeColor} rounded text-xs font-medium mt-2 inline-block`}>{badge}</span>
        </div>
    );
}


export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<AdminAnalyticsData>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/admin-analytics`);
                if (!res.ok) {
                    throw new Error('Gagal memuat data analitik.');
                }
                const data = await res.json();
                // Data dummy untuk field yang belum ada di API
                const dummyData = {
                    activeUsers: Math.floor(data.totalUsers * 0.73), // 73% dari total
                    averageRemedialRate: 18,
                    moduleWithLongestTime: "Variabel & Tipe Data",
                    moduleWithFastestTime: "Pengenalan Komputasi",
                };
                setAnalytics({ ...data, ...dummyData });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Memuat data analitik...</p></div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto font-poppins">
            {/* HEADER */}
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Analitik Pembelajaran</h1>

            {/* SECTION 1: INSIGHT GLOBAL */}
            <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Ringkasan Analitik</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Jumlah Siswa" value={analytics.totalUsers ?? 0} icon={<Users className="text-blue-500" />} change="+12 minggu ini" changeType="increase" />
                <StatCard title="Rata-rata Waktu Belajar" value={42} unit=" menit" icon={<Clock className="text-yellow-500" />} change="↓ 5% lebih cepat" changeType="decrease" />
                <StatCard title="Rata-rata Nilai" value={analytics.overallAverageScore ?? 0} unit="%" icon={<Percent className="text-green-500" />} change="+3% minggu ini" changeType="increase" />
                <StatCard title="Siswa Aktif 7 Hari Ini" value={analytics.activeUsers ?? 0} icon={<UserCheck className="text-indigo-500" />} subtext={`${analytics.totalUsers ? Math.round((analytics.activeUsers! / analytics.totalUsers) * 100) : 0}% dari total siswa`} />
            </div>

            {/* EXTRA INSIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <InsightCard 
                    title="Topik Paling Sulit" 
                    value={analytics.weakestTopicOverall?.topicTitle ?? 'N/A'} 
                    icon={<TrendingDown className="text-red-500" />} 
                    badge={`Skor rata-rata: ${analytics.weakestTopicOverall?.averageScore}%`}
                    badgeColor="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300" 
                />
                <InsightCard 
                    title="Modul Dengan Waktu Tercepat" 
                    value="Pengenalan Komputasi" 
                    icon={<TrendingUp className="text-green-500" />} 
                    badge="Sangat mudah dipahami" 
                    badgeColor="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" 
                />
                <InsightCard 
                    title="Tingkat Remedial Rata-rata" 
                    value={`${analytics.averageRemedialRate ?? 0}%`} 
                    icon={<AlertTriangle className="text-yellow-500" />} 
                    badge="Perlu pemantauan konten" 
                    badgeColor="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300" 
                />
            </div>

            {/* SECTION 2: CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Kecepatan Belajar per Modul</h2>
                    <div className="bg-gray-100 dark:bg-gray-700 h-48 rounded flex items-center justify-center text-gray-500">
                        <BarChart className="w-12 h-12 text-gray-400" />
                        <p className="ml-2">(Chart Placeholder)</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Distribusi Nilai Siswa</h2>
                    <div className="bg-gray-100 dark:bg-gray-700 h-48 rounded flex items-center justify-center text-gray-500">
                        <PieChart className="w-12 h-12 text-gray-400" />
                        <p className="ml-2">(Chart Placeholder)</p>
                    </div>
                </div>
            </div>

            {/* SECTION 3: ANALITIK PER MODUL */}
            <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Analitik Per Modul</h2>
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-12 overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Modul</th>
                            <th scope="col" className="px-6 py-3">Rata-rata Waktu</th>
                            <th scope="col" className="px-6 py-3">Rata-rata Nilai</th>
                            <th scope="col" className="px-6 py-3">Tingkat Remedial</th>
                            <th scope="col" className="px-6 py-3">Kesulitan</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Pengenalan Komputasi</th>
                            <td className="px-6 py-4">25 menit</td>
                            <td className="px-6 py-4">82%</td>
                            <td className="px-6 py-4">4%</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs dark:bg-green-900/50 dark:text-green-300">Mudah</span></td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-200 text-green-800 rounded-md text-xs dark:bg-green-900/60 dark:text-green-200">Baik</span></td>
                        </tr>
                        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Variabel & Tipe Data</th>
                            <td className="px-6 py-4">58 menit</td>
                            <td className="px-6 py-4">61%</td>
                            <td className="px-6 py-4">38%</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs dark:bg-red-900/50 dark:text-red-300">Sulit</span></td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-red-200 text-red-800 rounded-md text-xs dark:bg-red-900/60 dark:text-red-200">Butuh Evaluasi</span></td>
                        </tr>
                        <tr className="bg-white dark:bg-gray-800">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Percabangan</th>
                            <td className="px-6 py-4">35 menit</td>
                            <td className="px-6 py-4">77%</td>
                            <td className="px-6 py-4">18%</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs dark:bg-yellow-900/50 dark:text-yellow-300">Sedang</span></td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-md text-xs dark:bg-yellow-900/60 dark:text-yellow-200">Dipantau</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* SECTION 4: ANALITIK SISWA */}
            <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Analitik Siswa (Individual)</h2>
            <div className="mb-6 bg-white dark:bg-gray-800 shadow-lg p-4 rounded-xl">
                <label htmlFor="student-select" className="text-sm text-gray-600 dark:text-gray-400">Pilih Siswa</label>
                <select id="student-select" className="mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <option>Guntur Prastyo</option>
                    <option>Rifqie Alimul Hal</option>
                    <option>Dwi Ardyansyah</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl">
                    <h2 className="text-sm text-gray-500 dark:text-gray-400">Progress Belajar</h2>
                    <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">62%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl">
                    <h2 className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Waktu</h2>
                    <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">47 menit</p>
                    <span className="text-yellow-600 text-sm">Lebih lambat dari rata-rata kelas</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl">
                    <h2 className="text-sm text-gray-500 dark:text-gray-400">Topik Terlemah</h2>
                    <p className="text-xl font-semibold mt-1 text-gray-800 dark:text-gray-200">Variabel & Tipe Data</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-10 overflow-x-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Detail Performa Siswa</h2>
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Modul</th>
                            <th scope="col" className="px-6 py-3">Waktu</th>
                            <th scope="col" className="px-6 py-3">Nilai</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Rekomendasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Pengenalan Komputasi</th>
                            <td className="px-6 py-4">22 menit</td>
                            <td className="px-6 py-4">88%</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs dark:bg-green-900/50 dark:text-green-300">Baik</span></td>
                            <td className="px-6 py-4">—</td>
                        </tr>
                        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Variabel & Tipe Data</th>
                            <td className="px-6 py-4">63 menit</td>
                            <td className="px-6 py-4">58%</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs dark:bg-red-900/50 dark:text-red-300">Lambat</span></td>
                            <td className="px-6 py-4"><p className="text-xs">Ulangi video + latihan tambahan</p></td>
                        </tr>
                        <tr className="bg-white dark:bg-gray-800">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Percabangan</th>
                            <td className="px-6 py-4">47 menit</td>
                            <td className="px-6 py-4">72%</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs dark:bg-yellow-900/50 dark:text-yellow-300">Sedang</span></td>
                            <td className="px-6 py-4"><p className="text-xs">Review contoh kasus</p></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
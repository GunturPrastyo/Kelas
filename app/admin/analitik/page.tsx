"use client";

import React, { useEffect, useMemo, useState, FC, ReactNode } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { authFetch } from '@/lib/authFetch';
import { BarChart as BarChartIcon, Users, Clock, Percent, Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, PieChart, UserCheck, ChevronDown, ChevronRight, BookOpen, Target, BarChart2 } from 'lucide-react';

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
    moduleAnalytics?: {
        moduleTitle: string;
        averageTimeInSeconds: number;
        averageScore: number;
        remedialRate: number;
        weightedScore: number;
    }[];
    topicAnalytics?: {
        topicTitle: string;
        moduleTitle: string;
        averageTimeInSeconds: number;
        averageScore: number;
        remedialRate: number;
        weightedScore: number;
    }[];
    moduleLearningSpeed?: {
        moduleTitle: string;
        averageTimeInSeconds: number;
    }[];
    moduleScoreDistribution?: {
        subject: string;
        topicScore: number;
        moduleScore: number;
        fullMark: number;
    }[];
    userAnalytics?: any[];
}

interface StudentAnalyticsData {
    progress: number;
    completedModules: number;
    totalModules: number;
    averageTimeInSeconds: number;
    weakestTopic: {
        topicTitle: string;
        score: number;
    } | null;
    detailedPerformance: {
        moduleTitle: string;
        moduleScore: number; // Changed from score
        topicScore: number; // Added
        timeInSeconds: number;
        topics: {
            topicTitle: string;
            score: number;
            timeInSeconds: number;
        }[];
    }[];
}

const ComparisonIndicator: FC<{ student: number; average: number; type: 'time' | 'score' }> = ({ student, average, type }) => {
    if (student === 0 || average === 0) return null;

    const isBetter = type === 'score' ? student > average : student < average;
    const Icon = isBetter ? TrendingUp : TrendingDown;
    const color = isBetter ? 'text-green-500' : 'text-red-500';

    return (
        <span className={`flex items-center justify-center text-xs ${color}`}>
            <Icon className="w-3 h-3 mr-1" />
            {Math.abs(((student - average) / average) * 100).toFixed(0)}%
        </span>
    );
};

const getStatusBadge = (weightedScore: number) => {
    if (weightedScore >= 1.4) {
        return <span className="px-2 py-1 bg-red-200 text-red-800 rounded-md text-xs dark:bg-red-900/60 dark:text-red-200">Butuh Evaluasi</span>;
    }
    if (weightedScore >= 0.7) {
        return <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-md text-xs dark:bg-yellow-900/60 dark:text-yellow-200">Butuh pantauan</span>;
    }
    return <span className="px-2 py-1 bg-green-200 text-green-800 rounded-md text-xs dark:bg-green-900/60 dark:text-green-200">Baik</span>;
};

const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)} mnt ${seconds % 60} dtk`;
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

// Fungsi untuk memformat detik menjadi "X menit Y detik"
const formatSecondsToMinutesAndSeconds = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "0 mnt 0 dtk";
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} mnt ${seconds} dtk`;
};

const StatCard = ({ title, value, icon, change, changeType, unit, subtext }: { title: string, value: string | number, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' | 'neutral', unit?: string, subtext?: string }) => {
    const isIncrease = changeType === 'increase';
    const isDecrease = changeType === 'decrease';

    const changeColor = isIncrease ? 'text-green-600' : isDecrease ? 'text-blue-600' : 'text-indigo-600';

    return ( // Updated StatCard to have gradient background
        <div className={`p-4 md:p-6 shadow-lg rounded-xl ${changeType === 'increase' ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-green-900/30' : changeType === 'decrease' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900/30' : 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/30'}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg self-start">
                    {icon}
                </div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h2>
            </div>
            <div className="mt-3 md:mt-4">
                <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">
                    {value}{unit && <span className="text-xl">{unit}</span>}
                </p>
                {change && (
                    <span className={`${changeColor} text-sm font-medium block`}>{change}</span>
                )}
                {subtext && (
                    <span className="text-indigo-600 text-sm block">{subtext}</span>
                )}
            </div>
        </div>
    );
};

// New function for student-specific status based on class average
const getStudentModuleStatusBadge = (
    studentModuleScore: number,
    studentTimeInSeconds: number,
    classAverageScore: number | undefined,
    classAverageTimeInSeconds: number | undefined
) => {
    // Handle cases where class average data might be missing or invalid
    if (classAverageScore === undefined || classAverageTimeInSeconds === undefined || classAverageTimeInSeconds <= 0) {
        return <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-xs dark:bg-gray-700/60 dark:text-gray-200">Data Kelas Tidak Tersedia / Tidak Relevan</span>;
    }

    // Special case: If student has 0 score and 0 time, it's clearly "Butuh Evaluasi"
    if (studentModuleScore <= 0 && studentTimeInSeconds <= 0) {
        return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-xs">Butuh Evaluasi (Tidak Ada Upaya)</span>;
    }

    // Calculate score ratio: how student's score compares to class average (higher is better)
    // If classAverageScore is 0, and student has a score, it's infinitely better.
    // If both are 0, it's considered average (ratio 1).
    const scoreRatio = classAverageScore > 0 ? (studentModuleScore / classAverageScore) : (studentModuleScore > 0 ? 2 : 1);

    // Calculate time ratio: how student's time compares to class average (higher is better, so inverse of time)
    // If studentTimeInSeconds is 0, it means they didn't spend time, which is very bad for time efficiency.
    // Assign a very low ratio (e.g., 0.1) to penalize this heavily.
    const timeRatio = studentTimeInSeconds > 0 ? (classAverageTimeInSeconds / studentTimeInSeconds) : 0.1;

    // Combine ratios into a single performance index
    // We can give equal weight to score and time, or adjust based on priority.
    // For now, let's assume equal importance (50% score, 50% time efficiency).
    const performanceIndex = (scoreRatio + timeRatio) / 2;

    // Define thresholds for the performance index
    // These thresholds can be adjusted based on desired strictness and the expected distribution of performance indices.
    const excellentThreshold = 1.2; // e.g., 20% better than average overall
    const goodThreshold = 0.9;    // e.g., within 10% below average overall (still considered good/average)
    const monitorThreshold = 0.7; // e.g., within 30% below average overall

    let statusText = 'Dipantau'; // Default status
    let bgColor = 'bg-yellow-100 dark:bg-yellow-900/50';
    let textColor = 'text-yellow-700 dark:text-yellow-300';

    if (performanceIndex >= excellentThreshold) {
        statusText = 'Sangat Baik';
        bgColor = 'bg-green-100 dark:bg-green-900/50';
        textColor = 'text-green-700 dark:text-green-300';
    } else if (performanceIndex >= goodThreshold) {
        statusText = 'Baik';
        // Using blue for 'Baik' to differentiate from 'Sangat Baik' green, or you can use a lighter green.
        bgColor = 'bg-blue-100 dark:bg-blue-900/50';
        textColor = 'text-blue-700 dark:text-blue-300';
    } else if (performanceIndex >= monitorThreshold) {
        statusText = 'Butuh Pemantauan';
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/50';
        textColor = 'text-yellow-700 dark:text-yellow-300';
    } else {
        statusText = 'Butuh Evaluasi';
        bgColor = 'bg-red-100 dark:bg-red-900/50';
        textColor = 'text-red-700 dark:text-red-300';
    }
    return <span className={`px-2 py-1 rounded-md text-xs ${bgColor} ${textColor}`}>{statusText}</span>;
};

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<AdminAnalyticsData>({});
    const [loading, setLoading] = useState(true); // ... (rest of the state variables)
    const [error, setError] = useState<string | null>(null); // ... (rest of the state variables)
    const [currentPage, setCurrentPage] = useState(1); // ... (rest of the state variables)
    const [modulesPerPage, setModulesPerPage] = useState(6); // ... (rest of the state variables)
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set()); // ... (rest of the state variables)
    const [searchTerm, setSearchTerm] = useState(''); // ... (rest of the state variables)
    const [allUsers, setAllUsers] = useState<{ _id: string, name: string }[]>([]); // ... (rest of the state variables)
    const [selectedStudentId, setSelectedStudentId] = useState<string>(''); // ... (rest of the state variables)
    const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalyticsData | null>(null); // ... (rest of the state variables)
    const [studentLoading, setStudentLoading] = useState(false); // ... (rest of the state variables)
    const [studentError, setStudentError] = useState<string | null>(null); // ... (rest of the state variables)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/admin-analytics`);
                if (!res.ok) {
                    throw new Error('Gagal memuat data analitik.');
                }
                const data = await res.json();
                // Data dummy untuk field yang belum ada di API (jika masih ada)
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

        const fetchUsers = async () => {
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/users-list`);
                const users = await res.json();
                setAllUsers(users);
                if (users.length > 0) {
                    setSelectedStudentId(users[0]._id); // Pilih siswa pertama sebagai default
                }
            } catch (error) { console.error("Gagal memuat daftar siswa:", error); }
        };
        fetchAnalytics();
        fetchUsers();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setModulesPerPage(3);
            } else {
                setModulesPerPage(6);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Panggil sekali saat inisialisasi

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchStudentAnalytics = async () => {
            if (!selectedStudentId) return;

            try {
                setStudentLoading(true);
                setStudentError(null);
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/student-analytics/${selectedStudentId}`);
                if (!res.ok) {
                    throw new Error('Gagal memuat data analitik siswa.');
                }
                const data: StudentAnalyticsData = await res.json();
                setStudentAnalytics(data);
            } catch (err: any) {
                setStudentError(err.message);
            } finally {
                setStudentLoading(false);
            }
        };
        fetchStudentAnalytics();
    }, [selectedStudentId]);

    const handleToggleModule = (moduleTitle: string) => {
        setExpandedModules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(moduleTitle)) {
                newSet.delete(moduleTitle);
            } else {
                newSet.add(moduleTitle);
            }
            return newSet;
        });
    };

    const nestedTableData = useMemo(() => {
        const modules = analytics.moduleAnalytics || [];
        const topics = analytics.topicAnalytics || [];
        return modules.map(mod => ({ ...mod, topics: topics.filter(topic => topic.moduleTitle === mod.moduleTitle) }));
    }, [analytics.moduleAnalytics, analytics.topicAnalytics]);

    const filteredData = useMemo(() => {
        if (!searchTerm) {
            return nestedTableData;
        }
        return nestedTableData.filter(modul =>
            modul.moduleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            modul.topics.some(topic => topic.topicTitle.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [nestedTableData, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, modulesPerPage]);

    // Logika Pagination
    const indexOfLastModule = currentPage * modulesPerPage;
    const indexOfFirstModule = indexOfLastModule - modulesPerPage;
    const currentModules = filteredData.slice(indexOfFirstModule, indexOfLastModule);

    const totalPages = Math.ceil(filteredData.length / modulesPerPage);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);


    const radarChartInsight = useMemo(() => {
        const data = analytics.moduleScoreDistribution;
        if (!data || data.length === 0) {
            return null;
        }

        const totalTopicScore = data.reduce((sum, item) => sum + item.topicScore, 0);
        const totalModuleScore = data.reduce((sum, item) => sum + item.moduleScore, 0);

        const avgTopicScore = totalTopicScore / data.length;
        const avgModuleScore = totalModuleScore / data.length;

        const difference = avgModuleScore - avgTopicScore;

        if (Math.abs(difference) < 3) {
            return {
                text: "Skor tes topik dan tes modul konsisten, menandakan pemahaman yang stabil.",
                icon: <Activity className="w-4 h-4 text-gray-500 flex-shrink-0" />
            };
        } else if (difference > 0) {
            return {
                text: "Pembelajaran kumulatif efektif. Skor tes akhir modul cenderung lebih tinggi dari tes per-topik.",
                icon: <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
            };
        } else {
            return {
                text: "Siswa cenderung kesulitan mengintegrasikan konsep. Perlu penguatan di akhir modul.",
                icon: <TrendingDown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            };
        }
    }, [analytics.moduleScoreDistribution]);

    const studentComparisonChartData = useMemo(() => {
        if (!studentAnalytics || !analytics.moduleAnalytics) return [];

        return studentAnalytics.detailedPerformance.map(perf => {
            const classModule = analytics.moduleAnalytics?.find(m => m.moduleTitle === perf.moduleTitle);
            return {
                name: perf.moduleTitle.split(' ').slice(0, 2).join(' '), // Shorten name for chart
                "Nilai Siswa": perf.moduleScore,
                "Rata-rata Kelas": classModule?.averageScore ?? 0,
            };
        });
    }, [studentAnalytics, analytics.moduleAnalytics]);

    const overallClassAverageScore = analytics.overallAverageScore ?? 0;

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Memuat data analitik...</p></div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto font-poppins mt-22">
           
            {/* SECTION 1: INSIGHT GLOBAL */}
            <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Ringkasan Analitik</h2>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Jumlah Siswa" value={analytics.totalUsers ?? 0} icon={<Users className="text-blue-500" />} change="+12 minggu ini" changeType="decrease" />
                <StatCard title="Rata-rata Waktu Belajar" value={42} unit=" menit" icon={<Clock className="text-yellow-500" />} change="↓ 5% lebih cepat" changeType="neutral" />
                <StatCard title="Rata-rata Nilai" value={analytics.overallAverageScore ?? 0} unit="%" icon={<Percent className="text-green-500" />} change="+3% minggu ini" changeType="increase" />
                <StatCard title="Siswa Aktif 7 Hari Ini" value={analytics.activeUsers ?? 0} icon={<UserCheck className="text-indigo-500" />} subtext={`${analytics.totalUsers ? Math.round((analytics.activeUsers! / analytics.totalUsers) * 100) : 0}% dari total siswa`} changeType="decrease"/>
            </div>



            {/* SECTION 3: ANALITIK PER MODUL & TOPIK */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-xl p-6 mb-12">
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Analitik Per Modul & Topik</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Data performa siswa berdasarkan hasil tes topik dan tes akhir modul. Gunakan untuk mengidentifikasi modul atau topik yang memerlukan perhatian lebih.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-200 dark:border-gray-700 pb-8">
                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Kecepatan Belajar per Modul</h2>
                        <div className="h-96 rounded flex items-center justify-center text-gray-500">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart
                                    layout="vertical"
                                    data={analytics.moduleLearningSpeed}
                                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                    barCategoryGap="30%"
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(value) => `${Math.round(value / 60)} mnt`}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="moduleTitle"
                                        width={100}
                                        tick={{ fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                            backdropFilter: 'blur(5px)',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                        }}
                                        labelStyle={{ fontWeight: 'bold' }}
                                        formatter={(value: number) => [formatSecondsToMinutesAndSeconds(value), "Rata-rata Waktu"]}
                                    />
                                    <Bar dataKey="averageTimeInSeconds" fill="#3b82f6" name="Rata-rata Waktu" radius={[0, 4, 4, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Distribusi Nilai Siswa</h2>
                        <div className="h-96 rounded flex items-center justify-center text-gray-500">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.moduleScoreDistribution}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                            backdropFilter: 'blur(5px)',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                        }}
                                        formatter={(value: number, name: string) => [`${value}%`, name]}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Radar name="Rata-rata Tes Topik" dataKey="topicScore" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.5} />
                                    <Radar name="Rata-rata Tes Modul" dataKey="moduleScore" stroke="#818cf8" fill="#818cf8" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        {radarChartInsight && (
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-start gap-3 border border-gray-200 dark:border-gray-700">
                                {radarChartInsight.icon}
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    {radarChartInsight.text}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-6">
                    <input
                        type="search"
                        placeholder="Cari modul atau topik..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Detail Performa per Modul</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ">Menampilkan data rata-rata hasil tes akhir setiap modul yang dikerjakan siswa.</p>
                    {currentModules.length > 0 ? (
                        currentModules.map((modul) => (
                            <div key={modul.moduleTitle} className="bg-gradient-to-tr from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-md rounded-xl overflow-hidden transition-all duration-300">

                                <div className="p-5">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 pr-4">{modul.moduleTitle}</h3>
                                        {getStatusBadge(modul.weightedScore)}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-4 text-center border-t border-b border-gray-200 dark:border-gray-700 py-3">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata Nilai</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{modul.averageScore}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Tingkat Remedial</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{modul.remedialRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata Waktu</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{formatTime(modul.averageTimeInSeconds)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Topics List (conditionally rendered) */}
                                {expandedModules.has(modul.moduleTitle) && (
                                    <div className="bg-gray-50 dark:bg-gray-700/20 px-5 pb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detail Tes per Topik</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Rincian rata-rata nilai dan waktu pengerjaan untuk setiap topik di dalam modul ini.</p>
                                        {modul.topics.length > 0 ? (
                                            <div>
                                                {/* Topic Table Header */}
                                                <div className="flex justify-between gap-x-2 px-4 py-2 mt-2 border-b-2 border-gray-200 dark:border-gray-600">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Topik</span>
                                                    </div>
                                                    <div className="w-16 text-center">
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Waktu</span>
                                                    </div>
                                                    <div className="w-12 text-center">
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nilai</span>
                                                    </div>
                                                    <div className="w-24 text-center">
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</span>
                                                    </div>
                                                </div>
                                                {/* Topic Table Body */}
                                                {modul.topics.map(topic => (
                                                    <div key={topic.topicTitle} className="flex justify-between items-center gap-x-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/30">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate block">{topic.topicTitle}</span>
                                                        </div>
                                                        <div className="w-16 text-center">
                                                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{formatTime(topic.averageTimeInSeconds)}</span>
                                                        </div>
                                                        <div className="w-12 text-center">
                                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{topic.averageScore}%</span>
                                                        </div>
                                                        <div className="w-24 flex justify-center">
                                                            {getStatusBadge(topic.weightedScore)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="px-5 py-3 text-center text-gray-500 italic">Tidak ada data topik untuk modul ini.</p>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleToggleModule(modul.moduleTitle)}
                                    className="flex items-center justify-center w-full p-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
                                >
                                    {expandedModules.has(modul.moduleTitle) ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />}
                                    {expandedModules.has(modul.moduleTitle) ? 'Sembunyikan Topik' : `Lihat ${modul.topics.length} Topik`}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-1 p-6 text-center text-gray-500">
                            {searchTerm ? `Tidak ada modul atau topik yang cocok dengan "${searchTerm}".` : "Tidak ada data analitik modul untuk ditampilkan."}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <nav className="flex justify-center mt-8">
                        <ul className="inline-flex items-center -space-x-px">
                            <li>
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white/70 border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                                >
                                    Previous
                                </button>
                            </li>
                            {[...Array(totalPages)].map((_, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => paginate(index + 1)}
                                        className={`px-3 py-2 leading-tight backdrop-blur-sm ${currentPage === index + 1 ? 'text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 bg-white/70 border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}`}
                                    >
                                        {index + 1}
                                    </button>
                                </li>
                            ))}
                            <li>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 leading-tight text-gray-500 bg-white/70 border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>

            {/* SECTION 4: ANALITIK SISWA */}
            <div className="bg-gradient-to-br from-gray-50 to-green-100 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-xl p-6 mb-12">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Analitik Siswa Individual</h2>
                    <div className="mt-4 md:mt-0 md:w-1/3">
                        <label htmlFor="student-select" className="sr-only">Pilih Siswa</label>
                        <select
                            id="student-select"
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {allUsers.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {studentLoading ? (
                    <div className="text-center py-10">Memuat data siswa...</div>
                ) : studentError ? (
                    <div className="text-center py-10 text-red-500">Error: {studentError}</div>
                ) : studentAnalytics ? (
                    <div className="space-y-8">
                        {/* Kartu Statistik Siswa */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 shadow-lg rounded-xl flex flex-col justify-between">
                                <div>
                                    <h2 className="text-sm text-gray-500 dark:text-gray-400">Progress Belajar</h2>
                                    <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">
                                        {studentAnalytics.completedModules ?? 0}<span className="text-xl">/{studentAnalytics.totalModules ?? 0}</span>
                                        <span className="text-base font-medium ml-1">Modul</span>
                                    </p>
                                </div>
                                <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${studentAnalytics.progress}%` }}></div>
                                    </div>
                                    <p className="text-right text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">{studentAnalytics.progress}% Selesai</p>
                                </div>
                            </div>

                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 shadow-lg rounded-xl">
                                <h2 className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Nilai</h2>
                                <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">{studentAnalytics.detailedPerformance.reduce((acc, p) => acc + p.moduleScore, 0) / studentAnalytics.detailedPerformance.length || 0}%</p>
                                <ComparisonIndicator
                                    student={studentAnalytics.detailedPerformance.reduce((acc, p) => acc + p.moduleScore, 0) / studentAnalytics.detailedPerformance.length}
                                    average={overallClassAverageScore}
                                    type="score"
                                />
                                <span className="text-xs text-gray-400"> vs. rata-rata kelas ({overallClassAverageScore}%)</span>
                            </div>

                            <div className="hidden sm:block bg-red-100/50 dark:bg-red-900/30 backdrop-blur-sm p-6 shadow-lg rounded-xl border border-red-200 dark:border-red-800/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="text-red-500" />
                                    <h2 className="text-sm text-red-700 dark:text-red-300">Topik Terlemah</h2>
                                </div>
                                <p className="text-xl font-semibold mt-1 text-red-900 dark:text-red-200">{studentAnalytics.weakestTopic?.topicTitle ?? 'N/A'}</p>
                                {studentAnalytics.weakestTopic &&
                                    <span className="text-red-600 dark:text-red-400 text-sm">
                                        Nilai: {studentAnalytics.weakestTopic.score}%
                                    </span>}
                            </div>
                        </div>

                        <div className="block sm:hidden bg-red-100/50 dark:bg-red-900/30 backdrop-blur-sm p-6 shadow-lg rounded-xl border border-red-200 dark:border-red-800/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="text-red-500" />
                                <h2 className="text-sm text-red-700 dark:text-red-300">Topik Terlemah</h2>
                            </div>
                            <p className="text-xl font-semibold mt-1 text-red-900 dark:text-red-200">{studentAnalytics.weakestTopic?.topicTitle ?? 'N/A'}</p>
                            {studentAnalytics.weakestTopic &&
                                <span className="text-red-600 dark:text-red-400 text-sm">
                                    Nilai: {studentAnalytics.weakestTopic.score}%
                                </span>}
                        </div>

                        {/* Detail Performa & Grafik */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-5 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Detail Performa per Modul</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Menampilkan data hasil tes akhir setiap modul yang dikerjakan.</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                                        <thead className="text-xs text-gray-700 uppercase bg-white/60 dark:bg-gray-700/60 dark:text-gray-300">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 rounded-l-lg">Modul</th>
                                                <th scope="col" className="px-4 py-3 text-center">Waktu Belajar</th>
                                                <th scope="col" className="px-4 py-3 text-center hidden md:table-cell">Perbandingan Waktu</th>
                                                <th scope="col" className="px-4 py-3 text-center">Nilai Akhir Modul</th>
                                                <th scope="col" className="px-4 py-3 text-center hidden md:table-cell">Perbandingan Nilai</th>
                                                <th scope="col" className="px-4 py-3 text-center rounded-r-lg">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentAnalytics.detailedPerformance.map(perf => (
                                                <StudentPerformanceRow
                                                    key={perf.moduleTitle}
                                                    perf={perf}
                                                    classModuleData={analytics.moduleAnalytics?.find(
                                                        (mod) => mod.moduleTitle === perf.moduleTitle
                                                    )}
                                                    classTopicAnalytics={analytics.topicAnalytics}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {studentComparisonChartData.length > 0 && (
                                <div className="lg:col-span-5 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Perbandingan Nilai Siswa vs. Rata-rata Kelas</h3>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <RechartsBarChart
                                            data={studentComparisonChartData}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            barCategoryGap="35%"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                            <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={80}
                                                
                                                tick={{ fontSize: 12 }}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    backdropFilter: 'blur(5px)',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                }}
                                                labelStyle={{ fontWeight: 'bold', color: '#333' }}
                                                formatter={(value: number, name: string) => [`${value}%`, name]}
                                            />
                                            <Legend />
                                            <Bar dataKey="Rata-rata Kelas" fill="#9ca3af" radius={[0, 4, 4, 0]} barSize={10} />
                                            <Bar dataKey="Nilai Siswa" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">Pilih siswa untuk melihat analitik individual.</div>
                )}
            </div>


        </div>
    );
}

const StudentPerformanceRow = ({ perf, classModuleData, classTopicAnalytics }: {
    perf: StudentAnalyticsData['detailedPerformance'][0],
    classModuleData: AdminAnalyticsData['moduleAnalytics'] extends (infer U)[] ? U : never | undefined,
    classTopicAnalytics: AdminAnalyticsData['topicAnalytics']
}) => {
    const classAverageScore = classModuleData?.averageScore;
    const classAverageTime = classModuleData?.averageTimeInSeconds;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <tr className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <th scope="row" className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center">
                    {perf.topics.length > 0 && (
                        isExpanded ? <ChevronDown size={16} className="mr-2 flex-shrink-0" /> : <ChevronRight size={16} className="mr-2 flex-shrink-0" />
                    )}
                    <span className={perf.topics.length === 0 ? 'ml-6' : ''}>{perf.moduleTitle}</span>
                </th>
                <td className="px-4 py-3 text-center">{formatTime(perf.timeInSeconds)}</td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                    <ComparisonIndicator
                        student={perf.timeInSeconds}
                        average={classAverageTime ?? 0}
                        type="time"
                    />
                </td>
                <td className="px-4 py-3 text-center font-medium">{perf.moduleScore > 0 ? `${perf.moduleScore}%` : '-'}</td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                    <ComparisonIndicator
                        student={perf.moduleScore}
                        average={classAverageScore ?? 0} type="score" />
                </td>
                <td className="px-4 py-3 text-center">
                    {getStudentModuleStatusBadge(
                        perf.moduleScore,
                        perf.timeInSeconds,
                        classAverageScore,
                        classAverageTime
                    )}
                </td>
            </tr>
            {isExpanded && perf.topics.length > 0 && (
                <tr className="bg-gray-100 dark:bg-gray-900/50">
                    <td colSpan={6} className="p-0">
                        <div className="px-8 py-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detail Tes per Topik</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Rincian nilai dan waktu pengerjaan untuk setiap topik di dalam modul ini.</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-600">
                                        <tr>
                                            <th className="py-2 font-semibold" style={{ width: '50%' }}>Nama Topik</th>
                                            <th className="py-2 font-semibold text-center">Waktu Belajar</th>
                                            <th className="py-2 font-semibold text-center">Nilai Tes Topik</th>
                                            <th className="py-2 font-semibold text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {perf.topics.map(topic => {
                                            const classTopicData = classTopicAnalytics?.find(t => t.topicTitle === topic.topicTitle);
                                            return (
                                                <tr key={topic.topicTitle} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50">
                                                    <td className="py-2 text-gray-700 dark:text-gray-300">{topic.topicTitle}</td>
                                                    <td className="py-2 text-center text-gray-600 dark:text-gray-400">{formatTime(topic.timeInSeconds)}</td>
                                                    <td className="py-2 text-center font-semibold text-gray-800 dark:text-gray-200">{topic.score}%</td>
                                                    <td className="py-2 text-center">
                                                        {getStudentModuleStatusBadge(topic.score, topic.timeInSeconds, classTopicData?.averageScore, classTopicData?.averageTimeInSeconds)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};
"use client";

import React, { useEffect, useMemo, useState, FC, ReactNode, useRef } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { authFetch } from '@/lib/authFetch';
import { BarChart as BarChartIcon, Users, Clock, Percent, Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, PieChart, UserCheck, ChevronDown, ChevronRight, ChevronLeft, BookOpen, Target, BarChart2, Search, ChevronUp, Printer, X, Loader2, ArrowUpNarrowWide, ArrowDownNarrowWide, ArrowDownAZ, Trophy, Filter } from 'lucide-react';

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
    averageScore?: number; // Tambahkan properti ini
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

const getStatusBadge = (weightedScore: number, averageScore: number = -1, averageTime: number = -1) => {
    if (averageScore === 0 && averageTime === 0) {
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs dark:bg-gray-700 dark:text-gray-300">Belum ada data</span>;
    }
    if (weightedScore >= 1.4) {
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs dark:bg-red-900/40 dark:text-red-300">Butuh Evaluasi</span>;
    }
    if (weightedScore >= 0.7) {
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs dark:bg-yellow-900/40 dark:text-yellow-300">Butuh pantauan</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs dark:bg-green-900/40 dark:text-green-300">Baik</span>;
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

const StatCard = ({ title, value, icon, change, changeType, unit, subtext, color = "blue" }: { title: string, value: string | number, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' | 'neutral', unit?: string, subtext?: string, color?: string }) => {
    const colorStyles: Record<string, { border: string, bg: string, text: string, cardBg: string }> = {
        blue: { border: "border-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", cardBg: "bg-blue-50 dark:bg-blue-900/10" },
        yellow: { border: "border-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", cardBg: "bg-yellow-50 dark:bg-yellow-900/10" },
        green: { border: "border-green-500", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", cardBg: "bg-green-50 dark:bg-green-900/10" },
        indigo: { border: "border-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", cardBg: "bg-indigo-50 dark:bg-indigo-900/10" },
        purple: { border: "border-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", cardBg: "bg-purple-50 dark:bg-purple-900/10" },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <div className={`bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl border-l-4 border-gray-300 dark:border-gray-600 flex flex-col justify-between transition-all hover:shadow-xl`}>
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h2>
                    <div className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
                        {icon}
                    </div>
                </div>
                <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">
                    {value}{unit && <span className="text-xl text-gray-500 dark:text-gray-400 ml-1">{unit}</span>}
                </p>
            </div>
            {(change || subtext) && (
                <div className="mt-4">
                     {change && (
                        <div className="flex items-center text-xs font-medium">
                             <span className={`${changeType === 'increase' ? 'text-green-600 dark:text-green-400' : changeType === 'decrease' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                {change}
                            </span>
                        </div>
                    )}
                    {subtext && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">{subtext}</span>
                    )}
                </div>
            )}
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

const getStatusHTML = (
    studentModuleScore: number,
    studentTimeInSeconds: number,
    classAverageScore: number | undefined,
    classAverageTimeInSeconds: number | undefined
) => {
    if (classAverageScore === undefined || classAverageTimeInSeconds === undefined || classAverageTimeInSeconds <= 0) {
        return `<span style="padding: 3px 8px; background-color: #f3f4f6; color: #374151; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid #e5e7eb;">Data Kelas -</span>`;
    }

    if (studentModuleScore <= 0 && studentTimeInSeconds <= 0) {
        return `<span style="padding: 3px 8px; background-color: #fee2e2; color: #b91c1c; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid #fecaca;">Butuh Evaluasi</span>`;
    }

    const scoreRatio = classAverageScore > 0 ? (studentModuleScore / classAverageScore) : (studentModuleScore > 0 ? 2 : 1);
    const timeRatio = studentTimeInSeconds > 0 ? (classAverageTimeInSeconds / studentTimeInSeconds) : 0.1;
    const performanceIndex = (scoreRatio + timeRatio) / 2;

    const excellentThreshold = 1.2;
    const goodThreshold = 0.9;
    const monitorThreshold = 0.7;

    let statusText = 'Dipantau';
    let bgColor = '#fef3c7';
    let textColor = '#b45309';
    let borderColor = '#fde68a';

    if (performanceIndex >= excellentThreshold) {
        statusText = 'Sangat Baik';
        bgColor = '#dcfce7';
        textColor = '#15803d';
        borderColor = '#bbf7d0';
    } else if (performanceIndex >= goodThreshold) {
        statusText = 'Baik';
        bgColor = '#dbeafe';
        textColor = '#1d4ed8';
        borderColor = '#bfdbfe';
    } else if (performanceIndex >= monitorThreshold) {
        statusText = 'Butuh Pemantauan';
        bgColor = '#fef3c7';
        textColor = '#b45309';
        borderColor = '#fde68a';
    } else {
        statusText = 'Butuh Evaluasi';
        bgColor = '#fee2e2';
        textColor = '#b91c1c';
        borderColor = '#fecaca';
    }
    return `<span style="padding: 3px 8px; background-color: ${bgColor}; color: ${textColor}; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid ${borderColor};">${statusText}</span>`;
};

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<AdminAnalyticsData>({});
    const [loading, setLoading] = useState(true); // ... (rest of the state variables)
    const [error, setError] = useState<string | null>(null); // ... (rest of the state variables)
    const [currentPage, setCurrentPage] = useState(1); // ... (rest of the state variables)
    const [modulesPerPage, setModulesPerPage] = useState(6); // ... (rest of the state variables)
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set()); // ... (rest of the state variables)
    const [searchTerm, setSearchTerm] = useState(''); // ... (rest of the state variables)
    const [allUsers, setAllUsers] = useState<{ _id: string, name: string, kelas?: string, averageScore?: number }[]>([]); // ... (rest of the state variables)
    const [selectedStudentId, setSelectedStudentId] = useState<string>(''); // ... (rest of the state variables)
    const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalyticsData | null>(null); // ... (rest of the state variables)
    const [studentLoading, setStudentLoading] = useState(false); // ... (rest of the state variables)
    const [studentError, setStudentError] = useState<string | null>(null); // ... (rest of the state variables)
    const [topicPages, setTopicPages] = useState<Record<string, number>>({});
    
    // State untuk Dropdown Siswa Custom
    const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [studentDropdownPage, setStudentDropdownPage] = useState(1);
    const [userFilterType, setUserFilterType] = useState<'class' | 'general'>('class');
    const [sortOrder, setSortOrder] = useState<'name_asc' | 'score_asc' | 'score_desc'>('score_asc');
    const studentDropdownRef = useRef<HTMLDivElement>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedStudentsToPrint, setSelectedStudentsToPrint] = useState<Set<string>>(new Set());
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [printModalSearchTerm, setPrintModalSearchTerm] = useState('');
    const [printFilterType, setPrintFilterType] = useState<'class' | 'general'>('class');
    const [printSortOrder, setPrintSortOrder] = useState<'name_asc' | 'score_asc' | 'score_desc'>('score_asc');
    const [selectedClassesForPrint, setSelectedClassesForPrint] = useState<Set<string>>(new Set());
    
    const [leaderboardData, setLeaderboardData] = useState<{ moduleTitle: string, students: { name: string, score: number, kelas?: string }[] }[]>([]);
    const [leaderboardFilter, setLeaderboardFilter] = useState<'global' | 'class'>('global');
    const [selectedLeaderboardClasses, setSelectedLeaderboardClasses] = useState<Set<string>>(new Set());
    const [selectedLeaderboardModule, setSelectedLeaderboardModule] = useState<string>('');
    const [leaderboardPage, setLeaderboardPage] = useState(1);
    const leaderboardItemsPerPage = 5;

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/admin-analytics`);
                if (!res.ok) {
                    throw new Error('Gagal memuat data analitik.');
                }
                const data = await res.json();
                
              
                setAnalytics({ ...data});
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

        const fetchLeaderboard = async () => {
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/module-leaderboard`);
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboardData(data);
                    if (data.length > 0) {
                        setSelectedLeaderboardModule(data[0].moduleTitle);
                    }
                }
            } catch (e) { console.error("Gagal memuat leaderboard:", e); }
        };

        fetchAnalytics();
        fetchUsers();
        fetchLeaderboard();
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
        setTopicPages({});
    }, [modulesPerPage]);

    const uniqueClasses = useMemo(() => {
        const classes = new Set<string>();
        allUsers.forEach(u => {
            if (u.kelas) classes.add(u.kelas);
        });
        return Array.from(classes).sort();
    }, [allUsers]);

    const handleToggleClassFilter = (className: string) => {
        setSelectedClassesForPrint(prev => {
            const newSet = new Set(prev);
            if (newSet.has(className)) newSet.delete(className);
            else newSet.add(className);
            return newSet;
        });
    };

    const handleToggleLeaderboardClass = (className: string) => {
        setSelectedLeaderboardClasses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(className)) newSet.delete(className);
            else newSet.add(className);
            return newSet;
        });
    };

    useEffect(() => {
        setLeaderboardPage(1);
    }, [selectedLeaderboardModule, leaderboardFilter, selectedLeaderboardClasses]);

    // Fix: Scroll otomatis ke section (hash) setelah loading selesai
    useEffect(() => {
        if (!loading && window.location.hash) {
            const id = window.location.hash.substring(1); // Hapus tanda #
            // Beri sedikit jeda agar rendering DOM benar-benar selesai
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
    }, [loading]);

    // Handle click outside untuk menutup dropdown siswa
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
                setIsStudentDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

                // Fallback logic to ensure progress data is always available, in case the API doesn't provide it.
                const totalSystemModules = analytics.moduleAnalytics?.length ?? 0;
                const studentCompletedModules = data.detailedPerformance?.filter(p => p.moduleScore >= 0).length ?? 0; // A module is complete if there's a score (even 0)
                const calculatedProgress = totalSystemModules > 0 ? Math.round((studentCompletedModules / totalSystemModules) * 100) : 0;

                setStudentAnalytics({
                    ...data,
                    totalModules: data.totalModules ?? totalSystemModules,
                    completedModules: data.completedModules ?? studentCompletedModules,
                    progress: data.progress ?? calculatedProgress,
                });
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

    const radarData = useMemo(() => {
        const modules = analytics.moduleAnalytics || [];
        const distribution = analytics.moduleScoreDistribution || [];

        if (modules.length === 0 && distribution.length === 0) return [];

        if (modules.length > 0) {
            const distMap = new Map(distribution.map(d => [d.subject, d]));
            return modules.map(mod => {
                const dist = distMap.get(mod.moduleTitle);
                return {
                    subject: mod.moduleTitle,
                    topicScore: dist ? dist.topicScore : 0,
                    moduleScore: dist ? dist.moduleScore : 0,
                    fullMark: 100
                };
            });
        }
        return distribution;
    }, [analytics.moduleAnalytics, analytics.moduleScoreDistribution]);

    // Logika Filter & Paginasi untuk Dropdown Siswa
    const studentsPerPage = 10;
    const filteredStudents = useMemo(() => {
        let filtered = allUsers.filter(user => user.name.toLowerCase().includes(studentSearchTerm.toLowerCase()));
        
        // Filter berdasarkan tab yang aktif (terisolasi)
        if (userFilterType === 'class') {
            filtered = filtered.filter(u => u.kelas);
        } else {
            filtered = filtered.filter(u => !u.kelas);
        }

        // Sorting logic
        filtered.sort((a, b) => {
            if (sortOrder === 'name_asc') {
                return a.name.localeCompare(b.name);
            } else if (sortOrder === 'score_asc') {
                return (a.averageScore || 0) - (b.averageScore || 0);
            } else {
                return (b.averageScore || 0) - (a.averageScore || 0);
            }
        });

        return filtered;
    }, [allUsers, studentSearchTerm, userFilterType, sortOrder]);

    const paginatedStudents = useMemo(() => {
        const start = (studentDropdownPage - 1) * studentsPerPage;
        return filteredStudents.slice(start, start + studentsPerPage);
    }, [filteredStudents, studentDropdownPage, studentsPerPage]);

    const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage);

    // Reset halaman dropdown saat pencarian berubah
    useEffect(() => setStudentDropdownPage(1), [studentSearchTerm, userFilterType]);

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

    // --- Print Logic (Student Selection) ---
    const handleToggleStudentForPrint = (studentId: string) => {
        setSelectedStudentsToPrint(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) newSet.delete(studentId);
            else newSet.add(studentId);
            return newSet;
        });
    };

    const handleSelectAllStudentsForPrint = (filteredStudents: typeof allUsers) => {
        const allSelected = filteredStudents.every(u => selectedStudentsToPrint.has(u._id));
        const newSet = new Set(selectedStudentsToPrint);
        
        filteredStudents.forEach(u => {
            if (allSelected) newSet.delete(u._id);
            else newSet.add(u._id);
        });
        setSelectedStudentsToPrint(newSet);
    };

    const handleBatchPrint = async () => {
        if (selectedStudentsToPrint.size === 0) {
            alert("Pilih setidaknya satu siswa untuk dicetak.");
            return;
        }

        setIsGeneratingReport(true);

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Pop-up diblokir. Izinkan pop-up untuk mencetak.");
            setIsGeneratingReport(false);
            return;
        }

        // Array to store collected data
        const reportData: { name: string; data: StudentAnalyticsData }[] = [];

        try {
            printWindow.document.write(`
            <html>
                <head>
                    <title>Menyiapkan Laporan...</title>
                    <style>body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; color: #555; }</style>
                </head>
                <body>
                    <h2>Sedang menyiapkan laporan untuk ${selectedStudentsToPrint.size} siswa...</h2>
                </body>
            </html>
        `);

            const studentsToPrint = allUsers.filter(u => selectedStudentsToPrint.has(u._id));
            
            // Urutkan siswa berdasarkan filter yang dipilih (printSortOrder)
            studentsToPrint.sort((a, b) => {
                if (printSortOrder === 'name_asc') {
                    return a.name.localeCompare(b.name);
                } else if (printSortOrder === 'score_asc') {
                    return (a.averageScore || 0) - (b.averageScore || 0);
                } else {
                    return (b.averageScore || 0) - (a.averageScore || 0);
                }
            });

            for (const student of studentsToPrint) {
                // Fetch data for each student individually
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/student-analytics/${student._id}`);
                if (!res.ok) continue;
                const rawData: StudentAnalyticsData = await res.json();
                
                // Fallback logic: Hitung manual jika data API kosong agar tidak undefined saat dicetak
                const totalSystemModules = analytics.moduleAnalytics?.length ?? 0;
                const studentCompletedModules = rawData.detailedPerformance?.filter(p => p.moduleScore >= 0).length ?? 0;
                const calculatedProgress = totalSystemModules > 0 ? Math.round((studentCompletedModules / totalSystemModules) * 100) : 0;

                const data = {
                    ...rawData,
                    totalModules: rawData.totalModules ?? totalSystemModules,
                    completedModules: rawData.completedModules ?? studentCompletedModules,
                    progress: rawData.progress ?? calculatedProgress,
                };

                reportData.push({ name: student.name, data });
            }

            // Generate single HTML for all students
            const finalHtml = generateBatchReportHTML(reportData);

            printWindow.document.open();
            printWindow.document.write(finalHtml);
            printWindow.document.close();

        } catch (error) {
            console.error("Error generating report:", error);
            printWindow.close();
            alert("Terjadi kesalahan saat membuat laporan.");
        } finally {
            setIsGeneratingReport(false);
            setIsPrintModalOpen(false);
        }
    };

    const handlePrintModulePerformance = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Pop-up diblokir. Izinkan pop-up untuk mencetak.");
            return;
        }

        const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Menggunakan logika yang sama dengan getStatusBadge yang sudah ada
        const getPrintStatusBadge = (weightedScore: number, averageScore: number, averageTime: number) => {
            if (averageScore === 0 && averageTime === 0) {
                return '<span style="color: #4b5563; background-color: #f3f4f6; padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Belum ada data</span>';
            }
            if (weightedScore >= 1.4) {
                return '<span style="color: #b91c1c; background-color: #fee2e2; padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Butuh Evaluasi</span>';
            }
            if (weightedScore >= 0.7) {
                return '<span style="color: #b45309; background-color: #fef3c7; padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Butuh Pantauan</span>';
            }
            return '<span style="color: #15803d; background-color: #dcfce7; padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Baik</span>';
        };

        const tableRows = filteredData.map((modul, index) => {
            const moduleRow = `
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <td class="center" style="font-weight: 600;">${index + 1}</td>
                    <td style="font-weight: 600;">${modul.moduleTitle}</td>
                    <td class="center" style="font-weight: 600;">${modul.averageScore}%</td>
                    <td class="center" style="font-weight: 600;">${modul.remedialRate}%</td>
                    <td class="center" style="font-weight: 600;">${formatTime(modul.averageTimeInSeconds)}</td>
                    <td class="center">${getPrintStatusBadge(modul.weightedScore, modul.averageScore, modul.averageTimeInSeconds)}</td>
                </tr>
            `;

            const topicRows = modul.topics.map(topic => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td></td>
                    <td style="padding-left: 25px; color: #64748b; font-size: 9pt;"><span style="color: #cbd5e1; margin-right: 6px;">↳</span> ${topic.topicTitle}</td>
                    <td class="center" style="color: #4b5563; font-size: 9pt;">${topic.averageScore}%</td>
                    <td class="center" style="color: #4b5563; font-size: 9pt;">${topic.remedialRate}%</td>
                    <td class="center" style="color: #4b5563; font-size: 9pt;">${formatTime(topic.averageTimeInSeconds)}</td>
                    <td class="center">${getPrintStatusBadge(topic.weightedScore, topic.averageScore, topic.averageTimeInSeconds)}</td>
                </tr>
            `).join('');

            return moduleRow + topicRows;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Laporan Performa Modul</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                <style>
                    @page { size: A4; margin: 15mm; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; font-size: 10pt; -webkit-print-color-adjust: exact; }
                    
                    /* Decorative Top Bar */
                    .top-bar { height: 8px; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%); width: 100%; position: absolute; top: 0; left: 0; }
                    
                    .container { padding: 20px 0; }
                    
                    .header { text-align: center; margin-bottom: 40px; position: relative; }
                    .header h1 { font-size: 24pt; font-weight: 800; margin: 0; color: #1e293b; letter-spacing: -0.5px; }
                    .header p { font-size: 12pt; color: #64748b; margin: 5px 0 0; font-weight: 500; }
                    .header::after { content: ''; display: block; width: 60px; height: 4px; background: #3b82f6; margin: 15px auto 0; border-radius: 2px; }

                    .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; }
                    .meta-item { display: flex; flex-direction: column; }
                    .meta-label { font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
                    .meta-value { font-size: 11pt; font-weight: 600; color: #334155; }

                    table.report-table { width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden; }
                    table.report-table th { background-color: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 8pt; padding: 12px 15px; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; text-align: left; }
                    table.report-table td { border-bottom: 1px solid #f1f5f9; padding: 10px 15px; font-size: 9pt; vertical-align: middle; color: #334155; }
                    table.report-table tr:last-child td { border-bottom: none; }
                    
                    .center { text-align: center !important; }
                    
                    .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #94a3b8; }
                    .footer-brand { font-weight: 700; color: #cbd5e1; letter-spacing: 1px; }
                </style>
            </head>
            <body>
                <div class="top-bar"></div>
                <div id="content">
                    <div class="header">
                        <h1>LAPORAN PERFORMA MODUL</h1>
                        <p>Analisis Rata-rata Nilai dan Waktu Pengerjaan</p>
                    </div>
                    
                    <div class="meta-box">
                        <div class="meta-item">
                            <span class="meta-label">Tanggal Cetak</span>
                            <span class="meta-value">${dateStr}</span>
                        </div>
                        <div class="meta-item" style="text-align: right;">
                            <span class="meta-label">Total Modul</span>
                            <span class="meta-value">${filteredData.length} Modul</span>
                        </div>
                    </div>

                    <table class="report-table">
                        <thead>
                            <tr>
                                <th width="5%" class="center">No</th>
                                <th width="35%">Modul / Topik</th>
                                <th width="15%" class="center">Rata-rata Nilai</th>
                                <th width="15%" class="center">Tingkat Remedial</th>
                                <th width="15%" class="center">Rata-rata Waktu</th>
                                <th width="15%" class="center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <span>Dicetak otomatis oleh sistem KELAS.</span>
                        <span class="footer-brand">KELAS ANALYTICS</span>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        const element = document.getElementById('content');
                        const opt = {
                            margin: 10,
                            filename: 'Laporan_Performa_Modul.pdf',
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        };
                        html2pdf().set(opt).from(element).save();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const generateBatchReportHTML = (students: { name: string; data: StudentAnalyticsData }[]) => {
        const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let tableRows = '';
        let no = 1;

        students.forEach(({ name, data }) => {
            const modules = data.detailedPerformance || [];
            
            // Hitung total baris (rowspan) untuk siswa ini
            let studentRowCount = 0;
            if (modules.length === 0) {
                studentRowCount = 1;
            } else {
                modules.forEach(m => {
                    studentRowCount += 1; // Baris untuk Modul
                    studentRowCount += m.topics.length; // Baris untuk setiap Topik
                });
            }

            let isFirstStudentRow = true;

            if (modules.length === 0) {
                 tableRows += `
                    <tr>
                        <td class="center">${no++}</td>
                        <td><strong>${name}</strong></td>
                        <td class="center">${data.progress ?? 0}%</td>
                        <td class="center">${data.averageScore ?? 0}</td>
                        <td class="center">-</td>
                        <td colspan="2" class="center">Belum Ada Data</td>
                    </tr>
                `;
            } else {
                modules.forEach((mod) => {
                    // 1. Baris Modul
                    tableRows += '<tr>';

                    // Kolom Siswa (Rowspan) - Hanya render di baris pertama siswa
                    if (isFirstStudentRow) {
                        const progress = data.progress ?? 0;
                        const avgScore = data.averageScore ?? 0;
                        const weakTopic = (data.weakestTopic && data.weakestTopic.score < 70) 
                            ? `${data.weakestTopic.topicTitle} (${data.weakestTopic.score}%)` 
                            : '-';
                        const weakTopicStyle = (data.weakestTopic && data.weakestTopic.score < 70) ? 'color: #dc2626; font-weight: 600;' : 'color: #6b7280;';

                        tableRows += `<td class="center" rowspan="${studentRowCount}" style="vertical-align: top; padding-top: 10px;">${no++}</td>`;
                        tableRows += `<td rowspan="${studentRowCount}" style="vertical-align: top; padding-top: 10px;"><strong>${name}</strong></td>`;
                        tableRows += `<td class="center" rowspan="${studentRowCount}" style="vertical-align: top; padding-top: 10px;">${progress}%</td>`;
                        tableRows += `<td class="center" rowspan="${studentRowCount}" style="vertical-align: top; padding-top: 10px;">${avgScore}</td>`;
                        tableRows += `<td rowspan="${studentRowCount}" style="vertical-align: top; padding-top: 10px; ${weakTopicStyle}">${weakTopic}</td>`;
                        isFirstStudentRow = false;
                    }

                    // Kolom Modul (Judul & Nilai)
                    const modScoreDisplay = mod.moduleScore > 0 ? mod.moduleScore : '-';
                    const scoreClass = mod.moduleScore >= 70 ? 'score-good' : (mod.moduleScore > 0 ? 'score-bad' : '');
                    
                    tableRows += `<td style="font-weight: 600; background-color: #f9fafb; border-left: 1px solid #e5e7eb;">${mod.moduleTitle}</td>`;
                    tableRows += `<td class="center" style="font-weight: 600; background-color: #f9fafb;"><span class="${scoreClass}">${modScoreDisplay}</span></td>`;
                    
                    tableRows += '</tr>';

                    // 2. Baris Topik (Loop)
                    mod.topics.forEach((topic) => {
                        tableRows += '<tr>';
                        // Tidak perlu render kolom siswa lagi (sudah rowspan)

                        const topicScoreDisplay = topic.score > 0 ? topic.score : '-';
                        const topicScoreClass = topic.score >= 70 ? 'text-good' : (topic.score > 0 ? 'text-bad' : '');

                        tableRows += `<td style="padding-left: 25px; color: #4b5563; font-size: 9pt; border-left: 1px solid #e5e7eb;"><span style="color: #9ca3af; margin-right: 4px;">↳</span> ${topic.topicTitle}</td>`;
                        tableRows += `<td class="center"><span class="${topicScoreClass}">${topicScoreDisplay}</span></td>`;
                        
                        tableRows += '</tr>';
                    });
                });
            }
        });

        return `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Laporan Hasil Belajar</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.5; font-size: 10pt; -webkit-print-color-adjust: exact; }
                    
                    .top-bar { height: 8px; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%); width: 100%; position: absolute; top: 0; left: 0; }
                    
                    .container { padding: 20px 0; }

                    .header { text-align: center; margin-bottom: 30px; position: relative; }
                    .header h1 { font-size: 22pt; font-weight: 800; margin: 0; color: #1e293b; letter-spacing: -0.5px; }
                    .header p { font-size: 11pt; color: #64748b; margin: 5px 0 0; font-weight: 500; }
                    .header::after { content: ''; display: block; width: 60px; height: 4px; background: #3b82f6; margin: 15px auto 0; border-radius: 2px; }
                    
                    .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
                    .meta-item { display: flex; flex-direction: column; }
                    .meta-label { font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
                    .meta-value { font-size: 11pt; font-weight: 600; color: #334155; }
                    
                    table.report-table { width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden; }
                    table.report-table th { background-color: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 8pt; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; text-align: left; }
                    table.report-table td { border-bottom: 1px solid #f1f5f9; padding: 8px 12px; font-size: 9pt; vertical-align: top; color: #334155; }
                    table.report-table tr:last-child td { border-bottom: none; }
                    
                    .center { text-align: center; }
                    .score-good { font-weight: 700; color: #059669; }
                    .score-bad { font-weight: 700; color: #dc2626; }
                    .text-good { color: #059669; }
                    .text-bad { color: #dc2626; }

                    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #94a3b8; }
                    .footer-brand { font-weight: 700; color: #cbd5e1; letter-spacing: 1px; }
                </style>
            </head>
            <body>
                <div class="top-bar"></div>
                <div id="content">
                    <div class="header">
                        <h1>LAPORAN HASIL BELAJAR SISWA</h1>
                        <p>Rekapitulasi Nilai Modul dan Topik</p>
                    </div>

                    <div class="meta-box">
                        <div class="meta-item">
                            <span class="meta-label">Tanggal Cetak</span>
                            <span class="meta-value">${dateStr}</span>
                        </div>
                        <div class="meta-item" style="text-align: right;">
                            <span class="meta-label">Total Siswa</span>
                            <span class="meta-value">${students.length} Orang</span>
                        </div>
                    </div>

                    <table class="report-table">
                        <thead>
                            <tr>
                                <th width="3%" class="center">No</th>
                                <th width="15%">Nama Siswa</th>
                                <th width="8%" class="center">Progres</th>
                                <th width="8%" class="center">Rata-rata</th>
                                <th width="15%">Topik Perlu Perhatian</th>
                                <th width="35%">Modul / Topik</th>
                                <th width="10%" class="center">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <span>Dicetak otomatis oleh sistem KELAS.</span>
                        <span class="footer-brand">KELAS ANALYTICS</span>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        const element = document.getElementById('content');
                        const opt = {
                            margin: 10,
                            filename: 'Laporan_Hasil_Belajar_Siswa.pdf',
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
                        };
                        html2pdf().set(opt).from(element).save();
                    }
                </script>
            </body>
            </html>
            `;
    };

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
                <StatCard title="Jumlah Siswa" value={analytics.totalUsers ?? 0} icon={<Users size={20} />} color="blue" change="+12 minggu ini" changeType="increase" />
                <StatCard title="Rata-rata Waktu" value={42} unit=" mnt" icon={<Clock size={20} />} color="yellow" change="↓ 5% lebih cepat" changeType="neutral" />
                <StatCard title="Rata-rata Nilai" value={analytics.overallAverageScore ?? 0} unit="%" icon={<Percent size={20} />} color="green" change="+3% minggu ini" changeType="increase" />
                <StatCard title="Siswa Aktif" value={analytics.activeUsers ?? 0} icon={<UserCheck size={20} />} color="indigo" subtext={`${analytics.totalUsers ? Math.round(((analytics.activeUsers || 0) / analytics.totalUsers) * 100) : 0}% aktif 7 hari terakhir`} />
            </div>



            {/* SECTION 3: ANALITIK PER MODUL & TOPIK */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-12 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Analitik Per Modul & Topik</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Data performa siswa berdasarkan hasil tes topik dan tes akhir modul. Gunakan untuk mengidentifikasi modul atau topik yang memerlukan perhatian lebih.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-200 dark:border-gray-700 pb-8">
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border-l-4 border-gray-300 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Kecepatan Belajar</h2>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Clock size={20} />
                            </div>
                        </div>
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
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border-l-4 border-gray-300 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Distribusi Nilai</h2>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <PieChart size={20} />
                            </div>
                        </div>
                        <div className="h-96 rounded flex items-center justify-center text-gray-500">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="col-span-1 sm:col-span-2 flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Detail Performa per Modul</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 ">Menampilkan data rata-rata hasil tes akhir setiap modul yang dikerjakan siswa.</p>
                        </div>
                        <button
                            onClick={handlePrintModulePerformance}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            <Printer size={16} />
                            Cetak
                        </button>
                    </div>
                    {currentModules.length > 0 ? (
                        currentModules.map((modul) => (
                            <div key={modul.moduleTitle} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md">

                                <div className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${modul.weightedScore >= 1.4 ? 'bg-red-100 text-red-600' : modul.weightedScore >= 0.7 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'} dark:bg-gray-700`}>
                                                <BookOpen size={20} />
                                            </div>
                                            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 pr-4 line-clamp-1" title={modul.moduleTitle}>{modul.moduleTitle}</h3>
                                        </div>
                                        {getStatusBadge(modul.weightedScore, modul.averageScore, modul.averageTimeInSeconds)}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-4 text-center border-t border-gray-100 dark:border-gray-700 pt-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rata-rata Nilai</p>
                                            <p className="text-base font-bold text-gray-800 dark:text-gray-200">{modul.averageScore}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tingkat Remedial</p>
                                            <p className="text-base font-bold text-gray-800 dark:text-gray-200">{modul.remedialRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rata-rata Waktu</p>
                                            <p className="text-base font-bold text-gray-800 dark:text-gray-200">{formatTime(modul.averageTimeInSeconds)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Topics List (conditionally rendered) */}
                                {expandedModules.has(modul.moduleTitle) && (
                                    <div className="bg-gray-50 dark:bg-gray-900/30 px-5 pb-4 border-t border-gray-100 dark:border-gray-700">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-3 mb-2">Detail Tes per Topik</h4>
                                        {modul.topics.length > 0 ? (
                                            <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                                {modul.topics.slice(((topicPages[modul.moduleTitle] || 1) - 1) * modulesPerPage, (topicPages[modul.moduleTitle] || 1) * modulesPerPage).map(topic => (
                                                    <div key={topic.topicTitle} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-2 gap-2">
                                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2" title={topic.topicTitle}>
                                                                {topic.topicTitle}
                                                            </span>
                                                            <div className="flex-shrink-0 scale-90 origin-top-right">
                                                                {getStatusBadge(topic.weightedScore, topic.averageScore, topic.averageTimeInSeconds)}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-500 dark:text-gray-400 mb-0.5">Waktu</span>
                                                                <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                                    <Clock size={12} className="text-gray-400" />
                                                                    {formatTime(topic.averageTimeInSeconds)}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col text-right">
                                                                <span className="text-gray-500 dark:text-gray-400 mb-0.5">Nilai</span>
                                                                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{topic.averageScore}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {Math.ceil(modul.topics.length / modulesPerPage) > 1 && (
                                                <div className="flex justify-center mt-4 gap-2">
                                                    <button
                                                        onClick={() => setTopicPages(prev => ({ ...prev, [modul.moduleTitle]: Math.max((prev[modul.moduleTitle] || 1) - 1, 1) }))}
                                                        disabled={(topicPages[modul.moduleTitle] || 1) === 1}
                                                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                                                    >
                                                        Prev
                                                    </button>
                                                    <span className="text-xs flex items-center text-gray-600 dark:text-gray-400">
                                                        {(topicPages[modul.moduleTitle] || 1)} / {Math.ceil(modul.topics.length / modulesPerPage)}
                                                    </span>
                                                    <button
                                                        onClick={() => setTopicPages(prev => ({ ...prev, [modul.moduleTitle]: Math.min((prev[modul.moduleTitle] || 1) + 1, Math.ceil(modul.topics.length / modulesPerPage)) }))}
                                                        disabled={(topicPages[modul.moduleTitle] || 1) === Math.ceil(modul.topics.length / modulesPerPage)}
                                                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            )}
                                            </>
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
            <div id="analitik-siswa" className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 mb-12 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Analitik Siswa Individual</h2>
                        {allUsers.length > 0 && (
                            <button
                                onClick={() => setIsPrintModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                            >
                                <Printer size={16} />
                                Cetak Laporan
                            </button>
                        )}
                    </div>
                    
                    {/* Custom Dropdown dengan Search & Pagination */}
                    <div className="mt-4 md:mt-0 md:w-1/3 relative" ref={studentDropdownRef}>
                        <label className="sr-only">Pilih Siswa</label>
                        <button
                            type="button"
                            onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                            className="flex items-center justify-between w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <span className="truncate font-medium">
                                {(() => {
                                    const selected = allUsers.find(u => u._id === selectedStudentId);
                                    if (!selected) return "Pilih Siswa";
                                    return selected.kelas ? `${selected.name} (${selected.kelas})` : selected.name;
                                })()}
                            </span>
                            {isStudentDropdownOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                        </button>

                        {isStudentDropdownOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                {/* Search Bar */}
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <div className="relative mb-2">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama siswa..."
                                            value={studentSearchTerm}
                                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    </div>
                                    {/* Tab Filter Terisolasi */}
                                    <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-lg gap-1">
                                        <button
                                            onClick={() => setUserFilterType('class')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${userFilterType === 'class' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                        >
                                            Siswa Kelas
                                        </button>
                                        <button
                                            onClick={() => setUserFilterType('general')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${userFilterType === 'general' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                        >
                                            User Umum
                                        </button>
                                    </div>
                                    
                                    {/* Sort Controls */}
                                    <div className="flex items-center gap-1 mt-2 justify-end">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 mr-1">Urutkan:</span>
                                        <button onClick={() => setSortOrder('score_asc')} className={`p-1 rounded transition-colors ${sortOrder === 'score_asc' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Nilai Terendah (Jelek ke Bagus)">
                                            <ArrowDownNarrowWide size={14} />
                                        </button>
                                        <button onClick={() => setSortOrder('score_desc')} className={`p-1 rounded transition-colors ${sortOrder === 'score_desc' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Nilai Tertinggi (Bagus ke Jelek)">
                                            <ArrowUpNarrowWide size={14} />
                                        </button>
                                        <button onClick={() => setSortOrder('name_asc')} className={`p-1 rounded transition-colors ${sortOrder === 'name_asc' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Nama A-Z">
                                            <ArrowDownAZ size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* List Siswa */}
                                <ul className="max-h-60 overflow-y-auto">
                                    {paginatedStudents.length > 0 ? (
                                        paginatedStudents.map(user => (
                                            <li key={user._id}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStudentId(user._id);
                                                        setIsStudentDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${selectedStudentId === user._id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{user.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ (user.averageScore || 0) < 60 ? 'bg-red-100 text-red-600' : (user.averageScore || 0) < 80 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600' }`}>
                                                                {user.averageScore || 0}%
                                                            </span>
                                                            {user.kelas ? (
                                                                <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                                                    {user.kelas}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">Umum</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-8 text-sm text-gray-500 text-center italic">
                                            Siswa tidak ditemukan
                                        </li>
                                    )}
                                </ul>

                                {/* Pagination Controls */}
                                {totalStudentPages > 1 && (
                                    <div className="flex justify-between items-center p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                        <button
                                            onClick={() => setStudentDropdownPage(p => Math.max(1, p - 1))}
                                            disabled={studentDropdownPage === 1}
                                            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Sebelumnya
                                        </button>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {studentDropdownPage} / {totalStudentPages}
                                        </span>
                                        <button
                                            onClick={() => setStudentDropdownPage(p => Math.min(totalStudentPages, p + 1))}
                                            disabled={studentDropdownPage === totalStudentPages}
                                            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {studentLoading ? (
                    <div className="text-center py-10">Memuat data siswa...</div>
                ) : studentError ? (
                    <div className="text-center py-10 text-red-500">Error: {studentError}</div>
                ) : studentAnalytics ? (
                    <div className="space-y-8">
                        {/* Kartu Statistik Siswa */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
                            <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Progress Belajar</h2>
                                        <div className="hidden sm:block p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                            <BookOpen size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">
                                        {studentAnalytics.completedModules ?? 0}<span className="text-xl text-gray-500 dark:text-gray-400">/{studentAnalytics.totalModules ?? 0}</span>
                                        <span className="text-sm font-medium ml-1 text-gray-500 dark:text-gray-400">Modul</span>
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400">Progres</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{studentAnalytics.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${studentAnalytics.progress}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Rata-rata Nilai</h2>
                                        <div className="hidden sm:block p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                            <Target size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-gray-200">
                                        {studentAnalytics.averageScore ?? 0}%
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <ComparisonIndicator
                                        student={studentAnalytics.averageScore ?? 0}
                                        average={overallClassAverageScore}
                                        type="score"
                                    />
                                    <span className="text-xs text-gray-400">vs. kelas ({overallClassAverageScore}%)</span>
                                </div>
                            </div>

                            <div className="hidden sm:flex bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Topik Perlu Perhatian</h2>
                                        <div className={`p-2 rounded-lg ${studentAnalytics.weakestTopic && studentAnalytics.weakestTopic.score < 70 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                            {studentAnalytics.weakestTopic && studentAnalytics.weakestTopic.score < 70 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
                                        {studentAnalytics.weakestTopic 
                                            ? (studentAnalytics.weakestTopic.score < 70 ? studentAnalytics.weakestTopic.topicTitle : 'Semua topik aman')
                                            : 'Belum ada data'}
                                    </p>
                                </div>
                                
                                {studentAnalytics.weakestTopic && studentAnalytics.weakestTopic.score < 70 && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-gray-500 dark:text-gray-400">Skor Penguasaan</span>
                                            <span className="font-bold text-red-600 dark:text-red-400">{studentAnalytics.weakestTopic.score}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                                            <div 
                                                className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${studentAnalytics.weakestTopic.score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="block sm:hidden bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h2 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Topik Perlu Perhatian</h2>
                                    <p className="text-lg font-bold mt-1 text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
                                        {studentAnalytics.weakestTopic 
                                            ? (studentAnalytics.weakestTopic.score < 70 ? studentAnalytics.weakestTopic.topicTitle : 'Semua topik aman')
                                            : 'Belum ada data'}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-lg flex-shrink-0 ml-2 ${studentAnalytics.weakestTopic && studentAnalytics.weakestTopic.score < 70 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                    {studentAnalytics.weakestTopic && studentAnalytics.weakestTopic.score < 70 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                </div>
                            </div>
                            
                            {studentAnalytics.weakestTopic && studentAnalytics.weakestTopic.score < 70 && (
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400">Skor Penguasaan</span>
                                        <span className="font-bold text-red-600 dark:text-red-400">{studentAnalytics.weakestTopic.score}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                                        <div 
                                            className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                                            style={{ width: `${studentAnalytics.weakestTopic.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detail Performa & Grafik */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Detail Performa per Modul</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Menampilkan data hasil tes akhir setiap modul yang dikerjakan.</p>
                                    </div>
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <Activity size={20} />
                                    </div>
                                </div>
                                {/* Desktop View: Table */}
                                <div className="hidden md:block overflow-x-auto">
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

                                {/* Mobile View: Cards */}
                                <div className="md:hidden space-y-4">
                                    {studentAnalytics.detailedPerformance.map(perf => (
                                        <StudentPerformanceCard
                                            key={perf.moduleTitle}
                                            perf={perf}
                                            classModuleData={analytics.moduleAnalytics?.find(
                                                (mod) => mod.moduleTitle === perf.moduleTitle
                                            )}
                                            classTopicAnalytics={analytics.topicAnalytics}
                                        />
                                    ))}
                                </div>
                            </div>
                            {studentComparisonChartData.length > 0 && (
                                <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-6 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Perbandingan Nilai</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Perbandingan nilai siswa dengan rata-rata kelas.</p>
                                        </div>
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                            <BarChart2 size={20} />
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <RechartsBarChart
                                            data={studentComparisonChartData}
                                            layout="vertical"
                                            margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
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

            {/* SECTION 5: PERINGKAT SISWA PER MODUL */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-12 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={24} />
                            Peringkat Siswa per Modul
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ranking siswa berdasarkan nilai rata-rata (Post-Test) di setiap modul.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        {leaderboardData.length > 0 && (
                            <select
                                value={selectedLeaderboardModule}
                                onChange={(e) => setSelectedLeaderboardModule(e.target.value)}
                                className="block w-full sm:w-64 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
                            >
                                {leaderboardData.map((modul) => (
                                    <option key={modul.moduleTitle} value={modul.moduleTitle}>{modul.moduleTitle}</option>
                                ))}
                            </select>
                        )}
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            <button
                                onClick={() => setLeaderboardFilter('global')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${leaderboardFilter === 'global' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            >
                                Global (Campuran)
                            </button>
                            <button
                                onClick={() => setLeaderboardFilter('class')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${leaderboardFilter === 'class' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            >
                                Per Kelas
                            </button>
                        </div>
                    </div>
                </div>

                {leaderboardFilter === 'class' && uniqueClasses.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Filter size={16} />
                            Filter Kelas:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {uniqueClasses.map(cls => (
                                <label key={cls} className={`inline-flex items-center px-3 py-1.5 rounded-full border cursor-pointer transition-all ${selectedLeaderboardClasses.has(cls) ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedLeaderboardClasses.has(cls)}
                                        onChange={() => handleToggleLeaderboardClass(cls)}
                                    />
                                    <span className="text-xs font-medium">{cls}</span>
                                </label>
                            ))}
                        </div>
                        {selectedLeaderboardClasses.size === 0 && (
                            <p className="text-xs text-orange-500 mt-2 italic">* Pilih minimal satu kelas untuk melihat data.</p>
                        )}
                    </div>
                )}

                <div className="mt-4">
                    {(() => {
                        const modul = leaderboardData.find(m => m.moduleTitle === selectedLeaderboardModule);
                        if (!modul) return <div className="text-center py-10 text-gray-500">Data modul tidak ditemukan.</div>;

                        // Filter logic
                        let students = modul.students;
                        if (leaderboardFilter === 'class') {
                            if (selectedLeaderboardClasses.size > 0) {
                                students = students.filter(s => s.kelas && selectedLeaderboardClasses.has(s.kelas));
                            } else {
                                students = []; // Hide if no class selected in class mode
                            }
                        }
                        // If global, show everyone (mixed)

                        const indexOfLastStudent = leaderboardPage * leaderboardItemsPerPage;
                        const indexOfFirstStudent = indexOfLastStudent - leaderboardItemsPerPage;
                        const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
                        const totalLeaderboardPages = Math.ceil(students.length / leaderboardItemsPerPage);

                        return (
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg shadow-gray-100/50 dark:shadow-none flex flex-col">
                                <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base line-clamp-1" title={modul.moduleTitle}>{modul.moduleTitle}</h3>
                                    <span className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">{students.length} Siswa</span>
                                </div>
                                <div className="flex-1 p-0">
                                    {students.length > 0 ? (
                                        <>
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-700/50">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold text-gray-400 w-16 text-center">#</th>
                                                    <th className="px-6 py-4 font-semibold text-gray-400">Siswa</th>
                                                    <th className="px-6 py-4 font-semibold text-gray-400 text-right">Skor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentStudents.map((student, idx) => {
                                                    const actualIdx = indexOfFirstStudent + idx;
                                                    return (
                                                    <tr key={idx} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors last:border-0">
                                                        <td className="px-6 py-4 text-center font-medium text-gray-500 dark:text-gray-400">
                                                            {actualIdx === 0 ? (
                                                                <div className="w-6 h-6 mx-auto bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                                            ) : actualIdx === 1 ? (
                                                                <div className="w-6 h-6 mx-auto bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                                            ) : actualIdx === 2 ? (
                                                                <div className="w-6 h-6 mx-auto bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                                            ) : (
                                                                actualIdx + 1
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-gray-700 dark:text-gray-200">{student.name}</div>
                                                            {student.kelas && (
                                                                <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{student.kelas}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`font-bold px-3 py-1 rounded-full text-xs ${student.score >= 80 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : student.score >= 60 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                                                {student.score}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        
                                        {/* Pagination Controls */}
                                        {totalLeaderboardPages > 1 && (
                                            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Hal {leaderboardPage} dari {totalLeaderboardPages}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setLeaderboardPage(p => Math.max(1, p - 1))}
                                                        disabled={leaderboardPage === 1}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 transition-all shadow-sm"
                                                    >
                                                        <ChevronLeft size={14} />
                                                        Sebelumnya
                                                    </button>
                                                    <button
                                                        onClick={() => setLeaderboardPage(p => Math.min(totalLeaderboardPages, p + 1))}
                                                        disabled={leaderboardPage === totalLeaderboardPages}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 transition-all shadow-sm"
                                                    >
                                                        Selanjutnya
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 p-4 text-center">
                                            <Users size={48} className="mb-3 opacity-20" />
                                            <p className="text-sm">Belum ada data siswa untuk filter ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* MODAL CETAK LAPORAN */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Pilih Siswa untuk Dicetak</h3>
                            <button onClick={() => setIsPrintModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <input
                                type="text"
                                placeholder="Cari siswa..."
                                value={printModalSearchTerm}
                                onChange={(e) => setPrintModalSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                            />
                            {/* Tab Filter Terisolasi untuk Print */}
                            <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-lg gap-1">
                                <button
                                    onClick={() => setPrintFilterType('class')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${printFilterType === 'class' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    Siswa Kelas
                                </button>
                                <button
                                    onClick={() => setPrintFilterType('general')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${printFilterType === 'general' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    User Umum
                                </button>
                            </div>
                            
                            {/* Sort Controls for Print */}
                            <div className="flex items-center gap-1 mt-3 justify-end">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 mr-1">Urutkan:</span>
                                <button onClick={() => setPrintSortOrder('score_asc')} className={`p-1 rounded transition-colors ${printSortOrder === 'score_asc' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Nilai Terendah">
                                    <ArrowDownNarrowWide size={14} />
                                </button>
                                <button onClick={() => setPrintSortOrder('score_desc')} className={`p-1 rounded transition-colors ${printSortOrder === 'score_desc' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Nilai Tertinggi">
                                    <ArrowUpNarrowWide size={14} />
                                </button>
                                <button onClick={() => setPrintSortOrder('name_asc')} className={`p-1 rounded transition-colors ${printSortOrder === 'name_asc' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Nama A-Z">
                                    <ArrowDownAZ size={14} />
                                </button>
                            </div>

                            {/* Filter Checkbox Kelas */}
                            {printFilterType === 'class' && uniqueClasses.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Filter Kelas:</p>
                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                                        {uniqueClasses.map(cls => (
                                            <label key={cls} className={`inline-flex items-center px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors ${selectedClassesForPrint.has(cls) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                                                    checked={selectedClassesForPrint.has(cls)}
                                                    onChange={() => handleToggleClassFilter(cls)}
                                                />
                                                <span className={`ml-2 text-xs font-medium ${selectedClassesForPrint.has(cls) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{cls}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {(() => {
                                let filtered = allUsers.filter(u => u.name.toLowerCase().includes(printModalSearchTerm.toLowerCase()));
                                
                                if (printFilterType === 'class') {
                                    filtered = filtered.filter(u => u.kelas);
                                    if (selectedClassesForPrint.size > 0) {
                                        filtered = filtered.filter(u => u.kelas && selectedClassesForPrint.has(u.kelas));
                                    }
                                } else {
                                    filtered = filtered.filter(u => !u.kelas);
                                }                                
                                
                                // Sorting for print modal
                                filtered.sort((a, b) => {
                                    if (printSortOrder === 'name_asc') {
                                        return a.name.localeCompare(b.name);
                                    } else if (printSortOrder === 'score_asc') {
                                        return (a.averageScore || 0) - (b.averageScore || 0);
                                    } else {
                                        return (b.averageScore || 0) - (a.averageScore || 0);
                                    }
                                });

                                return (
                                    <>
                                        <div className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer" onClick={() => handleSelectAllStudentsForPrint(filtered)}>
                                            <input 
                                                type="checkbox" 
                                                checked={filtered.length > 0 && filtered.every(u => selectedStudentsToPrint.has(u._id))}
                                                readOnly
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Pilih Semua ({filtered.length})</span>
                                        </div>
                                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                        {filtered.map(user => (
                                            <div key={user._id} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer" onClick={() => handleToggleStudentForPrint(user._id)}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedStudentsToPrint.has(user._id)}
                                                    readOnly
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <div className="ml-3 flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
                                                        <span className={`text-[10px] font-bold px-1.5 rounded ${ (user.averageScore || 0) < 60 ? 'bg-red-100 text-red-600' : (user.averageScore || 0) < 80 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600' }`}>{user.averageScore || 0}%</span>
                                                    </div>
                                                    {user.kelas && <span className="text-[10px] text-gray-500">{user.kelas}</span>}
                                                </div>
                                            </div>
                                        ))}
                                        {filtered.length === 0 && (
                                            <div className="text-center py-4 text-sm text-gray-500">Tidak ada siswa ditemukan.</div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                            <button onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                                Batal
                            </button>
                            <button onClick={handleBatchPrint} disabled={isGeneratingReport || selectedStudentsToPrint.size === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isGeneratingReport ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                                {isGeneratingReport ? 'Memproses...' : `Cetak (${selectedStudentsToPrint.size})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}

const StudentPerformanceCard = ({ perf, classModuleData, classTopicAnalytics }: {
    perf: StudentAnalyticsData['detailedPerformance'][0],
    classModuleData: AdminAnalyticsData['moduleAnalytics'] extends (infer U)[] ? U : never | undefined,
    classTopicAnalytics: AdminAnalyticsData['topicAnalytics']
}) => {
    const classAverageScore = classModuleData?.averageScore;
    const classAverageTime = classModuleData?.averageTimeInSeconds;
    const [isExpanded, setIsExpanded] = useState(false);
    const [page, setPage] = useState(1);
    const itemsPerPage = 3;

    const totalPages = Math.ceil(perf.topics.length / itemsPerPage);
    const currentTopics = perf.topics.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-start mb-3 gap-2">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm line-clamp-2">{perf.moduleTitle}</h4>
                    <div className="flex-shrink-0">
                        {getStudentModuleStatusBadge(perf.moduleScore, perf.timeInSeconds, classAverageScore, classAverageTime)}
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nilai Modul</p>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{perf.moduleScore > 0 ? `${perf.moduleScore}%` : '-'}</span>
                            <ComparisonIndicator student={perf.moduleScore} average={classAverageScore ?? 0} type="score" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Waktu</p>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{formatTime(perf.timeInSeconds)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button 
                        className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium"
                    >
                        {isExpanded ? <ChevronUp size={16} className="mr-1" /> : <ChevronDown size={16} className="mr-1" />}
                        {isExpanded ? 'Tutup Detail Topik' : 'Lihat Detail Topik'}
                    </button>
                </div>
            </div>

            {isExpanded && perf.topics.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 p-4">
                    <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Detail Topik</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentTopics.map(topic => {
                             const classTopicData = classTopicAnalytics?.find(t => t.topicTitle === topic.topicTitle);
                             return (
                                <div key={topic.topicTitle} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{topic.topicTitle}</span>
                                        <div className="flex-shrink-0 scale-90 origin-top-right">
                                            {getStudentModuleStatusBadge(topic.score, topic.timeInSeconds, classTopicData?.averageScore, classTopicData?.averageTimeInSeconds)}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 dark:text-gray-400 mb-0.5">Waktu</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                <Clock size={12} className="text-gray-400" />
                                                {formatTime(topic.timeInSeconds)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-gray-500 dark:text-gray-400 mb-0.5">Nilai</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{topic.score}%</span>
                                        </div>
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-4 gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                            >
                                Prev
                            </button>
                            <span className="text-xs flex items-center text-gray-600 dark:text-gray-400">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

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
                        <div className="px-4 sm:px-8 py-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detail Tes per Topik</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Rincian nilai dan waktu pengerjaan untuk setiap topik di dalam modul ini.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {perf.topics.map(topic => {
                                    const classTopicData = classTopicAnalytics?.find(t => t.topicTitle === topic.topicTitle);
                                    return (
                                        <div key={topic.topicTitle} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2" title={topic.topicTitle}>
                                                    {topic.topicTitle}
                                                </span>
                                                <div className="flex-shrink-0 scale-90 origin-top-right">
                                                    {getStudentModuleStatusBadge(topic.score, topic.timeInSeconds, classTopicData?.averageScore, classTopicData?.averageTimeInSeconds)}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 dark:text-gray-400 mb-0.5">Waktu</span>
                                                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                        <Clock size={12} className="text-gray-400" />
                                                        {formatTime(topic.timeInSeconds)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-gray-500 dark:text-gray-400 mb-0.5">Nilai</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{topic.score}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};
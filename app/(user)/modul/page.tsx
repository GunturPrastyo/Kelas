"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUI } from '@/context/UIContext';
import { Home, CheckCircle2, Activity, Lock, Rocket, Users, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { authFetch } from '@/lib/authFetch';
import ModuleCardSkeleton from '@/components/ModuleCardSkeleton'; 
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAlert } from "@/context/AlertContext";
import { motion } from 'framer-motion';

interface User {
    _id: string;
}

type Category = 'mudah' | 'sedang' | 'sulit';
type UserLevel = 'dasar' | 'menengah' | 'lanjut' | null;
type ModuleStatus = 'Selesai' | 'Berjalan' | 'Terkunci' | 'Belum Mulai';

interface SummaryData {
  completedModules: number;
  totalModules: number;
  averageScore: number;
  studyHours: number;
  studyMinutes: number;
  dailyStreak: number;
}

// Opsi untuk useInView, termasuk properti kustom `triggerOnce`
interface InViewOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

// --- Custom Hook untuk mendeteksi elemen di viewport ---
const useInView = (options: InViewOptions = { threshold: 0.1, triggerOnce: true }) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement | HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (ref.current && options.triggerOnce) {
          observer.unobserve(ref.current);
        }
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [options]);

  return [ref, isInView] as const;
};

// --- Custom Hook untuk Animasi Hitung (dengan pemicu) ---
const useCountUp = (end: number, duration: number = 1500, start: boolean = true) => {
  const [count, setCount] = useState(0); // Memberikan nilai awal
  const frameRef = useRef<number | null>(null); // Mengizinkan undefined
  const startTimeRef = useRef<number | null>(null); // Mengizinkan undefined

  const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  useEffect(() => {
    if (!start || end === undefined || isNaN(end)) return;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const currentCount = Math.floor(easedProgress * end);
      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    frameRef.current = requestAnimationFrame(animate);

    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) };
  }, [end, duration, start]);

  return count;
};

export interface Module {
    _id: string;
    title: string;
    overview: string;
    category: Category;
    progress: number;
    icon: string;
    slug: string;
    status: ModuleStatus;
    isHighlighted?: boolean;
    isLocked?: boolean;
    order: number;
    completedTopics?: number;
    totalTopics?: number;
    userCount?: number;
    totalDuration?: number;
}


export default function ModulPage() {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [userLevel, setUserLevel] = useState<UserLevel>(null); 
    const [recommendation, setRecommendation] = useState({ title: '', description: '', icon: '', bgClass: '', textClass: '' });
    const [user, setUser] = useState<User | null>(null); 
    const { showAlert } = useAlert();
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [summaryCardRef, isSummaryCardInView] = useInView({ threshold: 0.2, triggerOnce: true }) as [React.RefObject<HTMLDivElement>, boolean];
    const animatedCompletedModules = useCountUp(summary?.completedModules || 0, 1500, isSummaryCardInView);
    const animatedTotalModules = useCountUp(summary?.totalModules || 0, 1500, isSummaryCardInView);
    const averageScoreForAnimation = parseFloat((summary?.averageScore || 0).toFixed(2));
    const animatedAverageScore = useCountUp(averageScoreForAnimation, 1500, isSummaryCardInView);
    const animatedStudyHours = useCountUp(summary?.studyHours || 0, 1500, isSummaryCardInView);
    const animatedDailyStreak = useCountUp(summary?.dailyStreak || 0, 1500, isSummaryCardInView);

    const [activeSummarySlide, setActiveSummarySlide] = useState(0);


    useEffect(() => {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
            const parsedUser = JSON.parse(userRaw);
            setUser(parsedUser);

            // Ambil level pengguna langsung dari field 'learningLevel' di objek user
            const learningLevel = parsedUser.learningLevel?.toLowerCase();

            if (learningLevel === 'lanjut' || learningLevel === 'lanjutan') {
                setUserLevel('lanjut');
                setRecommendation({
                    title: 'Jalur Lanjut',
                    description: 'Pemahamanmu sudah kuat. Kamu siap untuk tantangan materi tingkat lanjut!',
                    icon: '/lanjut.webp',
                        bgClass: 'from-emerald-700 via-emerald-600 to-green-500 dark:from-emerald-950 dark:via-emerald-900 dark:to-green-900',
                    textClass: 'text-emerald-800 dark:text-emerald-300'
                });
            } else if (learningLevel === 'menengah') {
                setUserLevel('menengah');
                setRecommendation({
                    title: 'Jalur Menengah',
                    description: 'Dasar-dasarmu cukup. Mari perdalam dengan manipulasi DOM dan event.',
                    icon: '/menengah.webp',
                        bgClass: 'from-blue-700 via-blue-600 to-indigo-600 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-900',
                    textClass: 'text-sky-800 dark:text-sky-300'
                });
            } else if (learningLevel === 'dasar') {
                setUserLevel('dasar');
                setRecommendation({
                    title: 'Jalur Dasar',
                    description: 'Mari kita mulai dari awal untuk membangun fondasi JavaScript yang kokoh.',
                    icon: '/dasar.webp',
                        bgClass: 'from-amber-800 via-amber-700 to-orange-600 dark:from-amber-950 dark:via-amber-900 dark:to-orange-900',
                    textClass: 'text-amber-800 dark:text-amber-300'
                });
            } else {
                // Jika 'learningLevel' tidak ada atau tidak valid, set ke null
                setUserLevel(null);
            }
        }

        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [modulesRes, userLevelRes, analyticsRes, studyTimeRes] = await Promise.all([
                    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`),
                    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/check-pre-test`),
                    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/analytics`),
                    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/study-time`)
                ]);

                if (modulesRes.ok) {
                    const modulesData = await modulesRes.json();
                    setModules(modulesData);
                    
                    const completedModules = modulesData.filter((m: Module) => m.progress === 100).length;
                    const totalModules = modulesData.length;

                    let averageScore = 0;
                    let dailyStreak = 0;
                    if (analyticsRes.ok) {
                        const analyticsData = await analyticsRes.json();
                        averageScore = analyticsData.averageScore || 0;
                        dailyStreak = analyticsData.dailyStreak || 0;
                    }

                    let studyHours = 0;
                    let studyMinutes = 0;
                    if (studyTimeRes.ok) {
                        const studyTimeData = await studyTimeRes.json();
                        const totalSeconds = studyTimeData.totalTimeInSeconds || 0;
                        studyHours = Math.floor(totalSeconds / 3600);
                        studyMinutes = Math.floor((totalSeconds % 3600) / 60);
                    }

                    setSummary({
                        completedModules,
                        totalModules,
                        averageScore,
                        studyHours,
                        studyMinutes,
                        dailyStreak
                    });
                } else {
                    throw new Error("Gagal memuat data modul.");
                }

                if (userLevelRes.ok) {
                    const data = await userLevelRes.json();
                    if (data.learningLevel) {
                        const level = data.learningLevel.toLowerCase();
                        let newLevel: UserLevel = null;

                        if (level === 'lanjut' || level === 'lanjutan') {
                            newLevel = 'lanjut';
                            setRecommendation({
                                title: 'Jalur Lanjut',
                                description: 'Pemahamanmu sudah kuat. Kamu siap untuk tantangan materi tingkat lanjut!',
                                icon: '/lanjut.webp',
                                bgClass: 'from-emerald-700 via-emerald-600 to-green-500 dark:from-emerald-950 dark:via-emerald-900 dark:to-green-900',
                                textClass: 'text-emerald-800 dark:text-emerald-300'
                            });
                        } else if (level === 'menengah') {
                            newLevel = 'menengah';
                            setRecommendation({
                                title: 'Jalur Menengah',
                                description: 'Dasar-dasarmu cukup. Mari perdalam dengan manipulasi DOM dan event.',
                                icon: '/menengah.webp',
                                bgClass: 'from-blue-700 via-blue-600 to-indigo-600 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-900',
                                textClass: 'text-sky-800 dark:text-sky-300'
                            });
                        } else {
                            newLevel = 'dasar';
                            setRecommendation({
                                title: 'Jalur Dasar',
                                description: 'Mari kita mulai dari awal untuk membangun fondasi JavaScript yang kokoh.',
                                icon: '/dasar.webp',
                                bgClass: 'from-amber-800 via-amber-700 to-orange-600 dark:from-amber-950 dark:via-amber-900 dark:to-orange-900',
                                textClass: 'text-amber-800 dark:text-amber-300'
                            });
                        }
                        setUserLevel(newLevel);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []); // Hanya dijalankan sekali saat komponen dimuat

    // Auto-rotate summary card carousel
    useEffect(() => {
        const slideInterval = setInterval(() => {
            setActiveSummarySlide((prev) => (prev + 1) % 3);
        }, 7000); // Change slide every 7 seconds
        return () => clearInterval(slideInterval);
    }, []);

    const summaryCards = useMemo(() => [
        {
            id: 'recommendation',
            content: (
                <div className="min-w-full h-full relative flex items-center px-5 sm:px-12 overflow-hidden rounded-2xl">
                    <div className={`absolute inset-0 bg-gradient-to-r ${recommendation.bgClass || 'from-gray-700 to-gray-600'}`}></div>
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="relative z-10 w-full flex flex-row items-center sm:gap-8">
                        <Image src={recommendation.icon || '/dasar.webp'} alt="Rekomendasi" width={128} height={128} className="absolute -right-2 w-32 h-32 opacity-50 z-0 pointer-events-none sm:pointer-events-auto sm:relative sm:right-auto sm:w-28 sm:h-28 sm:opacity-100 sm:z-10 drop-shadow-xl transition-transform duration-500 hover:scale-105" />
                        <div className="max-w-xl text-left relative z-10">
                            <span className="bg-white/20 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-md mb-2 sm:mb-3 inline-block backdrop-blur-sm border border-white/20 shadow-sm text-white uppercase tracking-wider">REKOMENDASI JALUR BELAJAR</span>
                            <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 leading-tight drop-shadow-md">{recommendation.title}</h2>
                            <p className="text-xs sm:text-base text-blue-50 leading-relaxed drop-shadow-sm line-clamp-3 sm:line-clamp-none">{recommendation.description}</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'progress',
            content: (
                <div className="min-w-full h-full relative flex items-center px-5 sm:px-12 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-600 to-fuchsia-600 dark:from-indigo-950 dark:via-purple-900 dark:to-fuchsia-900"></div>
                    <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
                    <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-6 py-2 sm:py-0">
                        <div className="max-w-sm text-left w-full sm:w-auto">
                            <span className="bg-white/20 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-md mb-2 sm:mb-3 inline-block backdrop-blur-sm border border-white/20 shadow-sm text-white uppercase tracking-wider">PROGRES BELAJAR</span>
                            <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 leading-tight drop-shadow-md">"Terus Tingkatkan Prestasimu!"</h2>
                            <p className="text-sm sm:text-base text-purple-100 leading-relaxed drop-shadow-sm hidden sm:block">Kamu telah menuntaskan {summary?.totalModules && summary.totalModules > 0 ? Math.round((summary.completedModules / summary.totalModules) * 100) : 0}% materi dengan sangat baik.</p>
                        </div>
                        <div className="flex gap-3 sm:gap-5 w-full sm:w-auto">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 flex flex-col items-center justify-center flex-1 sm:w-36 shadow-lg">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 sm:mb-2">
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-white leading-none">{animatedCompletedModules}<span className="text-xs sm:text-sm font-medium text-white/70 ml-1">/ {animatedTotalModules}</span></h3>
                                <span className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-wider font-semibold mt-1">Modul Selesai</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 flex flex-col items-center justify-center flex-1 sm:w-36 shadow-lg">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 sm:mb-2">
                                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-white leading-none">{animatedAverageScore}<span className="text-xs sm:text-sm font-medium text-white/70 ml-0.5">%</span></h3>
                                <span className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-wider font-semibold mt-1">Rata-rata Skor</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'activity',
            content: (
                <div className="min-w-full h-full relative flex items-center px-5 sm:px-12 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-rose-500 to-pink-600 dark:from-orange-950 dark:via-rose-900 dark:to-pink-900"></div>
                    <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/3 translate-x-1/4 pointer-events-none"></div>
                    <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-6 py-2 sm:py-0">
                        <div className="max-w-sm text-left w-full sm:w-auto">
                            <span className="bg-white/20 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-md mb-2 sm:mb-3 inline-block backdrop-blur-sm border border-white/20 shadow-sm text-white uppercase tracking-wider">AKTIVITAS HARIAN</span>
                            <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 leading-tight drop-shadow-md">"Konsistensi Adalah Kunci!"</h2>
                            <p className="text-sm sm:text-base text-rose-100 leading-relaxed drop-shadow-sm hidden sm:block">Pertahankan streak harianmu dan luangkan waktu setiap hari untuk belajar.</p>
                        </div>
                        <div className="flex gap-3 sm:gap-5 w-full sm:w-auto">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 flex flex-col items-center justify-center flex-1 sm:w-36 shadow-lg">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 sm:mb-2">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="flex items-baseline gap-0.5">
                                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-none">{animatedStudyHours}</h3>
                                    <span className="text-[10px] sm:text-xs text-white/80 font-medium">j</span>
                                    <h3 className="text-lg sm:text-xl font-bold text-white leading-none ml-1">{summary?.studyMinutes || 0}</h3>
                                    <span className="text-[10px] sm:text-xs text-white/80 font-medium">m</span>
                                </div>
                                <span className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-wider font-semibold mt-1">Waktu Belajar</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 flex flex-col items-center justify-center flex-1 sm:w-36 shadow-lg">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 sm:mb-2">
                                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-white leading-none">{animatedDailyStreak} <span className="text-xs sm:text-sm font-medium text-white/70 ml-0.5">hari</span></h3>
                                <span className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-wider font-semibold mt-1">Streak Aktif</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ], [recommendation, animatedCompletedModules, animatedTotalModules, animatedAverageScore, animatedStudyHours, summary, animatedDailyStreak]);

    const personalizedModules = useMemo(() => {
        // Map 'mudah' -> 'dasar', 'sedang' -> 'menengah', 'sulit' -> 'lanjut'
        const categoryMap: Record<string, string> = { 
            mudah: 'dasar', 
            sedang: 'menengah', 
            sulit: 'lanjut',
            dasar: 'dasar',
            menengah: 'menengah',
            lanjut: 'lanjut',
            lanjutan: 'lanjut'
        };

        // Pastikan modul diurutkan berdasarkan 'order' sebelum diproses lebih lanjut
        const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));

        const updatedModules = sortedModules.map(modul => {
            const mappedCategory = categoryMap[modul.category?.toLowerCase()] || 'dasar';
            let isLocked = modul.isLocked ?? false; // Ambil status kunci dari backend sebagai dasar

            // Override isLocked berdasarkan userLevel jika tersedia
            if (userLevel) {
                if (userLevel === 'dasar') {
                    // Dasar: Buka Dasar, Kunci Menengah & Lanjut
                    // Dasar: Buka modul dasar, kunci modul menengah dan lanjutan
                    isLocked = mappedCategory !== 'dasar';
                } else if (userLevel === 'menengah') {
                    // Menengah: Buka Dasar & Menengah, Kunci Lanjut
                    // Menengah: Buka modul dasar dan menengah, kunci modul lanjutan
                    isLocked = mappedCategory === 'lanjut';
                } else if (userLevel === 'lanjut') {
                    // Lanjut: Buka Semua
                    isLocked = false;
                }
            } else {
                // Jika userLevel belum ada (belum pre-test), kunci semua modul
                isLocked = true;
            }

            // Hitung ulang status berdasarkan progress agar konsisten dengan logika frontend
            let status: ModuleStatus;
            if (modul.progress === 100) {
                status = 'Selesai';
            } else if (modul.progress > 0) {
                status = 'Berjalan';
            } else {
                status = 'Belum Mulai';
            }

            if (isLocked && status !== 'Selesai') {
                status = 'Terkunci';
            }

            let isHighlighted = false; // Deklarasikan isHighlighted
 
            return { ...modul, status, isLocked };
        });

        // Logika Highlight: Prioritaskan modul pada level user saat ini
        let nextModuleToHighlightId: string | null = null;

        // 1. Cari modul di level user saat ini yang belum selesai
        if (userLevel) {
            const modulesInUserLevel = updatedModules.filter(m => {
                const mappedCategory = categoryMap[m.category?.toLowerCase()] || 'dasar';
                return mappedCategory === userLevel;
            });

            // Cari yang sedang berjalan di level ini
            let targetModule = modulesInUserLevel.find(m => m.status === 'Berjalan');
            
            // Jika tidak ada yang berjalan, cari yang belum mulai (dan tidak terkunci)
            if (!targetModule) {
                targetModule = modulesInUserLevel.find(m => m.status === 'Belum Mulai' && !m.isLocked);
            }

            if (targetModule) {
                nextModuleToHighlightId = targetModule._id;
            }
        }

        // 2. Fallback: Jika semua modul di level user sudah selesai, cari modul berikutnya yang belum selesai di seluruh daftar
        if (!nextModuleToHighlightId) {
            const nextUnfinished = updatedModules.find(m => m.status !== 'Selesai' && !m.isLocked);
            if (nextUnfinished) {
                nextModuleToHighlightId = nextUnfinished._id;
            }
        }

        // Terapkan highlight ke modul yang dipilih
        const finalModules = updatedModules.map(modul => ({
            ...modul,
            isHighlighted: modul._id === nextModuleToHighlightId,
        }));
 
        return finalModules.filter(m => {
            const mappedCategory = categoryMap[m.category];
            // Hapus filter berdasarkan searchQuery
            return selectedCategory ? mappedCategory === selectedCategory : true;
        });
    }, [selectedCategory, modules, userLevel]);

    // --- Tour Guide Effect ---
    useEffect(() => {
        let driverObj: any;
        let timeoutId: NodeJS.Timeout;

        const initTour = async () => {
            if (!loading && user) {
                try {
                    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/user-status`);
                    if (res.ok) {
                        const data = await res.json();
                        if (!data.hasSeenModulTour) {
                const steps = [
                    {
                        element: '#category-filters',
                        popover: {
                            title: 'Filter Kategori',
                            description: 'Gunakan filter ini untuk memilah modul berdasarkan tingkat kesulitan.'
                        }
                    }
                ];

                // Cek apakah ada modul rekomendasi yang di-highlight
                const hasRecommendation = personalizedModules.some(m => m.isHighlighted);
                if (hasRecommendation) {
                    steps.push({
                        element: '#recommended-module',
                        popover: {
                            title: 'Rekomendasi Spesial',
                            description: 'Modul dengan border biru ini adalah yang paling kami sarankan untuk kamu kerjakan saat ini.'
                        }
                    });
                }

                steps.push({
                    element: '#module-grid',
                    popover: {
                        title: 'Daftar Modul',
                        description: 'Ini adalah daftar semua modul. Modul yang terkunci akan terbuka seiring progres belajarmu.'
                    }
                });

                let isDestroying = false;

                driverObj = driver({
                    showProgress: true,
                    animate: true,
                    steps: steps,
                    onDestroyStarted: () => {
                        if (isDestroying) return;

                        if (!driverObj.hasNextStep()) {
                            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/user-status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ key: 'hasSeenModulTour', value: true })
                            });
                            driverObj.destroy();
                        } else {
                            const activeIndex = driverObj.getActiveIndex();
                            driverObj.destroy();
                            setTimeout(() => {
                                showAlert({
                                    type: 'confirm',
                                    title: 'Akhiri Tur?',
                                    message: 'Apakah kamu yakin ingin mengakhiri tur pengenalan ini?',
                                    confirmText: 'Ya, Akhiri',
                                    cancelText: 'Lanjut Tur',
                                    onConfirm: () => {
                                        isDestroying = true;
                                        authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/user-status`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ key: 'hasSeenModulTour', value: true })
                                        });
                                    },
                                    onCancel: () => {
                                        if (typeof activeIndex === 'number') {
                                            driverObj.drive(activeIndex);
                                        }
                                    }
                                });
                            }, 100);
                        }
                    },
                });

                timeoutId = setTimeout(() => {
                    driverObj.drive();
                }, 1500);
            }
        }
                } catch (e) {
                    console.error("Failed to check tour status", e);
                }
            }
        };
        initTour();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (driverObj) driverObj.destroy();
        };
    }, [loading, user, personalizedModules]);

    const getStatusBadge = (status: ModuleStatus, progress: number) => {
        const base = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full";
        if (status === "Selesai") return (
            <span className={`${base} bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300`}>
                <CheckCircle2 size={14} /> Selesai
            </span>
        );
        if (status === "Berjalan") return (
            <span className={`${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300`}>
                <Activity size={14} /> {progress}%
            </span>
        );
        if (status === "Terkunci") return (
            <span className={`${base} bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400`}>
                <Lock size={14} /> Terkunci
            </span>
        );
        return <span className={`${base} bg-yellow-100 text-yellow-700 dark:bg-amber-900/40 dark:text-amber-300`}><Rocket size={14} /> Mulai</span>;
    };

    const getCategoryBadge = (category: Category) => {
        const base = "text-xs font-semibold px-2 py-0.5 rounded-md";
        switch (category.toLowerCase()) {
            case 'mudah':
            case 'dasar':
                return <span className={`${base} bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300`}>Dasar</span>;
            case 'sedang':
            case 'menengah':
                return <span className={`${base} bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300`}>Menengah</span>;
            case 'sulit':
            case 'lanjut':
            case 'lanjutan':
                return <span className={`${base} bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300`}>Lanjut</span>;
            default: return null;
        }
    };

    return (
        <>
            <style jsx global>{`
                .hide-scrollbar-on-mobile::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar-on-mobile {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @media (min-width: 640px) {
                    .custom-scrollbar::-webkit-scrollbar {
                        height: 6px;
                        display: block;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0,0,0,0.05);
                        border-radius: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(156, 163, 175, 0.5);
                        border-radius: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(156, 163, 175, 0.8);
                    }
                }
            `}</style>
            {/* Breadcrumb */}
            <nav className="flex mt-22" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
                    <li className="inline-flex items-center">
                        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                            <Home className="w-4 h-4 me-2.5" />
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 dark:text-slate-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span className="ms-1 text-sm font-medium text-gray-800 dark:text-gray-200 md:ms-2">Modul</span>
                        </div>
                    </li>
                </ol>
            </nav>
            {/* Tampilkan skeleton UI saat loading */}
            {loading && (
                <div className="animate-pulse w-full mb-10">
                    {/* Skeleton Recommendation Card */}
                    <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-xl shadow-sm flex items-center gap-6 mb-6 h-[120px]">
                        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                        <div className="flex-1 space-y-3">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                    </div>

                    {/* Skeleton Category Filters */}
                    <div className="flex items-center gap-2 flex-wrap mb-6">
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                        <div className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                    </div>

                    {/* Skeleton Module Grid */}
                    <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 grid-auto-rows-fr">
                        {/* Garis vertikal untuk tampilan mobile */}
                        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 md:hidden"></div>

                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="relative sm:static">
                                {/* Nomor urut skeleton (mobile) */}
                                <div className="absolute top-5 left-0 z-10 w-8 h-8 flex items-center justify-center md:hidden">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800"></div>
                                </div>
                                <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col h-full ml-10 sm:ml-0 border border-gray-100 dark:border-gray-700">
                                    {/* Header */}
                                    <div className="relative z-10 p-4 sm:p-5 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex-shrink-0"></div>
                                            <div className="flex-1 w-full">
                                                <div className="hidden sm:block h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                                                <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Body */}
                                    <div className="relative p-4 sm:p-5 flex flex-col flex-grow">
                                        <div className="space-y-2 mb-4 flex-grow">
                                            <div className="h-3.5 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                                            <div className="h-3.5 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                        </div>
                                        <div className="mb-4">
                                            <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full w-full mb-2"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                                        </div>
                                        <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-lg w-full mt-auto"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tampilkan konten setelah loading selesai */}
            {!loading && !userLevel && (
                <section className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-4 mb-6">
                    <Image src="/warning-test.webp" alt="Pre-test" width={480} height={480} className="w-20 h-20" />
                    <div>
                        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">Tentukan Jalur Belajarmu!</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ambil tes awal terlebih dahulu untuk membuka modul yang sesuai dengan level kemampuanmu. <Link href="/pre-test" className="font-semibold text-blue-600 hover:underline">Mulai Tes Awal</Link></p>
                    </div>
                </section>
            )}

            {!loading && userLevel && (
                <section ref={summaryCardRef} className="relative mb-8 w-full h-[220px] sm:h-[240px] rounded-lg overflow-hidden shadow-lg group/carousel">
                    {/* Slides Container */}
                    <div className="relative w-full h-full">
                        {summaryCards.map((card, index) => (
                            <motion.div
                                key={card.id}
                                className="absolute w-full h-full"
                                initial={{ x: "100%", opacity: 0 }}
                                animate={{
                                    x: `${(index - activeSummarySlide) * 100}%`,
                                    opacity: index === activeSummarySlide ? 1 : 0,
                                    scale: index === activeSummarySlide ? 1 : 0.95,
                                    zIndex: 5 - Math.abs(index - activeSummarySlide),
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                {card.content}
                            </motion.div>
                        ))}
                    </div>
                        
                    {/* Navigation Arrows */}
                    <button 
                        onClick={() => setActiveSummarySlide(prev => (prev - 1 + summaryCards.length) % summaryCards.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover/carousel:opacity-100 hidden sm:flex items-center justify-center shadow-lg"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={() => setActiveSummarySlide(prev => (prev + 1) % summaryCards.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover/carousel:opacity-100 hidden sm:flex items-center justify-center shadow-lg"
                        aria-label="Next slide"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Dots INSIDE the banner container */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 items-center">
                        {summaryCards.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveSummarySlide(index)}
                                className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                                    activeSummarySlide === index 
                                    ? 'w-8 bg-white' 
                                    : 'w-2.5 bg-white/50 hover:bg-white/80'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            {!loading && <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div id="category-filters" className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setSelectedCategory('')} className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${selectedCategory === '' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        Semua
                    </button>
                    <button onClick={() => setSelectedCategory('dasar')} className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${selectedCategory === 'dasar' ? 'bg-yellow-500 text-white' : 'bg-white dark:bg-gray-800 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/50'}`}>
                        Dasar
                    </button>
                    <button onClick={() => setSelectedCategory('menengah')} className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${selectedCategory === 'menengah' ? 'bg-sky-500 text-white' : 'bg-white dark:bg-gray-800 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/50'}`}>
                        Menengah
                    </button>
                    <button onClick={() => setSelectedCategory('lanjut')} className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${selectedCategory === 'lanjut' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/50'}`}>
                        Lanjut
                    </button>
                </div>
            </div>}

            {!loading && <div id="module-grid" className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 grid-auto-rows-fr">
                {/* Garis vertikal untuk tampilan mobile */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 md:hidden"></div>

                {personalizedModules.map((modul) => (
                    <div
                        key={modul._id}
                        id={modul.isHighlighted ? "recommended-module" : undefined}
                        // Wrapper untuk positioning nomor urut di mobile
                        className="relative sm:static"
                    >
                        {/* Nomor urut yang "duduk" di atas garis (hanya mobile) */}
                        <div className="absolute top-5 -left-2 z-10 w-8 h-8 flex  md:hidden">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${modul.status === 'Selesai' ? 'bg-green-500 text-white border-2 border-white dark:border-gray-800' :
                                 modul.status === 'Berjalan' || modul.isHighlighted ? 'bg-blue-500 text-white border-2 border-white dark:border-gray-800' + (modul.isHighlighted ? ' ring-4 ring-blue-300 dark:ring-blue-500/50' : '') : // Modul berjalan atau direkomendasikan
                                 modul.status === 'Terkunci' ? 'bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 text-gray-400' :
                                 'bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 text-gray-500'}
                            `}>
                                {modul.status === 'Selesai' ? <CheckCircle2 size={16} /> : modul.status === 'Terkunci' ? <Lock size={14}/> : (personalizedModules.indexOf(modul) + 1)}
                            </div>
                        </div>
                        <div className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col transition-all duration-300 ml-9 sm:ml-0 h-full ${modul.isHighlighted ? 'ring-2 ring-blue-500 shadow-blue-500/20' : 'hover:-translate-y-1 hover:shadow-lg'} ${modul.status === 'Terkunci' ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                            {/* Header */}
                            <div className="relative z-10 p-4 sm:p-5 bg-white dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between overflow-hidden">
                                {/* Decorative Background */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className={`absolute inset-0 w-full h-full z-0 pointer-events-none transition-transform duration-500 group-hover:scale-105 ${
                                    modul.progress === 100 ? "text-green-200/80 dark:text-green-800/20" : "text-blue-200/80 dark:text-blue-800/20"
                                }`} preserveAspectRatio="none">
                                    <g transform="translate(900, 0) scale(1)">
                                        <path d="M0 324.5C-40.8 299.5 -81.5 274.4 -99.9 241.1C-118.2 207.9 -114.2 166.3 -150.6 150.6C-187.1 134.9 -264.1 145 -299.8 124.2C-335.5 103.4 -330 51.7 -324.5 0L0 0Z" fill="currentColor"/>
                                    </g>
                                   
                                </svg>

                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modul.isHighlighted ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                        <img className="w-6 h-6 object-cover" src={modul.icon.startsWith('http') ? modul.icon : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`} alt={modul.title} />
                                    </div>
                                    <div>
                                        {/* Nomor urut untuk tampilan desktop/tablet */}
                                        <span className="hidden sm:block text-xs font-bold text-gray-400 dark:text-gray-500">
                                            MODUL {personalizedModules.indexOf(modul) + 1}
                                        </span>
                                        <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100">
                                            {modul.title}
                                        </h3>
                                        <div className="mt-1.5">
                                            {getCategoryBadge(modul.category)}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    {getStatusBadge(modul.status, modul.progress)}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="relative p-4 sm:p-5 flex flex-col flex-grow overflow-hidden">
                                <p className="relative z-10 text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
                                    {modul.overview}
                                </p>
                                {/* Info User & Waktu */}
                                <div className="relative z-10 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                    {(modul.userCount !== undefined) && (
                                        <div className="flex items-center gap-1.5">
                                            <Users size={14} />
                                            <span>{modul.userCount} Bergabung</span>
                                        </div>
                                    )}
                                    {modul.totalDuration !== undefined && (
                                        <div className="flex items-center gap-1.5"><Clock size={14} /> <span>Estimasi {modul.totalDuration} menit</span></div>
                                    )}
                                </div>
                                 <div className="relative z-10 mb-4">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full ${modul.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${modul.progress}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{modul.completedTopics || 0} dari {modul.totalTopics || 0} topik selesai</p>
                                </div>
                               <Link href={modul.status !== 'Terkunci' ? `/modul/${modul.slug}` : '#'} passHref className={`relative z-10 mt-auto ${modul.status === 'Terkunci' ? 'pointer-events-none' : ''}`}>
                                    <button
                                        disabled={modul.status === 'Terkunci'}
                                       className={`w-full py-2.5 px-4 rounded-lg text-white font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 dark:disabled:bg-gray-600 ${
                                            modul.status === 'Selesai' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {modul.status === 'Selesai' ? 'Lihat Materi' : modul.status === 'Berjalan' ? 'Lanjutkan' : 'Mulai Belajar'}
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>}
            {!loading && personalizedModules.length === 0 && (
                <div className="text-center py-16 text-gray-500"> 
                    <p>{"Tidak ada modul yang tersedia untuk kategori ini."}</p>
                </div> 
            )}
        </>
    );
}
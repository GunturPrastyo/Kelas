"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUI } from '@/context/UIContext';
import { Home, CheckCircle2, Activity, Lock, Rocket, Users, Clock } from "lucide-react";
import { authFetch } from '@/lib/authFetch';
import ModuleCardSkeleton from '@/components/ModuleCardSkeleton'; // Impor komponen skeleton

interface User {
    _id: string;
    // tambahkan properti lain jika perlu
}

type Category = 'mudah' | 'sedang' | 'sulit';
type UserLevel = 'dasar' | 'menengah' | 'lanjut' | null;
type ModuleStatus = 'Selesai' | 'Berjalan' | 'Terkunci' | 'Belum Mulai';

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
    isLocked?: boolean; // Tambahkan properti isLocked
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
    const [userLevel, setUserLevel] = useState<UserLevel>(null); // State untuk level pengguna
    const [recommendation, setRecommendation] = useState({ title: '', description: '', icon: '', bgClass: '', textClass: '' });
    const [user, setUser] = useState<User | null>(null); 
    // const { searchQuery, setSearchQuery } = useUI(); // Hapus atau komentari baris ini

    useEffect(() => {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
            const parsedUser = JSON.parse(userRaw);
            setUser(parsedUser); // Simpan data user ke state

            // Ambil level pengguna langsung dari field 'learningLevel' di objek user
            const learningLevel = parsedUser.learningLevel?.toLowerCase();

            if (learningLevel === 'lanjut' || learningLevel === 'lanjutan') {
                setUserLevel('lanjut');
                setRecommendation({
                    title: 'Jalur Belajar: Lanjut',
                    description: 'Pemahamanmu sudah kuat. Kamu siap untuk tantangan materi tingkat lanjut!',
                    icon: '/lanjut.webp',
                    bgClass: 'border border-slate-200 dark:border-slate-700 border-l-green-500 border-l-[5px] from-green-100 to-emerald-200 dark:from-gray-800 dark:to-emerald-900',
                    textClass: 'text-green-800 dark:text-green-300'
                });
            } else if (learningLevel === 'menengah') {
                setUserLevel('menengah');
                setRecommendation({
                    title: 'Jalur Belajar: Menengah',
                    description: 'Dasar-dasarmu sudah cukup. Mari perdalam dengan manipulasi DOM dan event.',
                    icon: '/menengah.webp',
                    bgClass: 'border border-slate-200 dark:border-slate-700 border-l-blue-500 border-l-[5px] from-blue-100 to-sky-200 dark:from-gray-800 dark:to-sky-900',
                    textClass: 'text-blue-800 dark:text-blue-300'
                });
            } else if (learningLevel === 'dasar') {
                setUserLevel('dasar');
                setRecommendation({
                    title: 'Jalur Belajar: Dasar',
                    description: 'Mari kita mulai dari awal untuk membangun fondasi JavaScript yang kokoh.',
                    icon: '/dasar.webp',
                    bgClass: 'border border-slate-50 dark:border-slate-700 border-l-yellow-500 border-l-[5px] from-yellow-100 to-amber-200 dark:from-gray-800 dark:to-amber-900',
                    textClass: 'text-yellow-800 dark:text-yellow-300'
                });
            } else {
                // Jika 'learningLevel' tidak ada atau tidak valid, set ke null
                setUserLevel(null);
            }
        }

        // Fetch modules from API
        const fetchModules = async () => {
            try {
                setLoading(true);
                // Endpoint baru yang menyertakan progres
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`);
                if (!res.ok) throw new Error("Gagal memuat data modul.");
                const data = await res.json();
                setModules(data);
            } catch (error) {
                console.error("Error fetching modules:", error);
            } finally {
                setLoading(false);
            }
        };

        // Fetch user level from API to ensure it's up to date (overriding localStorage if needed)
        const fetchUserLevel = async () => {
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/check-pre-test`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.learningLevel) {
                        const level = data.learningLevel.toLowerCase();
                        let newLevel: UserLevel = null;

                        if (level === 'lanjut' || level === 'lanjutan') {
                            newLevel = 'lanjut';
                            setRecommendation({
                                title: 'Jalur Belajar: Lanjut',
                                description: 'Pemahamanmu sudah kuat. Kamu siap untuk tantangan materi tingkat lanjut!',
                                icon: '/lanjut.webp',
                                bgClass: 'border border-slate-200 dark:border-slate-700 border-l-green-400 border-l-[8px] from-green-100 to-emerald-200 dark:from-gray-800 dark:to-emerald-900',
                                textClass: 'text-green-800 dark:text-green-300'
                            });
                        } else if (level === 'menengah') {
                            newLevel = 'menengah';
                            setRecommendation({
                                title: 'Jalur Belajar: Menengah',
                                description: 'Dasar-dasarmu sudah cukup. Mari perdalam dengan manipulasi DOM dan event.',
                                icon: '/menengah.webp',
                                bgClass: 'border border-slate-200 dark:border-slate-700 border-l-blue-400 border-l-[8px] from-blue-100 to-sky-200 dark:from-gray-800 dark:to-sky-900',
                                textClass: 'text-blue-800 dark:text-blue-300'
                            });
                        } else {
                            newLevel = 'dasar';
                            setRecommendation({
                                title: 'Jalur Belajar: Dasar',
                                description: 'Mari kita mulai dari awal untuk membangun fondasi JavaScript yang kokoh.',
                                icon: '/dasar.webp',
                                bgClass: 'border border-slate-50 dark:border-slate-700 border-l-yellow-400 border-l-[8px] from-yellow-100 to-amber-200 dark:from-gray-800 dark:to-amber-900',
                                textClass: 'text-yellow-800 dark:text-yellow-300'
                            });
                        }
                        setUserLevel(newLevel);
                    }
                }
            } catch (error) {
                console.error("Error fetching user level:", error);
            }
        };

        fetchModules();
        fetchUserLevel();
    }, []); // Hanya dijalankan sekali saat komponen dimuat

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
    }, [selectedCategory, modules]);

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
                <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 grid-auto-rows-fr mt-6">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 md:hidden"></div>
                    <ModuleCardSkeleton />
                    
                </div>
            )}

            {/* Tampilkan konten setelah loading selesai */}
            {!loading && !userLevel && (
                <section className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-4 mb-6">
                    <Image src="/warning-test.webp" alt="Pre-test" width={480} height={480} className="w-20 h-20" />
                    <div>
                        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">Tentukan Jalur Belajarmu!</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ambil pre-test terlebih dahulu untuk membuka modul yang sesuai dengan level kemampuanmu. <Link href="/pre-test" className="font-semibold text-blue-600 hover:underline">Mulai Pre-test</Link></p>
                    </div>
                </section>
            )}

            {!loading && userLevel && (
                <section className={`bg-gradient-to-br ${recommendation.bgClass} p-5 rounded-xl shadow-md flex items-center gap-6 mb-6`}>
                    <Image src={recommendation.icon} alt="Rekomendasi" width={256} height={256} className="w-20 h-20" />
                    <div>
                        <h2 className={`text-lg font-semibold ${recommendation.textClass}`}>{recommendation.title}</h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation.description}</p>
                    </div>
                </section>
            )}

            {!loading && <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
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

            {!loading && <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 grid-auto-rows-fr">
                {/* Garis vertikal untuk tampilan mobile */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 md:hidden"></div>

                {personalizedModules.map((modul) => (
                    <div
                        key={modul._id}
                        // Wrapper untuk positioning nomor urut di mobile
                        className="relative sm:static"
                    >
                        {/* Nomor urut yang "duduk" di atas garis (hanya mobile) */}
                        <div className="absolute top-5 left-0 z-10 w-12 h-12 flex items-center justify-center md:hidden">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${modul.status === 'Selesai' ? 'bg-green-500 text-white border-2 border-white dark:border-gray-800' :
                                 modul.status === 'Berjalan' || modul.isHighlighted ? 'bg-blue-500 text-white border-2 border-white dark:border-gray-800' + (modul.isHighlighted ? ' ring-4 ring-blue-300 dark:ring-blue-500/50' : '') : // Modul berjalan atau direkomendasikan
                                 modul.status === 'Terkunci' ? 'bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 text-gray-400' :
                                 'bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 text-gray-500'}
                            `}>
                                {modul.status === 'Selesai' ? <CheckCircle2 size={16} /> : modul.status === 'Terkunci' ? <Lock size={14}/> : (personalizedModules.indexOf(modul) + 1)}
                            </div>
                        </div>
                        <div className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col transition-all duration-300 ml-12 sm:ml-0 h-full ${modul.isHighlighted ? 'ring-2 ring-blue-500 shadow-blue-500/20' : 'hover:-translate-y-1 hover:shadow-lg'} ${modul.status === 'Terkunci' ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                            {/* Decorative Background */}
                            <div className={`absolute top-0 right-0 w-42 h-32 bg-gradient-to-br ${
                                modul.progress === 100 ? "from-green-200/80 to-transparent dark:from-green-800/20" : "from-blue-200/80 to-transparent dark:from-blue-800/20"
                            } rounded-bl-[80px] -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110`} />

                            <div className="relative z-10 flex items-start justify-between mb-3">
                                
                                <div className="flex items-center gap-3">
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
                                {getStatusBadge(modul.status, modul.progress)}
                            </div>
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
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${modul.progress}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{modul.completedTopics || 0} dari {modul.totalTopics || 0} topik selesai</p>
                            </div>
                            <Link href={modul.status !== 'Terkunci' ? `/modul/${modul.slug}` : '#'} passHref className={`relative z-10 mt-auto ${modul.status === 'Terkunci' ? 'pointer-events-none' : ''}`}>
                                <button
                                    disabled={modul.status === 'Terkunci'}
                                    className="mt-auto w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 dark:disabled:bg-gray-600 transition"
                                >
                                    {modul.status === 'Berjalan' ? 'Lanjutkan' : 'Mulai Belajar'}
                                </button>
                            </Link>
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
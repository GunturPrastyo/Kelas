"use client";

import { useEffect, useMemo, useState } from 'react';
import { useUI } from '@/context/UIContext';
import Image from 'next/image';

interface Module {
    id: number;
    title: string;
    description: string;
    category: 'dasar' | 'menengah' | 'lanjut';
    progress: number;
    status: 'Selesai' | 'Berjalan' | 'Terkunci' | 'Belum Mulai';
    icon: string;
}

const ALL_MODULES: Module[] = [
    { id: 1, title: "JavaScript Dasar", description: "Mempelajari variabel, tipe data, operator, dan struktur kontrol fundamental dalam JavaScript.", category: "dasar", status: "Selesai", progress: 100, icon: "https://img.icons8.com/color/48/javascript.png" },
    { id: 2, title: "Fungsi dan Lingkup", description: "Memahami cara kerja fungsi, parameter, return values, dan konsep scope (global vs lokal).", category: "dasar", status: "Berjalan", progress: 75, icon: "https://img.icons8.com/fluency/48/settings-3.png" },
    { id: 3, title: "Array dan Objek", description: "Mengelola kumpulan data menggunakan array dan objek, serta metode-metode bawaannya.", category: "dasar", status: "Belum Mulai", progress: 0, icon: "https://img.icons8.com/fluency/48/data-configuration.png" },
    { id: 4, title: "Manipulasi DOM", description: "Belajar cara memilih dan memanipulasi elemen HTML menggunakan JavaScript untuk membuat halaman interaktif.", category: "menengah", status: "Terkunci", progress: 0, icon: "/dom.png" },
    { id: 5, title: "Event Handling", description: "Menangani interaksi pengguna seperti klik, input, dan hover untuk membangun aplikasi web yang responsif.", category: "menengah", status: "Terkunci", progress: 0, icon: "https://img.icons8.com/fluency/48/cursor.png" },
    { id: 6, title: "JavaScript Asynchronous", description: "Mendalami Promise, async/await untuk mengelola operasi yang tidak berjalan secara sinkron seperti fetch data.", category: "lanjut", status: "Terkunci", progress: 0, icon: "https://img.icons8.com/fluency/48/cloud-sync.png" },
    { id: 7, title: "API & Fetch", description: "Berinteraksi dengan server dan layanan eksternal menggunakan Fetch API untuk mengambil dan mengirim data.", category: "lanjut", status: "Terkunci", progress: 0, icon: "https://img.icons8.com/fluency/48/services.png" },
];

type UserLevel = 'dasar' | 'menengah' | 'lanjut' | null;

export default function ModulPage() {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [userLevel, setUserLevel] = useState<UserLevel>(null); // State untuk level pengguna
    const [recommendation, setRecommendation] = useState({ title: '', description: '', icon: '' });
    const { searchQuery, setSearchQuery } = useUI(); // Gunakan state global

    useEffect(() => {
        const resultRaw = localStorage.getItem('pretest_result');
        if (resultRaw) {
            try {
                const parsedResult = JSON.parse(resultRaw);
                if (parsedResult.score >= 80) {
                    setUserLevel('lanjut');
                    setRecommendation({
                        title: 'Jalur Belajar: Lanjut',
                        description: 'Pemahamanmu sudah kuat. Kamu siap untuk tantangan materi tingkat lanjut!',
                        icon: '/target.png'
                    });
                } else if (parsedResult.score >= 50) {
                    setUserLevel('menengah');
                    setRecommendation({
                        title: 'Jalur Belajar: Menengah',
                        description: 'Dasar-dasarmu sudah cukup. Mari perdalam dengan manipulasi DOM dan event.',
                        icon: '/target.png'
                    });
                } else {
                    setUserLevel('dasar');
                    setRecommendation({
                        title: 'Jalur Belajar: Dasar',
                        description: 'Mari kita mulai dari awal untuk membangun fondasi JavaScript yang kokoh.',
                        icon: '/target.png'
                    });
                }
            } catch (e) {
                console.warn('Gagal memuat hasil pre-test untuk personalisasi.', e);
                setUserLevel(null);
            }
        }
    }, []);

    const personalizedModules = useMemo(() => {
        return ALL_MODULES.map(modul => {
            const isRecommended = modul.category === userLevel;
            const isLocked = (userLevel === 'dasar' && modul.category !== 'dasar') || (userLevel === 'menengah' && modul.category === 'lanjut');
            
            let status: Module['status'] = modul.status;
            let isHighlighted = false;

            if (userLevel) {
                if (isRecommended && modul.status !== 'Selesai' && modul.status !== 'Berjalan') {
                    status = 'Belum Mulai'; // Buka kunci jika direkomendasikan
                    isHighlighted = true;
                } else if (isLocked) {
                    status = 'Terkunci';
                }
            }

            return { ...modul, status, isHighlighted };
        }).filter(m => {
            const categoryMatch = selectedCategory ? m.category === selectedCategory : true;
            const searchMatch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [searchQuery, selectedCategory, userLevel]);

    const getStatusBadge = (status: Module['status'], progress: number) => {
        if (status === "Selesai") return <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">✅ Selesai</span>;
        if (status === "Berjalan") return <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">⏳ {progress}%</span>;
        if (status === "Terkunci") return <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">🔒 Terkunci</span>;
        return <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">🚀 Mulai</span>;
    };

    return (
        <>
            {userLevel && (
                <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-5 rounded-xl shadow-sm flex items-center gap-4 mb-6">
                    <Image src={recommendation.icon} alt="Rekomendasi" width={48} height={48} className="w-12 h-12" />
                    <div>
                        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300">{recommendation.title}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation.description}</p>
                    </div>
                </section>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="relative w-full md:hidden">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                        </svg>
                    </div>
                    <input
                        type="search"
                        placeholder="Cari modul..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full p-3 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                </div>

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
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {personalizedModules.map((modul) => (
                    <div
                        key={modul.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col transition-all duration-300 ${modul.isHighlighted ? 'ring-2 ring-blue-500 shadow-blue-500/20' : 'hover:-translate-y-1 hover:shadow-lg'} ${modul.status === 'Terkunci' ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modul.isHighlighted ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <Image src={modul.icon} alt={modul.title} width={24} height={24} />
                                </div>
                                <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100">{modul.title}</h3>
                            </div>
                            {getStatusBadge(modul.status, modul.progress)}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-grow">
                            {modul.description}
                        </p>

                        {modul.progress > 0 && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-4">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${modul.progress}%` }}></div>
                            </div>
                        )}

                        <button
                            disabled={modul.status === 'Terkunci'}
                            className="mt-auto w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 dark:disabled:bg-gray-600 transition"
                        >
                            {modul.status === 'Berjalan' ? 'Lanjutkan' : 'Mulai Belajar'}
                        </button>
                    </div>
                ))}
            </div>
            {personalizedModules.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                    <p>Tidak ada modul yang cocok dengan pencarian Anda.</p>
                </div>
            )}
        </>
    );
}
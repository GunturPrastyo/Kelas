"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { initFlowbite } from 'flowbite';
import PostTestTopik from '@/components/PostTestTopik';

interface Materi {
    content: string;
    youtube: string | null;
}

interface Question {
    _id: string;
    questionText: string;
    options: string[];
}

interface Topik {
    _id: string;
    title: string;
    slug: string;
    materi: Materi;
    questions: Question[];
    isCompleted: boolean;
}

interface Modul {
    _id: string;
    title: string;
    overview: string;
    progress: number;
    completedTopics: number;
    totalTopics: number;
    topics: Topik[];
}

export default function ModulDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = use(params); // Membuka promise `params` dengan React.use()
    const [modul, setModul] = useState<Modul | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unlockedTopics, setUnlockedTopics] = useState<Set<string>>(new Set());
    // State untuk accordion tidak lagi diperlukan karena Flowbite akan menangani inisialisasinya

    useEffect(() => {
        const fetchModulDetails = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/user-view/${slug}`, {
                    credentials: 'include',
                });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.message || 'Gagal memuat data modul.');
                }
                const data: Modul = await res.json();
                setModul(data);

                // Tentukan topik yang terbuka
                const newUnlocked = new Set<string>();
                let previousTopicCompleted = true;
                for (const topic of data.topics) {
                    if (previousTopicCompleted) {
                        newUnlocked.add(topic._id);
                        previousTopicCompleted = topic.isCompleted;
                    } else {
                        break; // Stop jika menemukan topik yang belum selesai
                    }
                }
                setUnlockedTopics(newUnlocked);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchModulDetails();
    }, [slug]);

    useEffect(() => {
        // Inisialisasi Flowbite setelah komponen di-mount dan setiap kali modul berubah
        // Ini memastikan elemen-elemennya sudah ada di DOM
        if (modul) {
            initFlowbite();
        }
    }, [modul]);

    const handleTestComplete = (isSuccess: boolean, completedTopicId: string) => {
        if (isSuccess && modul) {
            // Update state secara lokal untuk UX yang lebih cepat
            const updatedTopics = modul.topics.map(t =>
                t._id === completedTopicId ? { ...t, isCompleted: true } : t
            );

            const completedCount = updatedTopics.filter(t => t.isCompleted).length;
            const newProgress = Math.round((completedCount / modul.totalTopics) * 100);

            setModul(prev => prev ? { ...prev, topics: updatedTopics, progress: newProgress, completedTopics: completedCount } : null);

            // Buka topik berikutnya
            const completedIndex = modul.topics.findIndex(t => t._id === completedTopicId);
            if (completedIndex > -1 && completedIndex + 1 < modul.topics.length) {
                const nextTopicId = modul.topics[completedIndex + 1]._id;
                setUnlockedTopics(prev => new Set(prev).add(nextTopicId));
            }
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Memuat detail modul...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
    if (!modul) return <div className="p-6 text-center text-gray-500">Modul tidak ditemukan.</div>;

    return (
        <>
            {/* Breadcrumb */}
            <nav className="flex mb-5" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-gray-700 dark:text-gray-300">
                    <li className="inline-flex items-center">
                        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                            <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" /></svg>
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 dark:text-gray-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>
                            <Link href="/modul" className="ms-1 text-sm font-medium hover:text-blue-600 md:ms-2 dark:hover:text-blue-400">Modul</Link>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 dark:text-gray-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>
                            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400 capitalize">{slug.replace(/-/g, ' ')}</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Info Kursus */}
            <section className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-sans">
                <div className="w-full space-y-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">{modul.title}</h2>
                    <p className="text-sm text-blue-100 leading-relaxed">{modul.overview}</p>
                    <p className="text-sm text-blue-100">{modul.completedTopics} dari {modul.totalTopics} topik selesai</p>
                    <div className="w-full bg-white/30 rounded-full h-3 mt-3 overflow-hidden">
                        <div className="bg-yellow-400 h-3 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${modul.progress}%` }} />
                    </div>
                </div>
            </section>

            {/* Materi dengan Accordion */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6">
                <h3 className="text-lg font-semibold mb-4">📖 Materi Pembelajaran</h3>
                <div id="accordion-flush" data-accordion="collapse" data-active-classes="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" data-inactive-classes="text-gray-800 dark:text-gray-400">
                    {modul.topics.map((topic) => {
                        const isUnlocked = unlockedTopics.has(topic._id);
                        return (
                            <div key={topic._id}>
                                <h2 id={`accordion-flush-heading-${topic._id}`}>
                                    <button type="button" disabled={!isUnlocked} className={`flex items-center justify-between w-full py-4 font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 gap-3 ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`} data-accordion-target={`#accordion-flush-body-${topic._id}`} aria-expanded="false" aria-controls={`accordion-flush-body-${topic._id}`}>
                                        <span className="flex items-center">
                                            {topic.isCompleted ? <span className="text-green-500 mr-2">✅</span> : isUnlocked ? <span className="text-blue-500 mr-2">▶️</span> : <span className="text-gray-500 mr-2">🔒</span>}
                                            {topic.title}
                                        </span>
                                        <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" /></svg>
                                    </button>
                                </h2>
                                <div id={`accordion-flush-body-${topic._id}`} className="hidden" aria-labelledby={`accordion-flush-heading-${topic._id}`}>
                                    <div className="py-5 border-b border-gray-200 dark:border-gray-700 space-y-6">
                                        {topic.materi.youtube && (
                                            <div className="w-full flex justify-center">
                                                <iframe src={topic.materi.youtube} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="rounded-lg shadow-md w-full max-w-2xl aspect-video"></iframe>
                                            </div>
                                        )}
                                        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: topic.materi.content }} />
                                        
                                        {!topic.isCompleted && (
                                            <PostTestTopik
                                                questions={topic.questions}
                                                modulId={modul._id}
                                                topikId={topic._id}
                                                onTestComplete={(isSuccess) => handleTestComplete(isSuccess, topic._id)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Post Test Akhir */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6 lg:p-2">
                    <div className="flex-1 text-center md:text-left w-full md:w-4/5">
                        <h2 className="text-xl lg:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Post Test Akhir Modul</h2>
                        <div className="sm:hidden w-full flex justify-center mb-4">
                            <Image src="/post-test.png" alt="Post Test" width={160} height={160} className="object-contain" />
                        </div>
                        <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-6">
                            Uji pemahamanmu setelah menyelesaikan seluruh materi di modul ini. Selesaikan post-test untuk menandai modul ini sebagai selesai.
                        </p>
                        <Link href={`/post-test/modul/${slug}`} passHref>
                            <button disabled={modul.progress < 100} className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded-xl shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 dark:disabled:bg-gray-600">
                                🚀 Mulai Post Test Modul
                            </button>
                        </Link>
                    </div>
                    <div className="hidden sm:flex w-full md:w-1/3 justify-center">
                        <Image src="/post-test.png" alt="Post Test" width={240} height={240} className="object-contain" />
                    </div>
                </div>
            </section>
        </>
    );
}
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import Link from "next/link";
import { Home, Target, Clock3, Activity, Eye, Lightbulb, Star } from 'lucide-react';
import { useAlert } from "@/context/AlertContext";

interface Question {
    _id: string;
    questionText: string;
    options: string[];
    durationPerQuestion?: number;
}

interface Modul {
    _id: string;
    title: string;
    slug: string;
}

interface User {
    _id: string;
}

interface TestResult {
    score: number;
    correct: number;
    total: number;
    timeTaken: number;
    timestamp: string;
    scoreDetails?: {
        accuracy: number;
        time: number;
        stability: number;
        focus: number;
    };
    weakTopics?: {
        topikId: string;
        title: string;
        slug: string;
        score: number;
    }[];
}

export default function PostTestPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams(); // 1. Dapatkan search params
    const slug = params.slug as string;
    const [modul, setModul] = useState<Modul | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [testIdx, setTestIdx] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [result, setResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // State baru untuk melacak ID unik
    const [changedQuestionIds, setChangedQuestionIds] = useState<Set<string>>(new Set());
    const [tabExitCount, setTabExitCount] = useState(0);

    const { showAlert } = useAlert();
    const questionAreaRef = useRef<HTMLDivElement>(null);

    const total = questions.length;

    const gradeTest = useCallback(async () => {
        if (!user || !modul) return;
        setIsSubmitting(true);
        try {
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/submit-test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testType: "post-test-modul",
                    answers: answers,
                    timeTaken: Math.round((Date.now() - startTime) / 1000),
                    modulId: modul._id,
                    answerChanges: changedQuestionIds.size,
                    tabExits: tabExitCount,
                }),
            });

            const resultData = await response.json();
            if (!response.ok) throw new Error(resultData.message || "Gagal mengirimkan jawaban.");

            setResult(resultData.data);

        } catch (err) {
            showAlert({
                title: 'Error',
                message: `Terjadi kesalahan: ${err instanceof Error ? err.message : 'Unknown error'}`,
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, startTime, user, modul, showAlert, changedQuestionIds, tabExitCount]);
    const handleAnswerChange = (questionId: string, option: string) => {
        setAnswers(prev => {
            // Cek apakah sudah ada jawaban sebelumnya untuk pertanyaan ini
            if (prev[questionId] && prev[questionId] !== option) {
                setChangedQuestionIds(currentSet => new Set(currentSet).add(questionId));
            }
            return { ...prev, [questionId]: option };
        });
    };

    // --- Test Focus Tracking (Tab Exits) ---
    useEffect(() => {
        const handleVisibilityChange = () => document.visibilityState === 'hidden' && setTabExitCount(c => c + 1);
        if (!result && !loading && total > 0) document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [result, loading, total]);

    useEffect(() => {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
            setUser(JSON.parse(userRaw));
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (!slug || !user) return;

        let isMounted = true; // Flag untuk mencegah update state pada unmounted component

        const fetchModulAndQuestions = async () => {
            const isRetake = searchParams.get('retake') === 'true';

            try {
                setLoading(true);

                // Ambil data modul terlebih dahulu untuk mendapatkan ID-nya
                const modulResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/user-view/${slug}`);
                if (!modulResponse.ok) throw new Error("Gagal memuat data modul.");
                const modulData: Modul = await modulResponse.json();
                if (!isMounted) return;

                setModul(modulData); // Set modul lebih awal

                if (!isRetake) {
                    // Cek apakah user sudah pernah menyelesaikan post-test ini
                    const resultResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/latest-by-type/post-test-modul?modulId=${modulData._id}`);
                    if (resultResponse.ok) {
                        const latestResult = await resultResponse.json();
                        if (latestResult) {
                            if (isMounted) {
                                setResult(latestResult);
                                setLoading(false);
                            }
                            return;
                        }
                    }
                }

                // Jika retake atau belum pernah mengerjakan, reset state dan ambil soal
                if (isRetake) {
                    setResult(null);
                    setAnswers({});
                    setTestIdx(0);
                    setChangedQuestionIds(new Set());
                    setTabExitCount(0);
                }

                // Ambil soal dan progress secara paralel
                const [questionsResponse, progressResponse] = await Promise.all([
                    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-modul/${modulData._id}`),
                    !isRetake ? authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/progress?testType=post-test-modul-progress&modulId=${modulData._id}`) : Promise.resolve(null)
                ]);

                if (!isMounted) return;

                // Proses hasil progress jika ada
                if (progressResponse && progressResponse.ok) {
                    const progressData = await progressResponse.json();
                    if (progressData?.answers?.length > 0) {
                        setAnswers(progressData.answers.reduce((acc: { [key: string]: string }, ans: { questionId: string, selectedOption: string }) => { acc[ans.questionId] = ans.selectedOption; return acc; }, {}) || {});
                        setTestIdx(progressData.currentIndex || 0);
                    }
                }

                // Proses hasil soal
                if (!questionsResponse.ok) {
                    if (questionsResponse.status === 404) setError("Tidak ada soal post-test yang tersedia untuk modul ini.");
                    else throw new Error("Gagal memuat soal post-test.");
                } else {
                    const questionsData: { questions: Question[] } = await questionsResponse.json();
                    setQuestions(questionsData.questions);
                    setStartTime(Date.now());
                }
            } catch (err) {
                if (isMounted) setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchModulAndQuestions();

        return () => {
            isMounted = false; // Set flag ke false saat komponen unmount
        };
    }, [slug, user, searchParams]);

    useEffect(() => {
        if (result || loading || error || questions.length === 0) return;

        const DURATION = questions.reduce((acc, q) => acc + (q.durationPerQuestion || 60), 0);
        const end = startTime + DURATION * 1000;

        const timerInterval = setInterval(() => {
            const left = Math.max(0, Math.round((end - Date.now()) / 1000));
            setTimeLeft(left);
            if (left === 0) {
                showAlert({
                    title: 'Waktu Habis',
                    message: 'Waktu pengerjaan telah berakhir. Jawaban Anda akan dikirim secara otomatis.',
                    onConfirm: gradeTest,
                });
                gradeTest();
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [result, loading, error, questions, startTime, gradeTest, showAlert]);

    const handleRetake = async () => {
        if (!user || !modul) return;
        showAlert({
            type: 'confirm',
            title: 'Ulangi Post-Test?',
            message: 'Apakah Anda yakin ingin mengulang post-test untuk modul ini? Hasil sebelumnya akan tetap tersimpan jika skor Anda saat ini lebih rendah.',
            confirmText: 'Ya, Ulangi',
            onConfirm: async () => {
                try {
                    // Hapus hasil dari DB
                    await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/by-type/post-test-modul?modulId=${modul._id}`, {
                        method: 'DELETE'
                    });

                    // Reload halaman dengan parameter retake
                    router.push(`/modul/${slug}/post-test?retake=true`);

                } catch (err) {
                    setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memulai ulang tes.");
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><p>Memuat...</p></div>;

    if (error) return (
        <div className="max-w-full mx-auto p-1.5">
            <nav className="flex mb-6" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                            <Home className="w-4 h-4 me-2.5" /> Dashboard
                        </Link>
                    </li>
                    {/* Breadcrumb lainnya bisa ditambahkan di sini */}
                </ol>
            </nav>
            <div className="mt-6 text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Terjadi Kesalahan</h2>
                <p className="text-red-600 dark:text-red-300 mt-2">{error}</p>
                <Link href={`/modul/${slug}`}>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Kembali ke Modul
                    </button>
                </Link>
            </div>
        </div>
    );

    if (result) {
        const isPassed = result.score >= 70;
        return (
            <div className="max-w-full mx-auto px-1.5 sm:px-3 lg:px-5 py-2 font-sans">
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
                        <li className="inline-flex items-center">
                            <Link href="/modul" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                                <Home className="w-4 h-4 me-2" />
                                Modul
                            </Link>
                        </li>
                        <li><div className="flex items-center"><svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg><Link href={`/modul/${slug}`} className="ms-1 text-sm font-medium hover:text-blue-600 md:ms-2 dark:hover:text-blue-400">{modul?.title || "..."}</Link></div></li>
                        <li aria-current="page"><div className="flex items-center"><svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg><span className="ms-1 text-sm font-medium text-gray-800 dark:text-gray-200 md:ms-2">Hasil Post Test</span></div></li>
                    </ol>
                </nav>

                <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 mt-6 shadow-lg border border-slate-200 dark:border-slate-700">

                    {/* === HEADER UTAMA === */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold tracking-tight
            bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
                            Tes Selesai!
                        </h2>

                        <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                            Berikut rangkuman hasil akhir dari modul {modul?.title || "Javascript Dasar"}
                        </p>

                        <div className="mt-3 h-1 w-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto" />
                    </div>


                    {/* === RINGKASAN ATAS === */}
                    <div
                        className="bg-slate-50 dark:bg-gray-700/40 
    p-6 rounded-xl border border-slate-200 
    dark:border-gray-700 shadow-sm flex flex-col gap-6"
                    >
                        {/* === BAGIAN ATAS: 3 STAT KECIL === */}
                        <div
                            className="grid grid-cols-3 gap-4 text-center 
        sm:flex sm:flex-row sm:justify-between"
                        >
                            {/* Skor */}
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Skor Kamu</p>
                                <p
                                    className={`text-3xl font-extrabold 
                ${isPassed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                >
                                    {Math.round(result.score)}%
                                </p>
                            </div>

                            {/* Waktu */}
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Waktu</p>
                                <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                                    {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                                </p>
                            </div>

                            {/* Benar */}
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Jawaban Benar</p>
                                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                                    {result.correct} / {result.total}
                                </p>
                            </div>
                        </div>

                        {/* === STATUS LULUS / GAGAL === */}
                        <div className="text-center border-t border-slate-200 dark:border-gray-600 pt-5">
                            {isPassed ? (
                                
                                <p className="text-green-600 dark:text-green-400 font-medium">
                                   Hebat! Modul ini berhasil kamu selesaikan
                                </p>
                            ) : (
                                <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                                    Belum tembus 70%. Yuk pelajari lagi materinya, kamu pasti bisa!
                                </p>
                            )}
                        </div>
                    </div>



                    {/* === DIVIDER === */}
                    <div className="relative my-6 flex items-center">
                        <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
                        <span className="mx-4 px-4 py-1 text-sm font-semibold 
            text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-800 
            rounded-full shadow-sm">
                            Analisis Performa Kamu
                        </span>
                        <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
                    </div>


                    {/* === RINCIAN SKOR === */}
                    {result.scoreDetails && (
                        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "Ketepatan", val: result.scoreDetails.accuracy, desc: "Persentase jawaban benar.", icon: <Target className="w-5 h-5 text-blue-600" />, gradient: "from-blue-500/10 to-blue-400/5 border-blue-300/20" },
                                { label: "Kecepatan", val: result.scoreDetails.time, desc: "Seberapa cepat kamu menyelesaikan tes.", icon: <Clock3 className="w-5 h-5 text-emerald-600" />, gradient: "from-emerald-500/10 to-emerald-400/5 border-emerald-300/20" },
                                { label: "Konsistensi", val: result.scoreDetails.stability, desc: "Stabil dalam menjawab tanpa ragu.", icon: <Activity className="w-5 h-5 text-indigo-600" />, gradient: "from-indigo-500/10 to-indigo-400/5 border-indigo-300/20" },
                                { label: "Fokus", val: result.scoreDetails.focus, desc: "Seberapa fokus kamu selama tes.", icon: <Eye className="w-5 h-5 text-amber-600" />, gradient: "from-amber-500/10 to-amber-400/5 border-amber-300/20" },
                            ].map((item, i) => (
                                <div key={i} className={`bg-gradient-to-br ${item.gradient} 
                    rounded-xl p-4 border shadow-sm transition hover:shadow-md`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.icon}
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</h4>
                                    </div>

                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-200">
                                        {item.val}%
                                    </div>

                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}


                    {/* === TOPIK YANG PERLU DIPERKUAT === */}
                    {result.weakTopics?.length > 0 && (
                        <div className="mt-10 bg-gradient-to-br from-yellow-50 to-amber-50 
            dark:from-yellow-900/20 dark:to-yellow-800/10 
            p-6 rounded-2xl border border-yellow-200 dark:border-yellow-800/40 shadow">

                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 text-lg flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                Topik yang Perlu Kamu Perkuat
                            </h4>

                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-5">
                                Ada beberapa topik yang masih bisa kamu tingkatkan. Yuk cek lagi biar makin mantap!
                            </p>

                            <ul className="space-y-3">
                                {result.weakTopics.map((topik) => (
                                    <li key={topik.topikId}
                                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center 
                            bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-xl 
                            text-sm text-yellow-800 dark:text-yellow-200 
                            border border-yellow-200 dark:border-yellow-800/40">

                                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                                            <Star className="w-4 h-4 text-yellow-600" />
                                            <span>{topik.title.replace(/^\d+\.?\s*/, '')}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 
                                px-2.5 py-0.5 rounded-lg shadow">
                                                Skor: {topik.score}%
                                            </span>

                                            <Link href={`/modul/${slug}#${topik.topikId}`}
                                                className="flex items-center gap-1 text-xs font-semibold 
                                    text-blue-700 dark:text-blue-300 
                                    bg-blue-100 dark:bg-blue-900/40 
                                    px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/60 transition">
                                                Pelajari
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}


                    {/* === TOMBOL === */}
                    <div className="mt-8 flex justify-between items-center">
                        <button
                            onClick={handleRetake}
                            className="px-4 py-2 text-blue-600 dark:text-blue-300 border border-blue-400/30 
                rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                            Ulangi Tes
                        </button>

                        <Link href={`/modul/${slug}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                            Kembali ke Modul
                        </Link>
                    </div>

                </section>



            </div>
        );
    }

    const currentQuestion = questions[testIdx];

    return (
        <div className="mt-20 max-w-full mx-auto px-1.5 sm:px-3 lg:px-5 py-5 font-sans">
            <nav className="flex mb-6" aria-label="Breadcrumb">
                <ol className="inline-flex items-center md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300 gap-1">
                    <li className="inline-flex items-center">
                        <Link href="/modul" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                            <Home className="w-4 h-4 me-2" />
                            Modul
                        </Link>
                    </li>
                    <li><div className="flex items-center"><svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg><Link href={`/modul/${slug}`} className="ms-1 text-sm font-medium hover:text-blue-600 md:ms-2 dark:hover:text-blue-400">{modul?.title || "..."}</Link></div></li>
                    <li aria-current="page"><div className="flex items-center"><svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg><span className="ms-1 text-sm font-medium text-gray-800 dark:text-gray-200 md:ms-2">Post Test Akhir</span></div></li>
                </ol>
            </nav>

            <header className="flex items-center justify-between gap-4 mt-6">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Post Test: {modul?.title}</h1>
                <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-sm bg-slate-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                    <span>Soal: {total}</span>
                    <span className="text-slate-300">|</span>
                    <span>Waktu: {formatTime(timeLeft)}</span>
                </div>
            </header>

            <section ref={questionAreaRef} className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg border border-slate-200 dark:border-slate-700">
                {currentQuestion && (
                    <div className="py-6">
                        <div className="flex items-start font-semibold mb-4 text-base text-slate-800 dark:text-slate-200">
                            <span className="mr-2">{testIdx + 1}.</span>
                            <div className="flex-1 overflow-x-auto">
                                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {currentQuestion.options.map((option, oIndex) => (
                                <label key={oIndex} className="flex items-start border border-slate-200 dark:border-gray-700 p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/50 has-[:checked]:border-blue-400 dark:has-[:checked]:border-blue-500 text-sm text-slate-700 dark:text-slate-300">
                                    <input
                                        type="radio"
                                        className="mr-2.5 mt-0.5 flex-shrink-0"
                                        name={`q${currentQuestion._id}`}
                                        value={option}
                                        checked={answers[currentQuestion._id] === option}
                                        onChange={() => handleAnswerChange(currentQuestion._id, option)} />
                                    <span className="break-words" dangerouslySetInnerHTML={{ __html: option }} />
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-center mt-6">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => setTestIdx(i => Math.max(0, i - 1))} disabled={testIdx === 0} className="flex-1 bg-white dark:bg-gray-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-gray-600 px-4 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-600">
                            Sebelumnya
                        </button>
                        {testIdx < total - 1 ? (
                            <button onClick={() => setTestIdx(i => Math.min(total - 1, i + 1))} className="flex-1 bg-blue-600 text-white border-none px-4 py-2.5 rounded-lg cursor-pointer hover:bg-blue-700 transition">
                                Berikutnya
                            </button>
                        ) : (
                            <button
                                onClick={() => showAlert({
                                    type: 'confirm',
                                    title: 'Kirim Jawaban?',
                                    message: 'Apakah Anda yakin ingin mengirimkan jawaban dan melihat hasilnya?',
                                    confirmText: 'Ya, Kirim',
                                    cancelText: 'Batal',
                                    onConfirm: gradeTest,
                                })}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none bg-green-600 text-white border-none px-4 py-2.5 rounded-lg cursor-pointer hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {isSubmitting ? 'Mengirim...' : 'Kirim Jawaban'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-2.5 bg-indigo-100 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
                    <div className="block h-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${((testIdx + 1) / total) * 100}%` }}></div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Pertanyaan ke <span>{testIdx + 1}</span> dari <span>{total}</span>
                </div>
            </section>
        </div>
    );
}
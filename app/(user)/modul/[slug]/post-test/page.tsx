"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import Link from "next/link";
import { Home, CheckCircle2, Lock, Rocket, Award } from 'lucide-react';
import hljs from 'highlight.js';

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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showAlert } = useAlert();
    const questionModalRef = useRef<HTMLDivElement>(null);

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
    }, [answers, startTime, user, modul, showAlert]);

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

        const fetchModulAndQuestions = async () => {
            const isRetake = searchParams.get('retake') === 'true'; // 2. Cek apakah ini mode retake

            try {
                setLoading(true);
                const modulRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/user-view/${slug}`);
                if (!modulRes.ok) throw new Error("Gagal memuat data modul.");
                const modulData: Modul = await modulRes.json();
                setModul(modulData);
                
                // 3. Lewati pengecekan hasil jika sedang retake
                if (!isRetake) {
                    // Cek apakah user sudah pernah menyelesaikan post-test ini
                    const resultRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/latest-by-type/post-test-modul?modulId=${modulData._id}`);
                    if (resultRes.ok) {
                        const latestResult = await resultRes.json();
                        if (latestResult) {
                            setResult(latestResult);
                            setLoading(false);
                            return;
                        }
                    }
                }

                // Cek progress jika belum ada hasil
                const progressRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/progress?testType=post-test-modul-progress&modulId=${modulData._id}`);
                if (progressRes.ok) {
                    const progressData = await progressRes.json();
                    if (progressData && progressData.answers && Array.isArray(progressData.answers) && progressData.answers.length > 0) {
                        setAnswers(progressData.answers.reduce((acc: { [key: string]: string }, ans: { questionId: string, selectedOption: string }) => {
                            acc[ans.questionId] = ans.selectedOption;
                            return acc;
                        }, {}) || {});
                        setTestIdx(progressData.currentIndex || 0);
                    }
                }

                const questionsRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-modul/${modulData._id}`);
                if (!questionsRes.ok) {
                    if (questionsRes.status === 404) setError("Tidak ada soal post-test yang tersedia untuk modul ini.");
                    else throw new Error("Gagal memuat soal post-test.");
                    return;
                }

                const questionsData: { questions: Question[] } = await questionsRes.json();
                if (questionsData.questions && questionsData.questions.length > 0) {
                    setQuestions(questionsData.questions);
                    setStartTime(Date.now()); // Mulai timer setelah soal berhasil dimuat
                } else {
                    setError("Tidak ada soal post-test yang tersedia untuk modul ini.");
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
            } finally {
                setLoading(false);
            }
        };

        fetchModulAndQuestions();
    }, [slug, user, searchParams]); // Tambahkan searchParams sebagai dependency

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

    useEffect(() => {
        if (questionModalRef.current) {
            questionModalRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [testIdx]);

    const handleRetake = async () => {
        if (!user || !modul) return;
        showAlert({
            type: 'confirm',
            title: 'Ulangi Post-Test?',
            message: 'Apakah Anda yakin ingin mengulang post-test untuk modul ini? Hasil sebelumnya akan tetap tersimpan jika skor Anda saat ini lebih rendah.',
            confirmText: 'Ya, Ulangi',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    setError(null);

                    // 1. Reset state lokal untuk memulai tes baru
                    setResult(null);
                    setAnswers({});
                    setTestIdx(0);
                    
                    // 2. Fetch ulang soal
                    const questionsRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-modul/${modul._id}`);
                    if (!questionsRes.ok) {
                        throw new Error("Gagal memuat ulang soal post-test.");
                    }
                    const questionsData: { questions: Question[] } = await questionsRes.json();
                    setQuestions(questionsData.questions || []);

                    // 3. Reset timer
                    setStartTime(Date.now());
                    
                    // 4. Hapus query param 'retake' dari URL tanpa reload
                    router.replace(`/modul/${slug}/post-test`, { scroll: false });

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
        <div className="max-w-7xl mx-auto p-5">
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
        const isPassed = result.score >= 80;
        return (
            <div className="max-w-7xl mx-auto p-5 font-sans">
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
                        <li className="inline-flex items-center">
                            <Link href="/modul" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">Modul</Link>
                        </li>
                        <li><div className="flex items-center"><svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg><Link href={`/modul/${slug}`} className="ms-1 text-sm font-medium hover:text-blue-600 md:ms-2 dark:hover:text-blue-400">{modul?.title || "..."}</Link></div></li>
                        <li aria-current="page"><div className="flex items-center"><svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg><span className="ms-1 text-sm font-medium text-gray-800 dark:text-gray-200 md:ms-2">Hasil Post Test</span></div></li>
                    </ol>
                </nav>

                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">Hasil Post Test: {modul?.title}</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2 bg-slate-50 dark:bg-gray-700/50 p-4 rounded-lg border border-slate-200 dark:border-gray-700">
                        <div className="text-center sm:text-left">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Skor Kamu</p>
                            <p className={`text-3xl font-bold ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{result.score.toFixed(0)}%</p>
                        </div>
                        <div className="text-center sm:text-right">
                            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Waktu</p>
                        </div>
                        <div className="text-center sm:text-right">
                            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{result.correct} / {result.total}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Jawaban Benar</p>
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        {isPassed ? (
                            <p className="text-green-600 dark:text-green-400">Selamat! Anda telah berhasil menyelesaikan modul ini.</p>
                        ) : (
                            <p className="text-yellow-600 dark:text-yellow-500">Skor Anda belum mencapai 80%. Silakan pelajari kembali materi modul ini.</p>
                        )}
                    </div>
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={handleRetake} className="bg-transparent text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-400/20 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                            Ulangi Tes
                        </button>
                        <Link href={`/modul/${slug}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            Kembali ke Modul
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    const currentQuestion = questions[testIdx];

    return (
        <div className="max-w-7xl mx-auto p-5 font-sans">
            <nav className="flex mb-6" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
                    <li className="inline-flex items-center">
                        <Link href="/modul" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">Modul</Link>
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

            <section ref={questionModalRef} className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg">
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
                                        onChange={() => setAnswers(prev => ({ ...prev, [currentQuestion._id]: option }))}
                                    />
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
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
import { authFetch } from '@/lib/authFetch';
import { useAlert } from '@/context/AlertContext';
import hljs from 'highlight.js';
// Impor tema terang sebagai default
import 'highlight.js/styles/stackoverflow-light.css';
// Impor tema gelap, yang akan kita aktifkan hanya pada dark mode
import 'highlight.js/styles/github-dark.css';

interface Question {
    _id: string;
    questionText: string;
    options: string[];
    answer: string;
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

export default function PostTestModulPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [idx, setIdx] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [totalDuration, setTotalDuration] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [modul, setModul] = useState<Modul | null>(null);

    const { showAlert } = useAlert();
    const total = questions.length;
    const questionAreaRef = useRef<HTMLDivElement>(null);

    // --- Notification Helper ---
    const createNotification = useCallback(async (message: string, link: string) => {
        if (!user) return;
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, message, link }),
            });
        } catch (error) {
            console.warn("Gagal membuat notifikasi:", error);
        }
    }, [user]);

    const grade = useCallback(async () => {
        if (!user || !modul) return;
        const timeTaken = Math.round((Date.now() - startTime) / 1000);

        try {
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/submit-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testType: 'post-test-modul',
                    modulId: modul._id,
                    answers,
                    timeTaken,
                }),
            });

            const resultData = await response.json();
            if (!response.ok) throw new Error(resultData.message || "Gagal mengirimkan jawaban.");

            const finalResult = resultData.data;
            setResult(finalResult);

            createNotification(
                `Anda telah menyelesaikan Post-Test Modul "${modul.title}" dengan skor ${finalResult.score}%.`,
                '/profil'
            );

        } catch (error) {
            showAlert({ title: 'Error', message: error instanceof Error ? error.message : "Terjadi kesalahan" });
        }
    }, [answers, startTime, user, modul, createNotification, showAlert]);

    useEffect(() => {
        const userRaw = localStorage.getItem('user');
        if (userRaw) setUser(JSON.parse(userRaw));
    }, []);

    useEffect(() => {
        if (!user || !slug) return;

        const fetchTestData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Modul Info
                const modulRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`);
                if (!modulRes.ok) throw new Error("Gagal memuat info modul.");
                const modulData = await modulRes.json();
                setModul(modulData);

                // 2. Check for existing result
                const resultRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/latest-by-type/post-test-modul?modulId=${modulData._id}`);
                if (resultRes.ok) {
                    const latestResult = await resultRes.json();
                    if (latestResult) {
                        setResult(latestResult);
                        setLoading(false);
                        return;
                    }
                }

                // 3. Fetch questions if no result
                const questionsRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-modul/${modulData._id}`);
                if (!questionsRes.ok) throw new Error("Gagal memuat soal post-test modul.");
                const data = await questionsRes.json();
                const fetchedQuestions = data.questions || [];
                setQuestions(fetchedQuestions);

                const duration = fetchedQuestions.reduce((acc: number, q: Question) => acc + (q.durationPerQuestion || 60), 0);
                setTotalDuration(duration);
                setTimeLeft(duration);
                setStartTime(Date.now());

            } catch (err) {
                setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
            } finally {
                setLoading(false);
            }
        };

        fetchTestData();
    }, [user, slug]);

    useEffect(() => {
        if (result) return;

        const end = startTime + totalDuration * 1000;
        const timerInterval = setInterval(() => {
            const left = Math.max(0, Math.round((end - Date.now()) / 1000));
            setTimeLeft(left);
            if (left === 0) {
                showAlert({
                    title: 'Waktu Habis',
                    message: 'Waktu pengerjaan telah berakhir. Jawaban Anda akan dikirim otomatis.',
                    onConfirm: grade,
                });
                grade();
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [startTime, grade, result, totalDuration, showAlert]);

    useEffect(() => {
        if (questionAreaRef.current) {
            questionAreaRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [idx, questions]);

    const currentQuestion = questions[idx];

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen"><p>Memuat post-test modul...</p></div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">Error: {error}</div>;
    }

    if (result) {
        const isSuccess = result.score >= 80;
        return (
            <div className="w-full font-sans p-6">
                <Breadcrumb paths={[{ name: "Dashboard", href: "/dashboard" }, { name: `Modul ${modul?.title}`, href: `/modul/${slug}` }, { name: "Hasil Post-test", href: "#" }]} />
                <header className="text-center my-8">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Hasil Post-test Modul: {modul?.title}</h1>
                </header>
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg max-w-2xl mx-auto text-center">
                    <div className={`p-6 rounded-lg mb-4 ${isSuccess ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                        <p className={`font-bold text-2xl ${isSuccess ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                            Skor Anda: {result.score}%
                        </p>
                        <p className={`mt-2 ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {isSuccess ? "Selamat! Anda telah berhasil menyelesaikan modul ini." : "Anda belum mencapai skor minimal (80). Coba pelajari kembali topik-topik di modul ini."}
                        </p>
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        <Link href={`/modul/${slug}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            Kembali ke Modul
                        </Link>
                        {/* Optional: Add a retake button */}
                    </div>
                </section>
            </div>
        );
    }

    if (questions.length === 0) {
        return <div className="p-6 text-center">Tidak ada soal post-test yang tersedia untuk modul ini.</div>
    }

    return (
        <div className="max-w-full mx-auto p-4 sm:p-5 my-4 sm:my-8 font-sans">
            <Breadcrumb paths={[{ name: "Dashboard", href: "/dashboard" }, { name: `Modul ${modul?.title}`, href: `/modul/${slug}` }, { name: "Post-test", href: "#" }]} />

            <header className="flex items-center justify-between gap-4 font-poppins mt-6">
                <div className="flex items-center gap-2">
                    <Image src="/logo1.png" width={40} height={40} className="h-10 w-auto" alt="Logo" />
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">Post-test Modul: {modul?.title}</h1>
                </div>
                <div className="flex gap-2 sm:gap-3 items-center justify-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm bg-slate-100 dark:bg-gray-800 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                    <span>Soal: {idx + 1}/{total}</span>
                    <span className="text-slate-300">|</span>
                    <span>Waktu: {`${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`}</span>
                </div>
            </header>

            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg">
                <div id="questionArea" ref={questionAreaRef}>
                    {currentQuestion && (
                        <div className="py-6">
                            <div className="flex items-start font-semibold mb-4 text-base text-slate-800 dark:text-slate-200">
                                <span className="mr-2">{idx + 1}.</span>
                                <div className="flex-1 overflow-x-auto">
                                    <div className="prose dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {currentQuestion.options.map((option, oIndex) => (
                                    <label
                                        key={oIndex}
                                        className="flex items-start border border-slate-200 dark:border-gray-700 p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/50 has-[:checked]:border-blue-400 dark:has-[:checked]:border-blue-500 text-sm text-slate-700 dark:text-slate-300"
                                    >
                                        <input
                                            type="radio"
                                            className="mr-2.5 mt-0.5 flex-shrink-0"
                                            name={`q${currentQuestion._id}`}
                                            value={option}
                                            checked={answers[currentQuestion._id] === option}
                                            onChange={() =>
                                                setAnswers((prev) => ({ ...prev, [currentQuestion._id]: option }))
                                            }
                                        />
                                        <span
                                            className="overflow-x-auto flex-1"
                                            dangerouslySetInnerHTML={{ __html: option }}
                                        ></span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-center mt-6">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setIdx(i => Math.max(0, i - 1))}
                            disabled={idx === 0}
                            className="flex-1 bg-white dark:bg-gray-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-gray-600 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-600 text-sm sm:text-base"
                        >
                            Sebelumnya
                        </button>
                        {idx < total - 1 ? (
                            <button
                                onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
                                disabled={idx === total - 1}
                                className="flex-1 bg-blue-600 text-white border-none px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition text-sm sm:text-base"
                            >
                                Berikutnya
                            </button>
                        ) : null}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                        {idx === total - 1 ? (
                            <button
                                onClick={() => showAlert({
                                    type: 'confirm',
                                    title: 'Kirim Jawaban?',
                                    message: 'Apakah Anda yakin ingin mengirimkan jawaban dan melihat hasilnya?',
                                    confirmText: 'Ya, Kirim',
                                    cancelText: 'Batal',
                                    onConfirm: grade,
                                })}
                                className="flex-1 sm:flex-none bg-green-600 text-white border-none px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg cursor-pointer hover:bg-green-700 transition text-sm sm:text-base"
                            >
                                Kirim Jawaban
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="h-2.5 bg-indigo-100 dark:bg-gray-700 rounded-full overflow-hidden mt-3" aria-hidden="true">
                    <i className="block h-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${((idx + 1) / total) * 100}%` }}></i>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Pertanyaan ke {idx + 1} dari {total}</div>
            </section>
        </div>
    );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, redirect } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

interface Question {
    _id: string;
    questionText: string;
    options: string[];
    answer: string;
    code?: string;
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

const TEST_DURATION = 15 * 60; // 15 menit dalam detik

export default function PostTestPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [modul, setModul] = useState<Modul | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [idx, setIdx] = useState(0);
    const [startTime] = useState(Date.now());
    const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
    const [result, setResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const total = questions.length;

    const gradeTest = useCallback(async () => {
        if (!user || !modul) return;
        let correctAnswers = 0;
        questions.forEach((q) => {
            if (answers[q._id] === q.answer) {
                correctAnswers++;
            }
        });

        const finalScore = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
        const timeTaken = Math.round((Date.now() - startTime) / 1000);

        const record = {
            score: finalScore,
            correct: correctAnswers,
            total: questions.length,
            timeTaken,
            timestamp: new Date().toISOString(),
        };

        const resultKey = `post_test_result_${user._id}_${modul._id}`;
        localStorage.setItem(resultKey, JSON.stringify(record));
        setResult(record);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...record,
                    testType: "post-test-modul",
                    modulId: modul._id,
                }),
            });
        } catch (err) {
            console.error("Gagal menyimpan hasil tes:", err);
        }
    }, [questions, answers, modul, user, startTime]);

    useEffect(() => {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
            setUser(JSON.parse(userRaw));
        } else {
            // Jika tidak ada user, redirect ke login
            redirect('/login');
        }
    }, []);

    useEffect(() => {
        if (!slug) return;
        if (!user) return;

        const fetchModulAndQuestions = async () => {
            try {
                setLoading(true);
                // Ambil data modul dulu untuk mendapatkan ID
                const modulRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`, { credentials: "include" });
                if (!modulRes.ok) throw new Error("Gagal memuat data modul.");
                const modulData: Modul = await modulRes.json();
                setModul(modulData);

                // Ambil soal post-test berdasarkan ID modul
                const resultKey = `post_test_result_${user._id}_${modulData._id}`;
                const resultRaw = localStorage.getItem(resultKey);
                if (resultRaw) {
                    setResult(JSON.parse(resultRaw));
                    return;
                }

                const questionsRes = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-modul/${modulData._id}`,
                    { credentials: "include" } // Tambahkan ini
                );

                if (!questionsRes.ok) {
                    if (questionsRes.status === 404) {
                        setError("Tidak ada soal post-test yang tersedia untuk modul ini.");
                    } else {
                        throw new Error("Gagal memuat soal post-test.");
                    }
                } else {
                    const questionsData: { questions: Question[] } = await questionsRes.json();
                    if (questionsData.questions && questionsData.questions.length > 0) {
                        setQuestions(questionsData.questions);
                    } else {
                        setError("Tidak ada soal post-test yang tersedia untuk modul ini.");
                    }
                }
            } catch (err: any) {
                setError(err.message || "Terjadi kesalahan.");
            } finally {
                setLoading(false);
            }
        };

        fetchModulAndQuestions();
    }, [slug, user]);

    useEffect(() => {
        if (result || loading || error) return;

        if (timeLeft <= 0) {
            alert('Waktu habis — jawaban akan dikirim otomatis.');
            gradeTest();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [result, loading, error, timeLeft, gradeTest]);

    const handleRetake = () => {
        if (!user || !modul) return;
        if (confirm('Mulai ulang post-test? Semua jawaban lokal akan dihapus.')) {
            const resultKey = `post_test_result_${user._id}_${modul._id}`;
            localStorage.removeItem(resultKey);
            window.location.reload();
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><p>Memuat...</p></div>;

    if (error) return (
        <div className="container mx-auto p-4 md:p-8">
            <Breadcrumb paths={[
                { name: "Modul", href: "/modul" },
                { name: modul?.title || "...", href: `/modul/${slug}` },
                { name: "Post Test", href: "#" }
            ]} />
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
            <div className="max-w-full p-5 font-sans">
                <Breadcrumb paths={modul ? [
                    { name: "Modul", href: "/modul" },
                    { name: modul?.title || "...", href: `/modul/${slug}` },
                    { name: "Hasil Post Test", href: "#" }
                ] : []} />
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">Hasil Post Test: {modul?.title}</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2 bg-slate-50 dark:bg-gray-700/50 p-4 rounded-lg border border-slate-200 dark:border-gray-700">
                        <div className="text-center sm:text-left">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Skor Kamu</p>
                            <p className={`text-3xl font-bold ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{result.score}%</p>
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

    const currentQuestion = questions[idx];

    return (
        <div className="max-w-full p-5 font-sans">
            <Breadcrumb paths={modul ? [
                { name: "Modul", href: "/modul" },
                { name: modul?.title || "...", href: `/modul/${slug}` },
                { name: "Post Test", href: "#" }
            ] : []} />

            <header className="flex items-center justify-between gap-4 mt-6">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Post Test: {modul?.title}</h1>
                <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-sm bg-slate-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                    <span>Soal: <span>{total}</span></span>
                    <span className="text-slate-300">|</span>
                    <span>Waktu: <span>{formatTime(timeLeft)}</span></span>
                </div>
            </header>

            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg">
                {currentQuestion && (
                    <div className="py-6">
                        <div className="flex items-start font-semibold mb-4 text-base text-slate-800 dark:text-slate-200">
                            <span className="mr-2">{idx + 1}.</span>
                            <div className="flex-1 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }} />
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
                        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1 bg-white dark:bg-gray-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-gray-600 px-4 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-600">
                            Sebelumnya
                        </button>
                        {idx < total - 1 && (
                            <button onClick={() => setIdx(i => Math.min(total - 1, i + 1))} className="flex-1 bg-blue-600 text-white border-none px-4 py-2.5 rounded-lg cursor-pointer hover:bg-blue-700 transition">
                                Berikutnya
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                        {idx === total - 1 && (
                            <button onClick={() => { if (confirm('Kirim jawaban dan lihat hasil?')) { gradeTest(); } }} className="flex-1 sm:flex-none bg-green-600 text-white border-none px-4 py-2.5 rounded-lg cursor-pointer hover:bg-green-700 transition">
                                Kirim Jawaban
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-2.5 bg-indigo-100 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
                    <div className="block h-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${((idx + 1) / total) * 100}%` }}></div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Pertanyaan ke <span>{idx + 1}</span> dari <span>{total}</span>
                </div>
            </section>
        </div>
    );
}
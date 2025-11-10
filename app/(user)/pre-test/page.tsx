"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
// 1. Import highlight.js dan tema CSS-nya
import { authFetch } from '@/lib/authFetch';
import { useAlert } from '@/context/AlertContext';
import hljs from 'highlight.js';

interface Question {
    _id: string;
    questionText: string;
    options: string[];
    answer: string;
    durationPerQuestion?: number;
}

interface Module {
    _id: string;
    title: string;
    slug: string;
    icon: string;
    category: 'mudah' | 'sedang' | 'sulit';
}

interface User {
    _id: string;
    // tambahkan properti lain jika perlu
}

export default function PreTestPage() {
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
    const [allModules, setAllModules] = useState<Module[]>([]);

    const { showAlert } = useAlert();
    const total = questions.length;

    // --- Notification Helper ---
    const createNotification = useCallback(async (message: string, link: string) => {
        if (!user) return;
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    message,
                    link,
                }),
            });
        } catch (error) {
            console.warn("Gagal membuat notifikasi:", error);
        }
    }, [user]);
    const grade = useCallback(() => {
        if (!user) return; // Pastikan user sudah ada
        let correct = 0;
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        questions.forEach(q => {
            // Jawaban yang dipilih user untuk soal q._id
            const userAnswer = answers[q._id];
            if (userAnswer === q.answer) correct++;
        });
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        const record = { score, correct, total, timeTaken, timestamp: new Date().toISOString() };

        // 1. Simpan hasil ke localStorage untuk ditampilkan segera
        const resultKey = `pretest_result_${user._id}`;
        localStorage.setItem(resultKey, JSON.stringify(record));
        setResult(record);

        // 2. Kirim hasil ke database
        const saveResultToDB = async () => {
            try {
                const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, { // Menggunakan endpoint baru
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...record,
                        testType: 'pre-test-global',
                    }),
                });
                if (!response.ok) {
                    console.error("Gagal menyimpan hasil pre-test ke database.");
                }
            } catch (error) {
                console.error("Error saat mengirim hasil pre-test:", error);
            }
        };

        saveResultToDB();

        // Buat notifikasi setelah menyelesaikan pre-test
        createNotification(
            `Anda telah menyelesaikan Pre-Test dengan skor ${score}%.`,
            '/profil' // Arahkan ke halaman profil/hasil
        );
    }, [answers, startTime, total, questions, user, createNotification]);

    useEffect(() => {
        const userRaw = localStorage.getItem('user');
        if (userRaw) setUser(JSON.parse(userRaw));
    }, []);

    useEffect(() => {
        if (!user) return; // Jangan lakukan apa-apa jika user belum termuat

        const fetchAndSetPreTestState = async () => {
            setLoading(true);
            try {
                // Prioritas 1: Cek hasil pre-test dari database
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/latest-by-type/pre-test-global`);

                if (res.ok) {
                    const latestResult = await res.json();
                    if (latestResult) {
                        // Sinkronkan localStorage dengan data server jika ada perbedaan
                        const resultKey = `pretest_result_${user._id}`;
                        const localResultRaw = localStorage.getItem(resultKey);
                        if (!localResultRaw || JSON.stringify(latestResult) !== localResultRaw) {
                            localStorage.setItem(resultKey, JSON.stringify(latestResult));
                        }
                        setResult(latestResult);
                        setLoading(false);
                        return; // Hasil ditemukan di DB, proses selesai.
                    }
                }

                // Prioritas 2: Jika tidak ada di DB, cek localStorage (untuk backward compatibility atau offline)
                const resultKey = `pretest_result_${user._id}`;
                const resultRaw = localStorage.getItem(resultKey);
                if (resultRaw) {
                    const parsedResult = JSON.parse(resultRaw);
                    // Kirim hasil dari localStorage ke DB jika belum ada di sana
                    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...parsedResult, testType: 'pre-test-global' }),
                    }).catch(err => console.warn("Gagal sinkronisasi hasil localStorage ke DB:", err));

                    setResult(parsedResult);
                    setLoading(false);
                    return; // Hasil ditemukan di localStorage, proses selesai.
                }

                // Prioritas 3: Jika tidak ada hasil sama sekali, muat soal untuk tes baru
                const questionsRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/pre-test`);
                if (!questionsRes.ok) throw new Error("Gagal memuat soal.");
                const data = await questionsRes.json();
                const fetchedQuestions = data.questions || [];
                setQuestions(fetchedQuestions);
                const duration = fetchedQuestions.reduce((acc: number, q: Question) => acc + (q.durationPerQuestion || 60), 0);
                setTotalDuration(duration);
                setTimeLeft(duration);

                // Muat progress yang belum selesai dari localStorage jika ada
                const stateKey = `pretest_state_${user._id}`;
                const progressRaw = localStorage.getItem(stateKey);
                if (progressRaw) {
                    const parsedProgress = JSON.parse(progressRaw);
                    setAnswers(parsedProgress.answers || {});
                    setIdx(parsedProgress.idx || 0);
                }
                setStartTime(Date.now());

            } catch (err) {
                setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetPreTestState();

    }, [user]); // Efek ini sekarang bergantung pada user

    // Fetch semua modul untuk ditampilkan di rekomendasi
    useEffect(() => {
        if (!result) return; // Hanya fetch jika sudah ada hasil

        const fetchAllModules = async () => {
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`);
                if (!res.ok) throw new Error("Gagal memuat data modul untuk rekomendasi.");
                const data = await res.json();
                setAllModules(data);
            } catch (err) {
                console.error("Error fetching modules for recommendation:", err);
            }
        };
        fetchAllModules();
    }, [result]); // Dijalankan ketika `result` sudah ada

    useEffect(() => {
        // Jangan jalankan timer jika hasil sudah ditampilkan
        if (result) return;

        const end = startTime + totalDuration * 1000;
        const timerInterval = setInterval(() => {
            const left = Math.max(0, Math.round((end - Date.now()) / 1000));
            setTimeLeft(left);
            if (left === 0) {
                showAlert({
                    title: 'Waktu Habis',
                    message: 'Waktu pengerjaan telah berakhir. Jawaban Anda akan dikirim secara otomatis.',
                    onConfirm: grade,
                });
                grade();
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [startTime, grade, result, totalDuration]);

    const persist = () => {
        if (!user) return;
        const stateKey = `pretest_state_${user._id}`;
        const snapshot = { answers, idx, timestamp: new Date().toISOString() };
        localStorage.setItem(stateKey, JSON.stringify(snapshot));
        showAlert({
            title: 'Progress Tersimpan',
            message: 'Jawaban Anda telah disimpan di perangkat ini. Anda dapat melanjutkannya nanti.',
        });
    };

    const handleRetake = () => {
        if (!user) return;
        showAlert({
            type: 'confirm',
            title: 'Konfirmasi',
            message: 'Apakah Anda yakin ingin memulai ulang pre-test? Semua progress dan hasil sebelumnya akan dihapus.',
            confirmText: 'Ya, Ulangi',
            cancelText: 'Batal',
            onConfirm: () => {
                const stateKey = `pretest_state_${user._id}`;
                const resultKey = `pretest_result_${user._id}`;
                localStorage.removeItem(stateKey);
                localStorage.removeItem(resultKey);
                // Hapus juga dari DB jika ada
                authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/pre-test-global`, { method: 'DELETE' })
                    .finally(() => window.location.reload());
            },
        });
    };

    const currentQuestion = questions[idx];

    // 2. Ref untuk menargetkan area pertanyaan
    const questionAreaRef = useRef<HTMLDivElement>(null);

    // 3. useEffect untuk menerapkan syntax highlighting
    useEffect(() => {
        if (questionAreaRef.current) {
            // Temukan semua blok <pre><code> di dalam area pertanyaan dan terapkan highlight
            questionAreaRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [idx, questions]); // Jalankan setiap kali soal berubah

    if (loading && !result) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600 dark:text-gray-200">Memuat soal pre-test...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">Error: {error}</div>;
    }

    if (!loading && questions.length === 0 && !result) return <div className="p-6 text-center">Tidak ada soal pre-test yang tersedia saat ini.</div>

    if (result) {
        let level: 'dasar' | 'menengah' | 'lanjut' | null = null;
        let levelBadge = '', badgeClasses = '', profileDesc = '';
        const avgTimePerQuestion = result.timeTaken / total;

        if (result.score >= 75) {
            level = 'lanjut';
            levelBadge = 'Level: Lanjut';
            badgeClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            profileDesc = avgTimePerQuestion <= 20 ? 'Profil: Cepat & Tepat. Kamu siap ke materi tingkat lanjut dengan kecepatan tinggi.' : 'Profil: Teliti & Paham. Pemahaman bagus, mari latih efisiensi.';
        } else if (result.score >= 40) {
            level = 'menengah';
            levelBadge = 'Level: Menengah';
            badgeClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            profileDesc = avgTimePerQuestion < 15 ? 'Profil: Grasp Cepat. Kamu cepat memahami, tapi hati-hati dengan kesalahan konsep.' : 'Profil: Stabil. Waktu dan hasil seimbang, perkuat konsep inti.';
        } else {
            level = 'dasar';
            levelBadge = 'Level: Dasar';
            badgeClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            profileDesc = avgTimePerQuestion < 15 ? 'Profil: Terburu-buru. Sebaiknya ulangi dasar dengan pelan-pelan.' : 'Profil: Perlu Penguatan. Fokus dulu ke materi dasar.';
        }

        const categoryMap = { mudah: 'dasar', sedang: 'menengah', sulit: 'lanjut' };
        const recommendedModules = allModules.filter(m => categoryMap[m.category] === level);

        return (
            <div className="w-full font-sans">
                <Breadcrumb paths={[
                    { name: "Dashboard", href: "/dashboard" },
                    { name: "Hasil Pre-test", href: "#" }
                ]} />
                <header className="flex items-center justify-between gap-2 font-poppins mt-6">
                    <div className="flex items-center gap-2">
                        <Image src="/logo1.png" width={40} height={40} className="h-10 w-auto" alt="Logo" />
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">Hasil Pre-test</h1>
                    </div>
                </header>

                <section className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-6 mt-6 shadow-md text-white flex items-center gap-4">
                    <Image src="/test.png" width={80} height={80} className="h-20 w-20" alt="pre test" />
                    <div>
                        <h2 className="text-base font-bold ">Pre-test Selesai!</h2>
                        <p className="text-sm opacity-90">Berikut adalah hasil dan rekomendasi jalur belajarmu.</p>
                    </div>
                </section>
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg font-poppins" id="resultCard">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-gray-700/50 p-4 rounded-lg border border-slate-200 dark:border-gray-700">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Skor Kamu</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.score}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Waktu</p>
                        </div>

                        <div className="text-right">
                            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{result.correct} / {result.total}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Jawaban Benar</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-base font-semibold mb-3 text-slate-800 dark:text-slate-200">Rekomendasi Jalur Belajar</h3>
                        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex flex-wrap gap-2 items-center mb-3">
                                <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${badgeClasses} dark:bg-opacity-20`}>{levelBadge}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{profileDesc}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {recommendedModules.length > 0 ? (
                                    recommendedModules.map(modul => (
                                        <Link href={`/modul/${modul.slug}`} key={modul._id} className="flex items-center gap-3 border border-slate-200 dark:border-gray-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                                            <Image src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`} alt={modul.title} width={32} height={32} className="w-8 h-8 rounded" />
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{modul.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Materi {level}</p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada modul yang direkomendasikan untuk level ini.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button onClick={handleRetake} className="bg-transparent text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-400/20 px-3.5 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">Ulangi Pre-test</button>
                        <Link href="/modul" className="bg-blue-600 hover:bg-blue-700 text-white border-none px-3.5 py-2.5 rounded-lg cursor-pointer">Lihat Rekomendasi Modul</Link>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-3">Catatan: Hasil ini disimpan secara lokal untuk personalisasi pengalaman belajar.</div>
                </section>
                <footer className="bg-white dark:bg-gray-800 p-4 text-center text-gray-600 dark:text-gray-400 text-sm mt-8 shadow-inner font-poppins">
                    <p>&copy; 2025 KELAS. All rights reserved.</p>
                </footer>
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto p-4 sm:p-5 my-4 sm:my-8 font-sans">
            <Breadcrumb paths={[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Pre-test", href: "#" }
            ]} />

            <header className="flex items-center justify-between gap-4 font-poppins mt-6">
                <div className="flex items-center gap-2">
                    <Image src="/logo1.png" width={40} height={40} className="h-10 w-auto" alt="Logo" />
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">Pre-test</h1>
                </div>
                <div className="flex gap-2 sm:gap-3 items-center justify-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm bg-slate-100 dark:bg-gray-800 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                    <span className="hidden sm:inline">Soal: </span><span>{idx + 1}/{total}</span>
                    <span className="text-slate-300">|</span>
                    <span>Waktu: <span>{`${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`}</span></span>
                </div>
            </header>

            <section className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-6 mt-6 shadow-md text-white flex items-center gap-4">
                <Image src="/test.png" width={80} height={80} className="h-20 w-20" alt="pre test" />
                <div>
                    <h2 className="text-base font-bold ">Selamat Datang di Pre-test</h2>
                    <p className="text-sm opacity-90">Kerjakan soal ini untuk menentukan level belajar yang sesuai denganmu 🎯</p>
                </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg" id="pretestCard">
                <div id="questionArea" ref={questionAreaRef}> {/* Tambahkan ref di sini */}
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
                                            className="overflow-x-auto whitespace-nowrap flex-1 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
                                            dangerouslySetInnerHTML={{ __html: option }}
                                        ></span>
                                    </label>



                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tombol Kontrol Responsif */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-center mt-6">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            id="prevBtn"
                            onClick={() => setIdx(i => Math.max(0, i - 1))}
                            disabled={idx === 0}
                            className="flex-1 bg-white dark:bg-gray-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-gray-600 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-600 text-sm sm:text-base"
                        >
                            Sebelumnya
                        </button>
                        {idx < total - 1 ? (
                            <button
                                id="nextBtn"
                                onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
                                disabled={idx === total - 1}
                                className="flex-1 bg-blue-600 text-white border-none px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition text-sm sm:text-base"
                            >
                                Berikutnya
                            </button>
                        ) : null}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                        <button
                            id="saveBtn"
                            onClick={persist}
                            className="flex-1 sm:flex-none bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-none px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/80 transition text-sm sm:text-base"
                        >
                            Simpan
                        </button>
                        {idx === total - 1 ? (
                            <button
                                id="submitBtn"
                                onClick={() => showAlert({
                                    type: 'confirm',
                                    title: 'Kirim Jawaban?',
                                    message: 'Apakah Anda yakin ingin mengirimkan jawaban dan melihat hasilnya?',
                                    confirmText: 'Ya, Kirim',
                                    cancelText: 'Batal',
                                    onConfirm: grade,
                                })
                                }
                                className="flex-1 sm:flex-none bg-green-600 text-white border-none px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg cursor-pointer hover:bg-green-700 transition text-sm sm:text-base"
                            >
                                Kirim Jawaban
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="h-2.5 bg-indigo-100 dark:bg-gray-700 rounded-full overflow-hidden mt-3" aria-hidden="true">
                    <i id="progBar" className="block h-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${((idx + 1) / total) * 100}%` }}></i>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Pertanyaan ke <span>{idx + 1}</span> dari <span>{total}</span></div>
            </section>

            <footer className="bg-white dark:bg-gray-800 p-4 text-center text-gray-600 dark:text-gray-400 text-sm mt-8 shadow-inner font-poppins">
                <p>&copy; 2025 KELAS. All rights reserved.</p>
            </footer>
        </div>
    );
}
"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { Info, X } from 'lucide-react';
import { authFetch } from "@/lib/authFetch";
import { useAlert } from "@/context/AlertContext";

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
    progress?: number;
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
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isRecommendationInfoModalOpen, setIsRecommendationInfoModalOpen] = useState(false);
    const [tabExitCount, setTabExitCount] = useState(0);
    const questionAreaRef = useRef<HTMLDivElement>(null);

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
        const timeTaken = Math.round((Date.now() - startTime) / 1000);

        // Pastikan semua soal terkirim, meskipun tidak dijawab
        const finalAnswers = { ...answers };
        questions.forEach(q => {
            if (!finalAnswers[q._id]) {
                finalAnswers[q._id] = ""; // Kirim string kosong untuk soal yang tidak dijawab
            }
        });

        const submitAndGrade = async () => {
            try {
                const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/submit-test`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        testType: 'pre-test-global',
                        answers: finalAnswers,
                        timeTaken,
                        tabExits: tabExitCount,
                    }),
                });
                const resultData = await response.json();
                if (!response.ok) {
                    throw new Error(resultData.message || "Gagal mengirimkan jawaban.");
                }

                // Simpan hasil lengkap (termasuk skor fitur) ke state dan localStorage
                setResult(resultData.data);
                localStorage.setItem(`pretest_result_${user._id}`, JSON.stringify(resultData.data));

                // Buat notifikasi
                createNotification(
                    `Kamu telah menyelesaikan Pre-Test dengan skor ${resultData.data.score}%.`,
                    '/profil' // Arahkan ke halaman profil/hasil
                );

            } catch (error) {
                console.error("Error saat mengirim hasil pre-test:", error);
                showAlert({ title: 'Error', message: 'Gagal mengirimkan hasil pre-test.' });
            }
        };

        submitAndGrade();
    }, [answers, createNotification, showAlert, startTime, user, tabExitCount, questions]);

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

                // Muat progress yang belum selesai dari localStorage jika ada
                const stateKey = `pretest_state_${user._id}`;
                const progressRaw = localStorage.getItem(stateKey);
                
                let initialTimeLeft = duration;
                let initialStartTime = Date.now();

                if (progressRaw) {
                    const parsedProgress = JSON.parse(progressRaw);
                    setAnswers(parsedProgress.answers || {});
                    setIdx(parsedProgress.idx || 0);
                    setTabExitCount(parsedProgress.tabExitCount || 0);

                    // Restore timer jika ada data tersimpan
                    if (typeof parsedProgress.timeLeft === 'number') {
                        initialTimeLeft = parsedProgress.timeLeft;
                        // Hitung startTime mundur agar timer melanjutkan dari sisa waktu
                        const timeSpent = duration - initialTimeLeft;
                        initialStartTime = Date.now() - (timeSpent * 1000);
                    }
                }
                
                setTimeLeft(initialTimeLeft);
                setStartTime(initialStartTime);

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
                clearInterval(timerInterval);
                showAlert({
                    title: 'Waktu Habis',
                    message: 'Waktu pengerjaan telah berakhir. Jawabanmu akan dikirim secara otomatis.',
                    onConfirm: grade,
                });
                grade();
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [startTime, grade, result, totalDuration]);

    // Effect untuk mendeteksi keluar tab (Fokus Tracking)
    useEffect(() => {
        if (result) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setTabExitCount(prev => prev + 1);
                showAlert({
                    title: 'Peringatan Fokus',
                    message: 'Kamu terdeteksi meninggalkan halaman tes. Aktivitas ini tercatat dan dapat mengurangi skor fokusmu.',
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [result, showAlert]);

    // Effect for syntax highlighting and copy button
    useEffect(() => {
        if (!questionAreaRef.current) return;

        // 1. Highlight Code Blocks
        questionAreaRef.current.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block as HTMLElement);
        });

        // 2. Add Copy Button
        const codeBlocks = questionAreaRef.current.querySelectorAll('pre');
        codeBlocks.forEach(preElement => {
            if (preElement.parentElement?.classList.contains('code-block-wrapper')) return;

            const copyButton = document.createElement('button');
            copyButton.title = 'Salin kode';
            copyButton.className = 'copy-button absolute top-2 right-2 p-2 bg-gray-700/50 dark:bg-gray-800/60 text-gray-300 rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 transition-all duration-200';
            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

            copyButton.addEventListener('click', () => {
                const codeElement = preElement.querySelector('code');
                const codeToCopy = codeElement ? codeElement.innerText : '';
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    copyButton.classList.add('text-green-400');
                    setTimeout(() => {
                        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                        copyButton.classList.remove('text-green-400');
                    }, 2000);
                });
            });

            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper relative';
            wrapper.appendChild(copyButton);
            preElement.parentNode?.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement);
        });
    }, [idx, questions]);

    const persist = () => {
        if (!user) return;
        const stateKey = `pretest_state_${user._id}`;
        const snapshot = { answers, idx, timeLeft, tabExitCount, timestamp: new Date().toISOString() };
        localStorage.setItem(stateKey, JSON.stringify(snapshot));
        showAlert({
            title: 'Progress Tersimpan',
            message: 'Jawabanmu telah disimpan di perangkat ini. Anda dapat melanjutkannya nanti.',
        });
    };

    const handleRetake = () => {
        if (!user) return;

        // Cek apakah user sudah memiliki progres di modul manapun
        const hasProgress = allModules.some(m => (m.progress || 0) > 0);

        if (hasProgress) {
            showAlert({
                title: 'Akses Ditolak',
                message: 'Kamu tidak dapat mengulang Pre-Test karena sudah mulai mengerjakan modul. Silakan lanjutkan pembelajaranmu.',
                confirmText: 'Mengerti',
            });
            return;
        }

        showAlert({
            type: 'confirm',
            title: 'Konfirmasi',
            message: 'Apakah kamu yakin ingin memulai ulang pre-test? Semua progress dan hasil sebelumnya akan dihapus.',
            confirmText: 'Ya, Ulangi',
            cancelText: 'Batal',
            onConfirm: () => {
                const stateKey = `pretest_state_${user._id}`;
                const resultKey = `pretest_result_${user._id}`;
                localStorage.removeItem(stateKey);
                localStorage.removeItem(resultKey);
                // Hapus juga dari DB jika ada
                authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/by-type/pre-test-global`, { method: 'DELETE' })
                    .finally(() => window.location.reload());
            },
        });
    };

    const currentQuestion = questions[idx];

    // Memoize HTML object untuk mencegah re-render saat timer berjalan (yang menyebabkan style highlight.js hilang)
    const questionHtml = useMemo(() => {
        return currentQuestion ? { __html: currentQuestion.questionText } : undefined;
    }, [currentQuestion]);

    // Memoize Options HTML object untuk mencegah re-render pada pilihan jawaban saat timer berjalan
    const questionOptionsHtml = useMemo(() => {
        return currentQuestion?.options.map(opt => ({ __html: opt })) || [];
    }, [currentQuestion]);

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
        // Gunakan result.learningPath dari backend sebagai sumber kebenaran
        const learningPath = result.learningPath; // "Dasar", "Menengah", atau "Lanjutan"
        let level: 'dasar' | 'menengah' | 'lanjut';
        let levelBadge = '', badgeClasses = '', profileDesc = '';

        if (learningPath === 'Lanjutan') {
            level = 'lanjut';
            levelBadge = 'Level: Lanjut';
            badgeClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            profileDesc = 'Penguasaan materi kamu sangat baik. Kamu direkomendasikan untuk langsung menuju materi tingkat lanjut.';
        } else if (learningPath === 'Menengah') {
            level = 'menengah';
            levelBadge = 'Level: Menengah';
            badgeClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            profileDesc = 'Kamu telah menguasai materi dasar. Kamu dapat melewati modul dasar dan memulai dari level menengah.';
        } else { // Default ke "Dasar"
            level = 'dasar';
            levelBadge = 'Level: Dasar';
            badgeClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            profileDesc = 'Sebaiknya Kamu memulai dari materi dasar untuk memperkuat pemahaman fundamental kamu.';
        }

        const categoryMap = { mudah: 'dasar', sedang: 'menengah', sulit: 'lanjut' };
        const recommendedModules = allModules.filter(m => categoryMap[m.category] === level);

        return (
            <div className="w-full font-sans mt-22">
                <Breadcrumb paths={[
                    { name: "Dashboard", href: "/dashboard" },
                    { name: "Hasil Pre-test", href: "#" }
                ]} />
                <header className="flex items-center justify-between gap-2 font-poppins mt-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo1.png" width={256} height={256} className="h-10 w-auto" alt="Logo" />
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">Hasil Pre-test</h1>
                    </div>
                </header>

                <section className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-4 mt-6 shadow-md text-white flex items-center gap-4">
                    <img src="/test.png" width={256} height={256} className="h-24 w-24" alt="pre test" />
                    <div>
                        <h2 className="text-base font-bold ">Pre-test Selesai!</h2>
                        <p className="text-sm opacity-90">Berikut adalah hasil dan rekomendasi jalur belajarmu.</p>
                    </div>
                </section>
                <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg font-poppins" id="resultCard">
                    <div className="flex items-center justify-between gap-2 sm:gap-4 bg-slate-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-gray-700">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Skor Kamu</p>
                                <button onClick={() => setIsInfoModalOpen(true)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                    <Info size={14} />
                                </button>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{result.score}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Waktu</p>
                        </div>

                        <div className="text-right">
                            <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">{result.correct} / {result.total}</p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Jawaban Benar</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-base font-semibold mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            Rekomendasi Jalur Belajar
                            <button onClick={() => setIsRecommendationInfoModalOpen(true)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <Info size={14} />
                            </button>
                        </h3>
                        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex flex-wrap gap-2 items-center mb-3">
                                <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${badgeClasses} dark:bg-opacity-20`}>{levelBadge}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{profileDesc}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {recommendedModules.length > 0 ? (
                                    recommendedModules.map(modul => (
                                        <Link href={`/modul/${modul.slug}`} key={modul._id} className="flex items-center gap-3 border border-slate-200 dark:border-gray-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                                            <img src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`} alt={modul.title} width={128} height={128} className="w-8 h-8 rounded" />
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
                   
                </section>
                <footer className="bg-white dark:bg-gray-800 p-4 text-center text-gray-600 dark:text-gray-400 text-sm mt-8 shadow-inner font-poppins">
                    <p>&copy; 2025 KELAS. All rights reserved.</p>
                </footer>

                {/* Modal Informasi Rekomendasi Jalur Belajar */}
                {isRecommendationInfoModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 z-[99] flex justify-center items-start md:items-center p-4" onClick={() => setIsRecommendationInfoModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg relative mt-8 md:mt-0 animate-in fade-in-0 zoom-in-95" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setIsRecommendationInfoModalOpen(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="text-center mb-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-3">
                                    <Info className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Rekomendasi Jalur Belajar</h3>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Sistem akan memberi rekomendasi jalur belajar berdasarkan hasil pre-test kamu di tiga bagian : materi
                                <span className="font-semibold"> Dasar </span>
                                ,
                                <span className="font-semibold"> Menengah</span> dan
                                <span className="font-semibold"> Lanjutan</span>.
                            </p>

                            <div className="space-y-3 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">

                                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                                    <p className="font-bold text-green-700 dark:text-green-300">Jalur Lanjutan</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Kamu masuk jalur ini kalau nilai rata-rata materi Dasar minimal 85 persen dan nilai materi Menengah minimal 75 persen.
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                                    <p className="font-bold text-blue-700 dark:text-blue-300">Jalur Menengah</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Kamu dapat jalur ini kalau nilai rata-rata materi Dasar minimal 75 persen, tapi belum memenuhi syarat untuk masuk jalur Lanjutan.
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
                                    <p className="font-bold text-yellow-700 dark:text-yellow-300">Jalur Dasar</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Kalau nilai kamu belum memenuhi syarat buat jalur Menengah atau Lanjutan, sistem akan memberi saran mulai dari Jalur Dasar dulu.
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>
                )}

                {/* Modal Informasi Skor */}
                {isInfoModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 z-[99] flex justify-center items-start md:items-center p-4" onClick={() => setIsInfoModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative mt-8 md:mt-0 animate-in fade-in-0 zoom-in-95" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setIsInfoModalOpen(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="text-center mb-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-3">
                                    <Info className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Asal Perhitungan Skor</h3>
                            </div>                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                "Skor Kamu" adalah skor akhir yang dihitung dari 4 komponen dengan bobot berbeda untuk memberikan gambaran performa yang lebih komprehensif.
                            </p>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start">
                                    <span className="font-semibold text-green-600 dark:text-green-400 w-28 flex-shrink-0">Ketepatan (60%)</span>
                                    <span className="text-gray-500 dark:text-gray-400">Berdasarkan bobot indikator dari setiap jawaban yang benar.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-blue-600 dark:text-blue-400 w-28 flex-shrink-0">Kecepatan (15%)</span>
                                    <span className="text-gray-500 dark:text-gray-400">Seberapa efisien Anda menyelesaikan tes dibandingkan total waktu yang tersedia.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-yellow-600 dark:text-yellow-400 w-28 flex-shrink-0">Stabilitas (10%)</span>
                                    <span className="text-gray-500 dark:text-gray-400">Seberapa sering Anda mengubah jawaban. Lebih sedikit perubahan berarti skor lebih tinggi.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-purple-600 dark:text-purple-400 w-28 flex-shrink-0">Fokus (15%)</span>
                                    <span className="text-gray-500 dark:text-gray-400">Seberapa sering Anda keluar dari halaman tes. Lebih sedikit keluar berarti skor lebih tinggi.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto p-2 font-sans mt-22">
            <style jsx global>{`
                .prose pre { white-space: pre; overflow-x: auto; }
                /* Paksa background gelap untuk block code di mode terang */
                html:not(.dark) .prose pre {
                    background-color: #0d1117; /* Warna dari github-dark.css */
                    color: #c9d1d9;
                }
                /* Mode Gelap: Background Gray */
                html.dark .prose pre {
                    background-color: #374151;
                    color: #e5e7eb;
                }

                /* Tambahkan rounded pada block code di dalam kartu pre-test (soal & jawaban) */
                #pretestCard pre {
                    border-radius: 0.5rem;
                }

                /* Penyesuaian ukuran font block code untuk mobile */
                @media (max-width: 640px) {
                    #pretestCard pre {
                        font-size: 12px !important;
                        padding: 0.5rem !important;
                    }
                    #pretestCard code {
                        font-size: 12px !important;
                    }
                }
            `}</style>
            <Breadcrumb paths={[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Pre-test", href: "#" }
            ]} />

            <header className="flex items-center justify-between gap-4 font-poppins mt-6">
                <div className="flex items-center gap-2">
                
                    <img src="/logo1.png" width={256} height={256} className="h-10 w-auto" alt="Logo" />
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">Pre-test</h1>
                </div>
                <div className="flex gap-2 sm:gap-3 items-center justify-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm bg-slate-100 dark:bg-gray-800 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                    <span className="hidden sm:inline">Soal: </span><span>{idx + 1}/{total}</span>
                    <span className="text-slate-300">|</span>
                    <span>Waktu: <span>{`${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`}</span></span>
                </div>
            </header>

            <section className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-4 mt-6 shadow-md text-white flex items-center gap-4">
                <img src="/test.png" width={256} height={256} className="h-24 w-24" alt="pre test" />
                <div>
                    <h2 className="text-base font-bold ">Selamat Datang di Pre-test</h2>
                    <p className="text-sm opacity-90">Kerjakan soal ini untuk menentukan level belajar yang sesuai denganmu</p>
                </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-lg" id="pretestCard">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Area Soal (Kiri di Desktop) */}
                    <div className="flex-1 order-2 lg:order-1">
                        <div id="questionArea" ref={questionAreaRef}>
                            {currentQuestion && (
                                <div className="py-0 lg:py-2">
                                    <div className="flex items-start mb-4 text-base text-slate-800 dark:text-slate-200">
                                        <span className="mr-2">{idx + 1}.</span>
                                        <div className="flex-1 overflow-x-auto">
                                            <div className="prose dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={questionHtml}
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
                                                    dangerouslySetInnerHTML={questionOptionsHtml[oIndex]}
                                                ></span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tombol Kontrol Responsif */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-center mt-8">
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
                                        onClick={() => {
                                            // Cek apakah semua soal sudah dijawab
                                            if (Object.keys(answers).length < total) {
                                                showAlert({
                                                    title: 'Jawaban Belum Lengkap',
                                                    message: `Kamu baru menjawab ${Object.keys(answers).length} dari ${total} soal. Silakan lengkapi semua jawaban sebelum mengirim.`,
                                                });
                                            } else {
                                                // Jika sudah lengkap, tampilkan konfirmasi
                                                showAlert({
                                                    type: 'confirm',
                                                    title: 'Kirim Jawaban?',
                                                    message: 'Apakah kamu yakin ingin mengirimkan jawaban dan melihat hasilnya?',
                                                    confirmText: 'Ya, Kirim',
                                                    cancelText: 'Batal',
                                                    onConfirm: grade,
                                                });
                                            }
                                        }}
                                        className="flex-1 sm:flex-none bg-green-600 text-white border-none px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg cursor-pointer hover:bg-green-700 transition text-sm sm:text-base"
                                    >
                                        Kirim Jawaban
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="h-2.5 bg-indigo-100 dark:bg-gray-700 rounded-full overflow-hidden mt-6" aria-hidden="true">
                            <div
                                id="progBar"
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out"
                                style={{
                                    width: `${((idx + 1) / total) * 100}%`,
                                    backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 2_55, 255, 0.15) 75%, transparent 75%, transparent)',
                                    backgroundSize: '40px 40px',
                                    animation: 'progress-bar-stripes 1s linear infinite'
                                }}></div>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Pertanyaan ke <span>{idx + 1}</span> dari <span>{total}</span></div>
                    </div>

                    {/* Navigasi Soal (Kanan di Desktop) */}
                    <div className="lg:w-80 flex-shrink-0 order-1 lg:order-2">
                        <div className="mb-0 p-5 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-200 dark:border-gray-700/50 sticky top-24">
                            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                    Navigasi Soal
                                </h3>
                                <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded bg-blue-600"></span>
                                        <span>Sudah</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></span>
                                        <span>Belum</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded border-2 border-blue-500"></span>
                                        <span>Aktif</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-4 gap-2">
                                {questions.map((q, index) => {
                                    const isAnswered = answers[q._id] !== undefined;
                                    const isCurrent = idx === index;
                                    return (
                                        <button
                                            key={q._id}
                                            onClick={() => setIdx(index)}
                                            className={`h-10 w-full rounded-lg text-sm font-semibold transition-all flex items-center justify-center relative
                                                ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800 z-10' : ''}
                                                ${isAnswered 
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                                                    : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm'}
                                            `}
                                            title={`Soal ${index + 1}${isAnswered ? ' (Terjawab)' : ''}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-white dark:bg-gray-800 p-4 text-center text-gray-600 dark:text-gray-400 text-sm mt-8 shadow-inner font-poppins">
                <p>&copy; 2025 KELAS. All rights reserved.</p>
            </footer>
        </div>
    );
}
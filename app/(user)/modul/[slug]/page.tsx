"use client";

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
// 1. Import highlight.js dan tema CSS-nya
import hljs from 'highlight.js';
// Impor tema terang sebagai default
import 'highlight.js/styles/stackoverflow-light.css';
// Impor tema gelap, yang akan kita aktifkan hanya pada dark mode
import 'highlight.js/styles/github-dark.css';
import { authFetch } from '@/lib/authFetch'; // <-- Import helper baru
import { useAlert } from '@/context/AlertContext';

import TopicContent from '@/components/TopicContent';
import { Home, CheckCircle2, Lock, Rocket, Award, AlertTriangle, Star, Lightbulb, Target, Clock3, Activity, Eye } from 'lucide-react';
import { motion } from "framer-motion";


// --- Interface Definitions ---
interface User {
    _id: string;
}

interface Question {
    _id: string;
    questionText: string;
    options: string[];
    answer?: string; // Optional, as it's not sent to the client initially
    durationPerQuestion?: number;
}

interface Materi {
    _id: string;
    subMateris: {
        _id: string;
        title: string;
        content: string;
    }[];
    youtube?: string;
}

interface Topik {
    _id: string;
    title: string;
    slug: string;
    materi?: Materi | null;
    questions: Question[];
    isCompleted: boolean;
    hasAttempted: boolean;
}

interface Modul {
    _id: string;
    title: string;
    slug: string;
    overview: string;
    category: string;
    icon: string;
    progress: number;
    completedTopics: number;
    totalTopics: number;
    topics: Topik[];
    hasCompletedModulPostTest?: boolean; // Tambahkan properti ini
}

interface TestResult {
    score: number;
    correct: number;
    total: number;
    weakSubTopics?: {
        subMateriId: string;
        title: string;
        score: number;
    }[];
    scoreDetails?: {
        accuracy: number;
        time: number;
        stability: number;
        focus: number;
    };
    bestScore?: number; // Tambahkan properti opsional untuk skor terbaik
}

export default function ModulDetailPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [modul, setModul] = useState<Modul | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openTopicId, setOpenTopicId] = useState<string | null>(null);

    // --- State for Post-Test ---
    const [activeTest, setActiveTest] = useState<Topik | null>(null);
    const [testAnswers, setTestAnswers] = useState<{ [key: string]: string }>({});
    const [testIdx, setTestIdx] = useState(0);
    const [testStartTime, setTestStartTime] = useState(0);
    const [testTimeLeft, setTestTimeLeft] = useState(0);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answerChangesCount, setAnswerChangesCount] = useState(0); // Tetap gunakan nama ini untuk konsistensi, tapi ubah cara kerjanya
    const [changedQuestionIds, setChangedQuestionIds] = useState<Set<string>>(new Set()); // State baru untuk melacak ID unik
    const [tabExitCount, setTabExitCount] = useState(0);

    const { showAlert } = useAlert();
    const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const questionStartTimeRef = useRef<number>(0);
    const studyTimeTrackerRef = useRef<{ [topicId: string]: number }>({});

    // Hooks untuk modal post-test dipindahkan ke top-level
    const questionModalRef = useRef<HTMLDivElement>(null);
    const currentQuestionForModal = activeTest ? activeTest.questions[testIdx] : null;

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

    // --- Fetch User and Modul Data ---
    useEffect(() => {
        const userRaw = localStorage.getItem('user');
        if (userRaw) setUser(JSON.parse(userRaw));
    }, []);

    // [DEBUG] Menambahkan console.log untuk memeriksa status autentikasi di sisi client
    useEffect(() => {
        const userInStorage = localStorage.getItem('user');
        if (userInStorage) {
            console.log("[Auth Check] User data ditemukan di localStorage:", JSON.parse(userInStorage));
            console.log("[Auth Check] Request ke API akan dikirim dengan 'credentials: include'. Browser seharusnya menyertakan cookie token.");
        } else {
            console.warn("[Auth Check] User data TIDAK ditemukan di localStorage. Pengguna mungkin belum login atau data sudah dihapus.");
            // Anda bisa menambahkan logika redirect ke halaman login di sini jika perlu
            // window.location.href = '/login';
        }
    }, []);

    const fetchModulData = useCallback(async () => {
        if (!user || typeof slug !== 'string') return;
        setLoading(true);
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/user-view/${slug}`);
            if (!res.ok) throw new Error("Gagal memuat data modul.");
            const data = await res.json();

            // Fallback: Jika backend tidak mengirim `hasCompletedModulPostTest`, cek manual.
            if (data.hasCompletedModulPostTest === undefined) {
                try {
                    const postTestResultRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/latest-by-type/post-test-modul?modulId=${data._id}`); // Perbaikan di sini
                    if (postTestResultRes.ok) { // Jika respons OK (2xx)
                        const latestResult = await postTestResultRes.json();
                        data.hasCompletedModulPostTest = !!latestResult;
                    } else {
                        data.hasCompletedModulPostTest = false; // Anggap belum selesai jika ada error atau hasil tidak ditemukan (404)
                    }
                } catch (e) {
                    console.warn("Gagal memeriksa status post-test modul secara manual.");
                }
            }
            setModul(data);
        } catch (err) {
            if (err instanceof Error && err.message.includes("401")) {
                showAlert({
                    title: "Sesi Habis",
                    message: "Sesi Anda telah berakhir. Silakan login kembali.",
                    onConfirm: () => {
                        // Hapus data user dan redirect ke login
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        router.push('/login');
                    }
                });
            } else {
                setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
            }
        } finally {
            setLoading(false);
        }
    }, [user, slug]);

    useEffect(() => {
        if (user && slug) {
            fetchModulData();
        }
    }, [user, slug, fetchModulData]);

    // --- Auto-open and scroll to topic from URL hash ---
    const handleHashChange = useCallback(() => {
        if (!modul) return;
        const hash = window.location.hash;
        if (hash) {
            const hashId = hash.substring(1);

            // Coba cari sebagai sub-materi terlebih dahulu
            for (const topic of modul.topics) {
                if (topic.materi?.subMateris.some(sub => sub._id === hashId)) {
                    setOpenTopicId(topic._id);
                    setTimeout(() => {
                        document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 500); // Delay untuk animasi accordion
                    return;
                }
            }

            // Fallback: jika hash adalah ID topik
            if (modul.topics.some(t => t._id === hashId)) {
                setOpenTopicId(hashId);
            }
        }
    }, [modul]);

    useEffect(() => {
        handleHashChange(); // Jalankan saat modul pertama kali dimuat
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [handleHashChange]);

    // --- Study Time Tracking Logic ---
    const logStudyDuration = useCallback((topicId: string, startTime: number) => {
        const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
        // Kirim durasi ke backend jika lebih dari 10 detik (menghindari data tidak relevan)
        if (durationInSeconds > 10 && process.env.NEXT_PUBLIC_API_URL) {
            // Gunakan authFetch dengan keepalive: true
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/log-study-time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topikId: topicId,
                    durationInSeconds: durationInSeconds,
                }),
                keepalive: true, // Ini penting agar request tetap berjalan saat halaman ditutup
            }).catch(err => console.warn("Gagal mengirim log waktu belajar:", err));
        }
    }, []);

    useEffect(() => {
        // Cleanup function: akan berjalan saat komponen di-unmount (pengguna pindah halaman)
        const openTopicIdOnMount = openTopicId;
        const studyTimeTrackerOnMount = studyTimeTrackerRef.current;

        return () => {
            if (openTopicIdOnMount && studyTimeTrackerOnMount[openTopicIdOnMount]) {
                logStudyDuration(openTopicIdOnMount, studyTimeTrackerOnMount[openTopicIdOnMount]);
            }
        };
    }, [openTopicId, logStudyDuration]); // Menambahkan logStudyDuration sebagai dependency

    // --- Post-Test Progress Persistence Logic ---
    const persistProgress = useCallback(async () => {
        if (!user || !activeTest) return;
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testType: 'post-test-topik-progress', // Use a dedicated type for progress
                    answers: testAnswers,
                    currentIndex: testIdx,
                    modulId: modul?._id,
                    topikId: activeTest._id,
                    answerChangesCount: answerChangesCount,
                    changedQuestionIds: Array.from(changedQuestionIds),
                    tabExitCount: tabExitCount,
                }),
            });
        } catch (error) {
            console.warn("Gagal menyimpan progres post-test:", error);
        }
    }, [user, activeTest, testAnswers, testIdx, modul?._id, answerChangesCount, changedQuestionIds, tabExitCount]);

    useEffect(() => { // Efek untuk menyimpan progres secara otomatis
        if (!activeTest || isSubmitting) return;

        if (persistTimeoutRef.current) {
            clearTimeout(persistTimeoutRef.current);
        }

        persistTimeoutRef.current = setTimeout(() => {
            persistProgress();
        }, 1500); // Simpan setelah 1.5 detik tidak ada perubahan

        return () => {
            if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
        };
    }, [testAnswers, testIdx, activeTest, isSubmitting, persistProgress]);

    // --- Post-Test Actions ---
    const startTest = async (topik: Topik, retake: boolean = false) => {
        if (topik.questions.length === 0) {
            showAlert({
                title: 'Informasi',
                message: 'Belum ada soal post-test untuk topik ini.',
            });
            return;
        }

        setTestResult(null);
        setActiveTest(topik);

        // Jika tidak mengulang (retake=false) DAN topik sudah selesai, langsung tampilkan skor.
        if (!retake && (topik.isCompleted || topik.hasAttempted)) {
            await viewScore(topik);
            return;
        }

        // Jika ini adalah retake, atau tes pertama kali, atau belum selesai,
        // coba muat progress yang ada. Jika tidak, mulai dari awal.
        try {
            if (retake) {
                // Jika retake, selalu mulai dari awal
                setTestAnswers({});
                setTestIdx(0);
                setAnswerChangesCount(0); // Reset counter lama
                setChangedQuestionIds(new Set()); // Reset set baru
                setTabExitCount(0);
            } else {
                // Jika bukan retake, coba muat progress
                const progressRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/progress?testType=post-test-topik-progress&modulId=${modul?._id}&topikId=${topik._id}`);
                if (progressRes.ok) {
                    const progressData = await progressRes.json();
                    if (progressData && progressData.answers && Array.isArray(progressData.answers) && progressData.answers.length > 0) {
                        // Jika ada progress pengerjaan, muat progress tersebut
                        setTestAnswers(progressData.answers.reduce((acc: { [key: string]: string }, ans: { questionId: string, selectedOption: string }) => {
                            acc[ans.questionId] = ans.selectedOption;
                            return acc;
                        }, {}) || {});
                        setTestIdx(progressData.currentIndex || 0);
                        setAnswerChangesCount(progressData.answerChangesCount || 0);
                        setChangedQuestionIds(new Set(progressData.changedQuestionIds || [])); // Muat progress untuk Set
                        setTabExitCount(progressData.tabExitCount || 0);
                    } else {
                        // Jika tidak ada progress, reset ke awal
                        setTestAnswers({});
                        setTestIdx(0);
                        setAnswerChangesCount(0);
                        setChangedQuestionIds(new Set());
                        setTabExitCount(0);
                    }
                }
            }
        } catch (err) {
            console.warn('Gagal memuat progress post-test dari server', err);
            // Fallback jika API progress error, mulai dari awal
            setTestAnswers({});
            setTestIdx(0);
        }

        setTestStartTime(Date.now());
        questionStartTimeRef.current = Date.now(); // Mulai timer untuk soal pertama
    };

    const handleAnswerChange = (questionId: string, option: string) => {
        setTestAnswers(prev => {
            // Cek apakah sudah ada jawaban sebelumnya untuk pertanyaan ini
            // Jika ya, tambahkan ID soal ini ke dalam Set. Set akan otomatis menangani duplikat.
            if (prev[questionId] && prev[questionId] !== option) {
                setAnswerChangesCount(currentCount => currentCount + 1); // Tetap hitung total perubahan jika diperlukan untuk analisis lain
                setChangedQuestionIds(currentSet => new Set(currentSet).add(questionId));
            }
            return { ...prev, [questionId]: option };
        });
    };

    // --- Test Focus Tracking (Tab Exits) ---
    useEffect(() => {
        const handleVisibilityChange = () => document.visibilityState === 'hidden' && setTabExitCount(c => c + 1);
        if (activeTest && !testResult) document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeTest, testResult]);

    const handleTopicToggle = (topicId: string) => {
        const tracker = studyTimeTrackerRef.current;
        const now = Date.now();

        // Jika topik yang sama diklik lagi (untuk menutup)
        if (openTopicId === topicId) {
            const startTime = tracker[topicId];
            if (startTime) {
                logStudyDuration(topicId, startTime);
                delete tracker[topicId];
            }
            setOpenTopicId(null); // Tutup accordion
        } else {
            // Jika topik lain sedang terbuka, tutup dan catat waktunya
            if (openTopicId && tracker[openTopicId]) {
                logStudyDuration(openTopicId, tracker[openTopicId]);
                delete tracker[openTopicId];
            }
            // Buka topik baru dan mulai timer
            tracker[topicId] = now;
            setOpenTopicId(topicId);
        }
    };

    const viewScore = async (topik: Topik) => {
        setActiveTest(topik);
        setTestResult(null);
        try {
            const resultRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/latest-by-topic?modulId=${modul?._id}&topikId=${topik._id}`);
            if (resultRes.ok) {
                const latestResult = await resultRes.json();
                setTestResult(latestResult);
            } else {
                throw new Error('Gagal memuat hasil tes.');
            }
        } catch (err) {
            showAlert({
                title: 'Error',
                message: err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat skor.',
            });
            setActiveTest(null);
        }
    };

    const submitTest = useCallback(async () => {
        if (!user || !activeTest) return;
        setIsSubmitting(true);

        try {
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/submit-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testType: 'post-test-topik',
                    answers: testAnswers,
                    timeTaken: Math.round((Date.now() - testStartTime) / 1000),
                    modulId: modul?._id,
                    topikId: activeTest._id,
                    // Kirim jumlah soal unik yang diubah (changedQuestionIds.size) sebagai 'answerChanges'
                    answerChanges: changedQuestionIds.size,
                    tabExits: tabExitCount,
                }),
            });

            const resultData = await response.json();
            if (!response.ok) throw new Error(resultData.message || "Gagal mengirimkan jawaban.");

            const finalResult = resultData.data; // Backend mengembalikan { message, data: newResult }
            setTestResult(finalResult);

            // Buat notifikasi berdasarkan hasil tes topik
            const notifMessage = finalResult.score >= 70
                ? `Selamat! Anda lulus post-test "${activeTest.title}" dengan skor ${finalResult.score}.`
                : `Anda mendapatkan skor ${finalResult.score}% untuk post-test "${activeTest.title}". Coba lagi!`;
            createNotification(notifMessage, `/modul/${modul?.slug}#${activeTest._id}`);


            // Jika lulus, update state modul secara lokal agar topik berikutnya terbuka & progress bar terupdate
            if (finalResult.score >= 70) {
                setModul(prevModul => {
                    if (!prevModul) return null;

                    const updatedTopics = prevModul.topics.map(t => t._id === activeTest._id ? { ...t, isCompleted: true } : t);
                    const currentTopicIndex = updatedTopics.findIndex(t => t._id === activeTest._id);
                    const nextTopic = updatedTopics[currentTopicIndex + 1];

                    const newCompletedCount = updatedTopics.filter(t => t.isCompleted).length;
                    const newProgress = Math.round((newCompletedCount / updatedTopics.length) * 100);

                    // Buka topik selanjutnya secara otomatis
                    if (nextTopic) {
                        setOpenTopicId(nextTopic._id);
                    }

                    // Jika semua topik selesai, kirim notifikasi penyelesaian modul
                    if (newProgress === 100) {
                        createNotification(`Hebat! Anda telah menyelesaikan semua topik di modul "${prevModul.title}".`, `/modul/${prevModul.slug}`);
                    }

                    return {
                        ...prevModul,
                        topics: updatedTopics,
                        completedTopics: newCompletedCount,
                        progress: newProgress
                    };
                });
            } else {
                // Jika tidak lulus, pastikan accordion topik yang sama tetap terbuka setelah modal ditutup.
                setOpenTopicId(activeTest._id); // Jika tidak lulus, tetap buka topik yang sama
            }

            // Hapus progress dari DB setelah berhasil submit
            const deleteUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/results/progress?testType=post-test-topik-progress&modulId=${modul?._id}&topikId=${activeTest._id}`;
            authFetch(deleteUrl, {
                method: 'DELETE', // Menggunakan DELETE untuk menghapus progress
            });

        } catch (error) {
            showAlert({
                title: 'Error',
                message: `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [testAnswers, testStartTime, user, activeTest, modul, createNotification, changedQuestionIds, tabExitCount]);

    // --- Timer Effect for Test ---
    useEffect(() => {
        if (!activeTest || testResult) return;

        // Hitung total durasi dari semua soal di tes aktif
        const DURATION = activeTest.questions.reduce(
            (acc, q) => acc + (q.durationPerQuestion || 60), 0
        );
        const end = testStartTime + DURATION * 1000;

        const timerInterval = setInterval(() => {
            const left = Math.max(0, Math.round((end - Date.now()) / 1000));
            setTestTimeLeft(left);
            if (left === 0) {
                showAlert({
                    title: 'Waktu Habis',
                    message: 'Waktu pengerjaan telah berakhir. Jawaban Anda akan dikirim secara otomatis.',
                    onConfirm: submitTest,
                });
                submitTest();
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [activeTest, testStartTime, testResult, submitTest]);

    // useEffect untuk syntax highlighting di modal, sekarang di top-level
    useEffect(() => {
        if (questionModalRef.current && currentQuestionForModal) {
            // Temukan semua blok <pre><code> di dalam area pertanyaan dan terapkan highlight
            questionModalRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [activeTest, testIdx, currentQuestionForModal]); // Dependency lebih spesifik

    // --- Add Copy Button to Code Blocks ---
    useEffect(() => {
        // Tentukan elemen container: modal tes atau kartu topik
        const container = activeTest ? questionModalRef.current : (openTopicId ? document.getElementById(`topic-card-${openTopicId}`) : null);
        if (!container) return;

        const observers: ResizeObserver[] = []; // Simpan semua observer untuk di-disconnect

        const timeoutId = setTimeout(() => {
            // Cari 'pre' di dalam container yang sudah ditentukan
            const codeBlocks = container.querySelectorAll('pre');

            codeBlocks.forEach(preElement => {
                // Cek jika wrapper sudah ada untuk menghindari duplikasi
                if (preElement.parentElement?.classList.contains('code-block-wrapper')) return;

                // 1. Terapkan Syntax Highlighting
                const codeElement = preElement.querySelector('code');
                if (codeElement) {
                    hljs.highlightElement(codeElement as HTMLElement);
                }

                const copyButton = document.createElement('button');
                copyButton.title = 'Salin kode';
                copyButton.className = 'copy-button absolute top-2 right-2 p-2 bg-gray-700/50 dark:bg-gray-800/60 text-gray-300 rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 transition-all duration-200';

                const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                copyButton.innerHTML = copyIcon;

                copyButton.addEventListener('click', () => {
                    const codeToCopy = codeElement ? codeElement.innerText : '';

                    navigator.clipboard.writeText(codeToCopy).then(() => {
                        copyButton.innerHTML = checkIcon;
                        copyButton.classList.add('text-green-400');
                        setTimeout(() => {
                            copyButton.innerHTML = copyIcon;
                            copyButton.classList.remove('text-green-400');
                        }, 2000);
                    }).catch(err => {
                        console.error('Gagal menyalin kode:', err);
                    });
                });

                // 2. Buat wrapper baru dengan posisi relatif
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper relative'; // Hapus 'group' karena tidak lagi diperlukan untuk hover

                // 3. Tambahkan tombol salin ke dalam wrapper
                wrapper.appendChild(copyButton);

                // 4. Pindahkan <pre> ke dalam wrapper, setelah tombol
                preElement.parentNode?.insertBefore(wrapper, preElement);
                wrapper.appendChild(preElement);

                // 5. Logika untuk font responsif
                const observer = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        const pre = entry.target as HTMLElement;
                        // Jika konten lebih lebar dari kontainernya (ada scroll horizontal)
                        if (pre.scrollWidth > pre.clientWidth) {
                            pre.classList.add('code-overflow');
                        } else {
                            pre.classList.remove('code-overflow');
                        }
                    }
                });

                observer.observe(preElement);
                observers.push(observer);
            });
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            observers.forEach(observer => observer.disconnect());
            // Tidak perlu disconnect observer lagi
        };

    }, [openTopicId, activeTest, testIdx, currentQuestionForModal]); // Dependensi diperbarui



    // --- Render Logic ---
    if (loading) {
        return <div className="flex justify-center items-center min-h-screen"><p>Memuat data modul...</p></div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">Error: {error}</div>;
    }

    if (!modul) {
        return <div className="p-6 text-center">Modul tidak ditemukan.</div>;
    }

    // --- RENDER POST-TEST MODAL ---
    if (activeTest) {
        const currentQuestion = activeTest.questions[testIdx];
        const totalQuestions = activeTest.questions.length;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Post-test: {activeTest.title}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Modul: {modul.title}</p>
                        </div>
                        <div className="flex gap-3 items-center text-sm bg-slate-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                            <span>Soal: {totalQuestions}</span>
                            <span className="text-slate-300">|</span>
                            <span>Waktu: {`${String(Math.floor(testTimeLeft / 60)).padStart(2, '0')}:${String(testTimeLeft % 60).padStart(2, '0')}`}</span>
                        </div>
                    </header>

                    {/* Body */}
                    <main className="p-6 overflow-y-auto" ref={questionModalRef}>
                        {testResult ? (
                            <div className="text-center py-4">
                                {/* --- JUDUL --- */}
                                <motion.div
                                    initial={{ opacity: 0, y: -15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500 mb-2">
                                        Tes Selesai!
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                                        Berikut hasil penilaian kamu.
                                    </p>
                                </motion.div>

                                {/* --- KOTAK SKOR UTAMA --- */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="relative inline-block p-[3px] rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-2xl"
                                >
                                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Skor Kamu
                                        </p>
                                        <p className="text-7xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 text-transparent bg-clip-text my-3 drop-shadow-md">
                                            {Math.round(testResult.score)}%
                                        </p>
                                        <p className="text-base text-slate-700 dark:text-slate-300 font-semibold">
                                            {testResult.correct} / {activeTest.questions.length} Jawaban Benar
                                        </p>
                                    </div>
                                </motion.div>


                                {/* --- PESAN PENUTUP --- */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {testResult.score >= 70 ? (
                                        <p className="mt-6 flex text-center items-center justify-center text-green-600 dark:text-green-400 font-medium text-base">
                                            Keren! Kamu sudah menguasai topik ini, lanjut ke materi berikutnya yuk!
                                        </p>
                                    ) : (
                                        <p className="mt-6 flex  text-yellow-600 dark:text-yellow-400 font-medium text-sm sm:text-base">
                                            <AlertTriangle className="w-8 sm:w-4 h-8 sm:h-4" />
                                            Skor kamu belum mencapai 70%. Coba pelajari lagi bagian yang masih kurang ya!
                                        </p>

                                    )}
                                </motion.div>

                                {/* === DIVIDER "Analisis Performa Kamu" === */}
                                <div className="relative my-5 flex items-center">
                                    <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>

                                    <span className="mx-4 px-4 py-1 text-sm font-semibold 
            text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-800 
            rounded-full shadow-sm tracking-wide">
                                        Analisis Performa Kamu
                                    </span>

                                    <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
                                </div>

                                {/* --- RINCIAN SKOR --- */}
                                {testResult.scoreDetails && (
                                    <motion.div
                                        className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-5"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.6, staggerChildren: 0.1 }}
                                    >
                                        {[
                                            {
                                                label: "Ketepatan",
                                                val: testResult.scoreDetails.accuracy,
                                                desc: "Persentase jawaban benar dari total soal.",
                                                icon: <Target className="w-5 h-5 text-blue-600" />,
                                                gradient: "from-blue-500/10 to-blue-400/5 border-blue-300/30",
                                            },
                                            {
                                                label: "Kecepatan ",
                                                val: testResult.scoreDetails.time,
                                                desc: "Efisiensi waktu pengerjaan dibanding durasi total.",
                                                icon: <Clock3 className="w-5 h-5 text-emerald-600" />,
                                                gradient: "from-emerald-500/10 to-emerald-400/5 border-emerald-300/30",
                                            },
                                            {
                                                label: "Konsistensi ",
                                                val: testResult.scoreDetails.stability,
                                                desc: "Stabilitas dalam menjawab tanpa sering mengubah pilihan.",
                                                icon: <Activity className="w-5 h-5 text-indigo-600" />,
                                                gradient: "from-indigo-500/10 to-indigo-400/5 border-indigo-300/30",
                                            },
                                            {
                                                label: "Fokus Tes",
                                                val: testResult.scoreDetails.focus,
                                                desc: "Tingkat konsentrasi selama tes.",
                                                icon: <Eye className="w-5 h-5 text-amber-600" />,
                                                gradient: "from-amber-500/10 to-amber-400/5 border-amber-300/30",
                                            },
                                        ].map((item, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.04 }}
                                                transition={{ type: "spring", stiffness: 250 }}
                                                className={`relative bg-gradient-to-br ${item.gradient} rounded-2xl p-4 border shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm`}
                                            >
                                                <div className="flex items-center justify-center gap-3 mb-2">
                                                    {item.icon}
                                                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                        {item.label}
                                                    </h4>
                                                </div>
                                                <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                                    Skor :{" "}
                                                    <span className={`font-bold ${item.val >= 80 ? "text-emerald-600" : item.val >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                                                        {item.val}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                                                    {item.desc}
                                                </p>

                                            </motion.div>
                                        ))}
                                    </motion.div>

                                )}


                                {/* --- MATERI YANG PERLU DIPERKUAT --- */}
                                {testResult.weakSubTopics && testResult.weakSubTopics.length > 0 && (
                                    <motion.div
                                        className="mt-10 text-left bg-gradient-to-br from-yellow-50 via-amber-100 to-yellow-50 dark:from-yellow-900/30 dark:via-yellow-900/40 dark:to-yellow-800/20 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-800/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 text-lg flex items-center gap-2 mb-3">
                                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                                            Materi yang Perlu Kamu Perkuat
                                        </h4>

                                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-5 leading-relaxed">
                                            Yuk, pelajari kembali beberapa materi berikut agar pemahamanmu makin matang!
                                        </p>

                                        <ul className="space-y-3">
                                            {testResult.weakSubTopics.map((sub) => (
                                                <motion.li
                                                    key={sub.subMateriId}
                                                    whileHover={{ scale: 1.02 }}
                                                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-yellow-800 dark:text-yellow-200 font-medium bg-yellow-50 dark:bg-yellow-900/30 px-4 py-3 rounded-xl border border-yellow-200 dark:border-yellow-800/50 transition-all duration-300"
                                                >
                                                    <div className="flex items-center gap-2 mb-2 sm:mb-0">
                                                        <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                                        <span>{sub.title}</span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 px-2.5 py-0.5 rounded-lg shadow-sm">
                                                            Skor: {sub.score}%
                                                        </span>
                                                        <a
                                                            href={`/modul/${modul.slug}#${sub.subMateriId}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setActiveTest(null);
                                                                router.push(`/modul/${modul.slug}#${sub.subMateriId}`);
                                                            }}
                                                            className="flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-all duration-300"
                                                        >
                                                            Pelajari
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="w-3.5 h-3.5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 5l7 7-7 7"
                                                                />
                                                            </svg>
                                                        </a>
                                                    </div>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </div>





                        ) : currentQuestion ? (
                            // --- PENGERJAAN TEST ---
                            <div>
                                <div className="flex items-start font-semibold mb-4 text-base text-slate-800 dark:text-slate-200">
                                    <span className="mr-2">{testIdx + 1}.</span>
                                    <div
                                        className="flex-1 prose dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    {currentQuestion.options.map((option, oIndex) => (
                                        <label key={oIndex} className="flex items-start border border-slate-200 dark:border-gray-700 p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/50 has-[:checked]:border-blue-400 dark:has-[:checked]:border-blue-500">
                                            <input
                                                type="radio"
                                                className="mr-2.5 mt-0.5"
                                                name={`q${currentQuestion._id}`}
                                                value={option}
                                                checked={testAnswers[currentQuestion._id] === option}
                                                onChange={() => handleAnswerChange(currentQuestion._id, option)}
                                            />
                                            <span className="break-words" dangerouslySetInnerHTML={{ __html: option }} />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </main>

                    {/* Footer */}
                    <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                        {testResult ? (
                            // --- Tombol setelah hasil keluar ---
                            <div className="flex justify-between items-center">
                                <button onClick={() => startTest(activeTest, true)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                                    Ulangi Tes
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTest(null);
                                        fetchModulData(); // Panggil fetchModulData untuk sinkronisasi status
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Tutup
                                </button>
                            </div>
                        ) : (
                            // --- Tombol saat pengerjaan ---
                            <>
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => {
                                            persistProgress(); // Pastikan progress terakhir tersimpan sebelum menutup
                                            setActiveTest(null);
                                        }}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                                    >
                                        Tutup & Simpan Progress
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTestIdx(i => Math.max(0, i - 1))}
                                            disabled={testIdx === 0}
                                            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                                        >
                                            Sebelumnya
                                        </button>
                                        {testIdx < totalQuestions - 1 ? (
                                            <button
                                                onClick={() => setTestIdx(i => Math.min(totalQuestions - 1, i + 1))}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
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
                                                    onConfirm: submitTest,
                                                })}
                                                disabled={isSubmitting}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Mengirim...' : 'Kirim Jawaban'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="h-2 bg-indigo-100 dark:bg-gray-700 rounded-full overflow-hidden mt-3">
                                    <div className="h-full bg-blue-500" style={{ width: `${((testIdx + 1) / totalQuestions) * 100}%` }}></div>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pertanyaan {testIdx + 1} dari {totalQuestions}</div>
                            </>
                        )}
                    </footer>
                </div>
            </div>
        );
    }

    // --- RENDER MAIN PAGE ---
    return (
        <div className="max-w-full mx-auto px-1.5 sm:px-5 pb-5 pt-0">
            {/* 
              Menambahkan style global untuk menangani overflow pada code block di dalam .prose.
              Ini memastikan hanya code block yang bisa di-scroll horizontal, bukan seluruh kontainer soal.
            */}
            <style jsx global>{`
                html {
                    scroll-behavior: smooth;
                }
                .prose pre { white-space: pre; overflow-x: auto; }
            `}</style>
            {/* 
              Menambahkan style global untuk menangani font-size pada code block yang overflow.
              Kelas .code-overflow ditambahkan secara dinamis oleh ResizeObserver di dalam useEffect.
            */}

            {/* Breadcrumb */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
                    <li className="inline-flex items-center">
                        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                            <Home className="w-4 h-4 me-2.5" />
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>
                            <Link href="/modul" className="ms-1 text-sm font-medium hover:text-blue-600 md:ms-2 dark:hover:text-blue-400">Modul</Link>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>
                            <span className="ms-1 text-sm font-medium text-gray-800 dark:text-gray-200 md:ms-2">{modul.title}</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Header Modul */}
            <header className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-6 mt-6 shadow-md text-white flex flex-col items-start gap-2 mb-8 md:flex-row md:items-center md:gap-4">
                {/* Ikon untuk desktop (di kiri) */}
                <Image src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`} alt={modul.title} width={256} height={256} className="hidden md:block h-20 w-20 rounded-lg object-cover bg-white/20 p-1" />

                <div className="flex-1 text-left w-full"> {/* Wrapper untuk teks dan ikon mobile */}
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">{modul.category}</span>
                    <h1 className="text-3xl font-bold text-white mt-1 mb-2">{modul.title}</h1>

                    {/* Ikon untuk mobile (di bawah judul, di tengah) */}
                    <Image src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`} alt={modul.title} width={80} height={80} className="hidden h-20 w-20 rounded-lg object-cover bg-white/20 p-1 mb-4 mx-auto" />

                    <p className="text-sm text-white/90 mb-2">{modul.overview}</p>
                    <div className="w-full bg-white/30 rounded-full h-2.5">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${modul.progress}%` }}></div>
                    </div>
                    <p className="text-sm opacity-90 mt-2">{modul.completedTopics} dari {modul.totalTopics} topik selesai ({modul.progress}%)</p>
                </div>
            </header>

            {/* Daftar Topik */}
            <main>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Daftar Topik</h2>
                <div className="space-y-4">
                    {modul.topics.map((topik, index) => {
                        const prevTopic = index > 0 ? modul.topics[index - 1] : null;
                        const isLocked = prevTopic ? !prevTopic.isCompleted : false;
                        const isOpen = openTopicId === topik._id;

                        return (
                            <div key={topik._id} id={`topic-card-${topik._id}`} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300 ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                                <div className="p-5 flex justify-between items-center" onClick={() => !isLocked && handleTopicToggle(topik._id)}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg ${topik.isCompleted ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                            {topik.isCompleted ? <CheckCircle2 size={20} /> : isLocked ? <Lock size={18} /> : index + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white">{topik.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {topik.isCompleted ? 'Selesai' : isLocked ? 'Terkunci' : 'Siap dipelajari'}
                                            </p>
                                        </div>
                                    </div>
                                    <svg className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                                {/* Accordion Content */}
                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen && !isLocked ? 'max-h-[2000px]' : 'max-h-0'}`}>
                                    <TopicContent topik={topik} onStartTest={startTest} onViewScore={viewScore} hasAttempted={topik.isCompleted || topik.hasAttempted} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Kartu Post-Test Akhir Modul */}
            {(() => {
                const isPostTestLocked = modul.progress < 100;
                const hasCompletedModulPostTest = modul.hasCompletedModulPostTest;
                return ( // Kartu ini akan muncul jika `hasModulPostTest` bernilai true
                    <section className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mt-5 transition-all border border-slate-200 dark:border-slate-700 ${isPostTestLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:p-2">
                            {/* Konten Teks */}
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                    Post Test Akhir
                                </h2>
                                {isPostTestLocked ? (
                                    <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mb-6">
                                        Selesaikan semua topik di modul ini untuk membuka post-test akhir.
                                    </p>
                                ) : (
                                    <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-6">
                                        {hasCompletedModulPostTest
                                            ? "Kerja bagus! Anda telah menyelesaikan post-test untuk modul ini. Anda dapat melihat kembali hasil Anda."
                                            : "Selamat! Anda telah menyelesaikan semua topik. Uji pemahaman akhir Anda untuk menyelesaikan modul ini."}
                                    </p>
                                )}

                                <Link
                                    href={!isPostTestLocked ? `/modul/${slug}/post-test` : '#'}
                                    passHref
                                    className={`inline-block px-6 py-3 font-semibold rounded-xl shadow-md transition-all ${isPostTestLocked
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                        : 'bg-yellow-400 hover:bg-yellow-300 text-black transform hover:scale-105'
                                        }`}
                                    aria-disabled={isPostTestLocked}
                                    onClick={(e) => {
                                        if (isPostTestLocked) e.preventDefault()
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {isPostTestLocked ? <Lock size={16} /> : hasCompletedModulPostTest ? <Award size={16} /> : <Rocket size={16} />}
                                        <span>{isPostTestLocked ? 'Terkunci' : (hasCompletedModulPostTest ? 'Lihat Hasil' : 'Mulai Post Test')}</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Gambar (akan muncul di atas pada mobile, di kanan pada desktop) */}
                            <div className="flex w-full md:w-1/3 justify-center items-center mt-4 md:mt-0 order-first md:order-last">
                                <Image src={hasCompletedModulPostTest ? "/post-test-akhir.png" : "/post-test.png"} alt="Post Test" width={256} height={256} className="w-48 h-48 md:w-60 md:h-60 object-contain" unoptimized />
                            </div>
                        </div>
                    </section>
                );
            })()}
        </div>
    );
}
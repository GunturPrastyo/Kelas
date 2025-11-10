"use client";

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
// 1. Import highlight.js dan tema CSS-nya
import hljs from 'highlight.js';
// Impor tema terang sebagai default
import 'highlight.js/styles/github.css';
// Impor tema gelap, yang akan kita aktifkan hanya pada dark mode
import 'highlight.js/styles/github-dark.css';
import { authFetch } from '@/lib/authFetch'; // <-- Import helper baru
import { useAlert } from '@/context/AlertContext';

import TopicContent from '@/components/TopicContent';
import { Home, CheckCircle2, Lock, Rocket, Award } from 'lucide-react';

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
    content: string;
    youtube?: string;
}

interface Topik {
    _id: string;
    title: string;
    slug: string;
    materi?: Materi | null;
    questions: Question[];
    isCompleted: boolean;
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
    // tambahkan properti lain jika ada
}

export default function ModulDetailPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

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

    const { showAlert } = useAlert();
    const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
                    const postTestResultRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/latest-by-type/post-test-modul?modulId=${data._id}`);
                    if (postTestResultRes.ok) {
                        const latestResult = await postTestResultRes.json();
                        data.hasCompletedModulPostTest = !!latestResult; // Set true jika ada hasil, false jika tidak
                    }
                } catch (e) {
                    console.warn("Gagal memeriksa status post-test modul secara manual.");
                }
            }
            setModul(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
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
    useEffect(() => {
        if (modul && window.location.hash) {
            const topicIdFromHash = window.location.hash.substring(1);
            const topicExists = modul.topics.some(t => t._id === topicIdFromHash);

            if (topicExists) {
                setOpenTopicId(topicIdFromHash);
                setTimeout(() => {
                    document.getElementById(`topic-card-${topicIdFromHash}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300); // Delay to allow accordion to open
            }
        }
    }, [modul]);

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
                }),
            });
        } catch (error) {
            console.warn("Gagal menyimpan progres post-test:", error);
        }
    }, [user, activeTest, testAnswers, testIdx, modul?._id]);

    useEffect(() => {
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
        if (!retake && topik.isCompleted) {
            await viewScore(topik);
            return;
        }

        // Jika ini adalah retake, atau tes pertama kali, reset state dan mulai dari awal.
        try {
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
                } else {
                    // Jika tidak ada progress, reset ke awal
                    setTestAnswers({});
                    setTestIdx(0);
                }
            } else {
                // Jika tidak ada progress (404) atau error lain, mulai dari awal
                setTestAnswers({});
                setTestIdx(0);
            }
        } catch (err) {
            console.warn('Gagal memuat progress post-test dari server', err);
            // Fallback jika API progress error, mulai dari awal
            setTestAnswers({});
            setTestIdx(0);
        }

        setTestStartTime(Date.now());
    };

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
                }),
            });

            const resultData = await response.json();
            if (!response.ok) throw new Error(resultData.message || "Gagal mengirimkan jawaban.");

            const finalResult = resultData.data; // Backend mengembalikan { message, data: newResult }
            setTestResult(finalResult);

            // Buat notifikasi berdasarkan hasil tes topik
            const notifMessage = finalResult.score >= 80
                ? `Selamat! Anda lulus post-test "${activeTest.title}" dengan skor ${finalResult.score}%.`
                : `Anda mendapatkan skor ${finalResult.score}% untuk post-test "${activeTest.title}". Coba lagi!`;
            createNotification(notifMessage, `/modul/${modul?.slug}#${activeTest._id}`);

            // Tandai topik sebagai selesai di backend jika lulus
            if (finalResult.score >= 80) {
                authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/complete-topic`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topikId: activeTest._id,
                    }),
                }).catch(err => console.warn("Gagal menandai topik selesai di backend:", err));
            }


            // Jika lulus, update state modul secara lokal agar topik berikutnya terbuka & progress bar terupdate
            if (finalResult.score >= 80) {
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
    }, [testAnswers, testStartTime, user, activeTest, modul, createNotification]);

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

        const observers: ResizeObserver[] = [];

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
                    <main className="p-6 overflow-y-auto" ref={questionModalRef}> {/* Tambahkan ref di sini */}
                        {testResult ? (
                            // --- HASIL TEST ---
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Tes Selesai!</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Berikut adalah hasilmu.</p>
                                <div className="bg-slate-50 dark:bg-gray-700/50 p-6 rounded-lg inline-block">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Skor Kamu</p>
                                    <p className="text-5xl font-bold text-blue-600 dark:text-blue-400 my-2">{testResult.score}%</p>
                                    <p className="text-base text-slate-700 dark:text-slate-300">{testResult.correct} / {testResult.total} Jawaban Benar</p>
                                </div>
                                {testResult.score >= 80 ? (
                                    <p className="mt-4 text-green-600 dark:text-green-400">Selamat! Kamu telah menguasai topik ini. Lanjutkan ke topik berikutnya!</p>
                                ) : (
                                    <p className="mt-4 text-yellow-600 dark:text-yellow-500">Skor kamu belum mencapai 80%. Coba pelajari lagi materinya dan ulangi tes.</p>
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
                                                onChange={() => setTestAnswers(prev => ({ ...prev, [currentQuestion._id]: option }))}
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
                            <div className="flex justify-end gap-3">
                                {testResult.score < 80 && (
                                    <button onClick={() => startTest(activeTest, true)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                                        Ulangi Tes
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setActiveTest(null);
                                        // Tidak perlu fetch ulang, state sudah diupdate secara lokal di submitTest
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
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
        <div className="max-w-7xl mx-auto px-1.5 sm:px-5 pb-5 pt-0">
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
                <Image src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`} alt={modul.title} width={80} height={80} className="hidden md:block h-20 w-20 rounded-lg object-cover bg-white/20 p-1" />

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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${topik.isCompleted ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
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
                                    <TopicContent topik={topik} onStartTest={startTest} onViewScore={viewScore} />
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
                    <section className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mt-12 transition-all ${isPostTestLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
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
                                <Image src={hasCompletedModulPostTest ? "/post-test-akhir.png" : "/post-test.png"} alt="Post Test" width={240} height={240} className="w-48 h-48 md:w-60 md:h-60 object-contain" unoptimized />
                            </div>
                        </div>
                    </section>
                );
            })()}
        </div>
    );
}

const globalStyles = `
  @media (max-width: 768px) {
    pre.code-overflow code {
      font-size: 0.75rem; /* 12px */
    }
  }
`;

if (typeof window !== 'undefined') { const styleSheet = document.createElement("style"); styleSheet.type = "text/css"; styleSheet.innerText = globalStyles; document.head.appendChild(styleSheet); }
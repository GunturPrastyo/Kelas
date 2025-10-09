"use client"

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Contoh bank soal — ubah sesuai kebutuhan
const QUESTIONS = [
    { id: 1, q: "Apa output dari kode berikut?", code: "console.log(typeof 'Hello');", choices: ["'string'", "'object'", "'text'", "'undefined'"], answer: 0 },
    { id: 2, q: "Manakah yang akan menghasilkan `true`?", code: null, choices: ["`'5' == 5`", "`'5' === 5`", "`'5' != 5`", "Semua salah"], answer: 0 },
    { id: 3, q: "Apa isi dari variabel `result` setelah kode ini dijalankan?", code: "const arr = [10, 20, 30];\nconst result = arr[1];", choices: ["10", "20", "30", "undefined"], answer: 1 },
    { id: 4, q: "Metode array mana yang digunakan untuk menambahkan elemen baru di akhir array?", code: null, choices: ["`pop()`", "`shift()`", "`push()`", "`unshift()`"], answer: 2 },
    { id: 5, q: "Perhatikan kode berikut. Apa output terakhir yang akan muncul di konsol?", code: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}", choices: ["0", "1", "2", "3"], answer: 2 },
    { id: 6, q: "Bagaimana cara yang benar untuk mengubah teks di dalam elemen `<p id='demo'>Hello</p>` menjadi 'Hi'?", code: null, choices: ["`document.getElementById('demo').value = 'Hi';`", "`document.getElementById('demo').innerHTML = 'Hi';`", "`document.querySelector('p').text = 'Hi';`", "`document.p.innerHTML = 'Hi';`"], answer: 1 },
    { id: 7, q: "Apa output dari kode berikut?", code: "console.log(Boolean(0));", choices: ["true", "false", "0", "null"], answer: 1 },
    { id: 8, q: "Manakah sintaks *arrow function* yang valid?", code: null, choices: ["`const myFunc = () => 'Hello';`", "`const myFunc = => 'Hello';`", "`const myFunc = function() => 'Hello';`", "`const myFunc() => 'Hello';`"], answer: 0 },
    { id: 9, q: "Apa yang akan terjadi jika Anda mencoba mengubah nilai variabel yang dideklarasikan dengan `const`?", code: "const PI = 3.14;\nPI = 3.14159;", choices: ["Nilai akan berubah", "Akan muncul pesan warning", "Akan terjadi error (TypeError)", "Tidak terjadi apa-apa"], answer: 2 },
    { id: 10, q: "Apa output dari kode berikut?", code: "console.log(1 + '2' + 3);", choices: ["6", "'123'", "'33'", "Error"], answer: 1 }
];

const DURATION = 10 * 60; // 10 menit dalam detik

function escapeHtml(s: string) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function PreTestPage() {
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [idx, setIdx] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [timeLeft, setTimeLeft] = useState(DURATION);
    const [result, setResult] = useState<any>(null);

    const total = QUESTIONS.length;

    const grade = useCallback(() => {
        let correct = 0;
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        QUESTIONS.forEach(q => {
            if (answers[q.id] === q.answer) correct++;
        });
        const score = Math.round((correct / total) * 100);
        const record = { score, correct, total, timeTaken, timestamp: new Date().toISOString() };
        localStorage.setItem('pretest_result', JSON.stringify(record));
        setResult(record);
    }, [answers, startTime, total]);

    useEffect(() => {
        // Cek dulu apakah sudah ada hasil akhir yang tersimpan
        const resultRaw = localStorage.getItem('pretest_result');
        if (resultRaw) {
            try {
                const parsedResult = JSON.parse(resultRaw);
                setResult(parsedResult);
                // Jika sudah ada hasil, kita tidak perlu memuat progress soal atau memulai timer baru.
                return;
            } catch (e) {
                console.warn('Gagal memuat hasil pre-test dari localStorage', e);
                // Hapus data yang rusak jika ada
                localStorage.removeItem('pretest_result');
            }
        }

        // Jika tidak ada hasil akhir, baru kita coba muat progress pengerjaan yang belum selesai
        const progressRaw = localStorage.getItem('pretest_state');
        if (progressRaw) {
            try {
                const parsedProgress = JSON.parse(progressRaw);
                setAnswers(parsedProgress.answers || {});
                setIdx(parsedProgress.idx || 0);
            } catch (e) {
                console.warn('Gagal memuat progress', e);
            }
        }
        // Mulai timer hanya jika kita memulai tes baru (bukan melihat hasil)
        if (!resultRaw) setStartTime(Date.now());
    }, []);

    useEffect(() => {
        // Jangan jalankan timer jika hasil sudah ditampilkan
        if (result) return;

        const end = startTime + DURATION * 1000;
        const timerInterval = setInterval(() => {
            const left = Math.max(0, Math.round((end - Date.now()) / 1000));
            setTimeLeft(left);
            if (left === 0) {
                alert('Waktu habis — jawaban akan dikirim otomatis.');
                grade();
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [startTime, grade, result]);

    const persist = () => {
        const snapshot = { answers, idx, timestamp: new Date().toISOString() };
        localStorage.setItem('pretest_state', JSON.stringify(snapshot));
        alert('Progress tersimpan secara lokal.');
    };

    const handleRetake = () => {
        if (confirm('Mulai ulang pre-test? Semua jawaban lokal akan dihapus.')) {
            localStorage.removeItem('pretest_state');
            localStorage.removeItem('pretest_result');
            window.location.reload();
        }
    };

    const currentQuestion = QUESTIONS[idx];

    if (result) {
        let levelBadge = '', recBody = '', badgeClasses = '', profileDesc = '';
        const avgTimePerQuestion = result.timeTaken / total;

        if (result.score >= 80) {
            levelBadge = 'Level: Lanjut';
            badgeClasses = 'bg-green-100 text-green-800';
            profileDesc = avgTimePerQuestion <= 20 ? 'Profil: Cepat & Tepat. Kamu siap ke materi tingkat lanjut dengan kecepatan tinggi.' : 'Profil: Teliti & Paham. Pemahaman bagus, mari latih efisiensi.';
            recBody = `<div class="flex flex-col gap-2">
                <a href="#" class="flex items-center gap-3 border border-slate-200 dark:border-gray-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                  <img src="https://img.icons8.com/fluency/48/cursor.png" alt="Event Handling" class="w-8 h-8 rounded">
                  <div><p class="font-semibold text-sm text-slate-800 dark:text-slate-200">Event Handling</p><p class="text-xs text-slate-500 dark:text-slate-400">Materi lanjut</p></div>
                </a>
                <a href="#" class="flex items-center gap-3 border border-slate-200 dark:border-gray-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                  <img src="https://img.icons8.com/fluency/48/cloud-sync.png" alt="Asynchronous JS" class="w-8 h-8 rounded">
                  <div><p class="font-semibold text-sm text-slate-800 dark:text-slate-200">Asynchronous JS</p><p class="text-xs text-slate-500 dark:text-slate-400">Materi lanjut</p></div>
                </a>
            </div>`;
        } else if (result.score >= 50) {
            levelBadge = 'Level: Menengah';
            badgeClasses = 'bg-blue-100 text-blue-800';
            profileDesc = avgTimePerQuestion < 15 ? 'Profil: Grasp Cepat. Kamu cepat memahami, tapi hati-hati dengan kesalahan konsep.' : 'Profil: Stabil. Waktu dan hasil seimbang, perkuat konsep inti.';
            recBody = `<div class="flex flex-col gap-2">
                <a href="#" class="flex items-center gap-3 border border-slate-200 dark:border-gray-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                  <img src="https://img.icons8.com/fluency/48/source-code.png" alt="JavaScript Lanjutan" class="w-8 h-8 rounded">
                  <div><p class="font-semibold text-sm text-slate-800 dark:text-slate-200">JavaScript Lanjutan</p><p class="text-xs text-slate-500 dark:text-slate-400">Materi menengah</p></div>
                </a>
                <a href="#" class="flex items-center gap-3 border border-slate-200 dark:border-gray-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                  <img src="/dom.png" alt="Manipulasi DOM" class="w-8 h-8 rounded">
                  <div><p class="font-semibold text-sm text-slate-800 dark:text-slate-200">Manipulasi DOM</p><p class="text-xs text-slate-500 dark:text-slate-400">Materi menengah</p></div>
                </a>
            </div>`;
        } else {
            levelBadge = 'Level: Dasar';
            badgeClasses = 'bg-yellow-100 text-yellow-800';
            profileDesc = avgTimePerQuestion < 15 ? 'Profil: Terburu-buru. Sebaiknya ulangi dasar dengan pelan-pelan.' : 'Profil: Perlu Penguatan. Fokus dulu ke materi dasar.';
            recBody = `<div class="flex flex-col gap-2">
                <a href="#" class="flex items-center gap-3 border border-slate-200 dark:border-gray-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                  <img src="https://img.icons8.com/color/48/javascript.png" alt="JavaScript Dasar" class="w-8 h-8 rounded">
                  <div><p class="font-semibold text-sm text-slate-800 dark:text-slate-200">JavaScript Dasar</p><p class="text-xs text-slate-500 dark:text-slate-400">Materi fundamental</p></div>
                </a>
                <a href="#" class="flex items-center gap-3 border border-slate-200 dark:border-gray-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition">
                  <img src="https://img.icons8.com/fluency/48/rules.png" alt="Latihan Dasar" class="w-8 h-8 rounded">
                  <div><p class="font-semibold text-sm text-slate-800 dark:text-slate-200">Latihan Dasar</p><p class="text-xs text-slate-500 dark:text-slate-400">Materi fundamental</p></div>
                </a>
            </div>`;
        }

        return (
            <div className="max-w-5xl mx-auto p-4 sm:p-5 my-4 sm:my-8 font-sans">
                {/* Breadcrumb */}
                <nav className="flex mb-10" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
                        <li className="inline-flex items-center">
                            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                                <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                                </svg>
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 dark:text-slate-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                </svg>
                                <span className="ms-1 text-sm font-medium text-slate-500 dark:text-slate-400 md:ms-2">Hasil Pre-test</span>
                            </div>
                        </li>
                    </ol>
                </nav>
                <header className="flex items-center justify-between gap-2 font-poppins">
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
                            <p className="text-3xl font-bold text-blue-600">{result.score}%</p>
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
                            <div dangerouslySetInnerHTML={{ __html: recBody }}></div>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button onClick={handleRetake} className="bg-transparent text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-400/20 px-3.5 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">Ulangi Pre-test</button>
                        <Link href="/modul" className="bg-blue-500 text-white border-none px-3.5 py-2.5 rounded-lg cursor-pointer">Lihat Rekomendasi Modul</Link>
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
        <div className="max-w-5xl mx-auto p-4 sm:p-5 my-4 sm:my-8 font-sans">
            {/* Breadcrumb */}
            <nav className="flex mb-10" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
                    <li className="inline-flex items-center">
                        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                            <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                            </svg>
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 dark:text-slate-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span className="ms-1 text-sm font-medium text-slate-500 dark:text-slate-400 md:ms-2">Pre-test</span>
                        </div>
                    </li>
                </ol>
            </nav>

            <header className="flex items-center justify-between gap-2 font-poppins">
                <div className="flex items-center gap-2">
                    <Image src="/logo1.png" width={40} height={40} className="h-10 w-auto" alt="Logo" />
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">Pre-test</h1>
                </div>
                <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-sm bg-slate-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                    <span>Soal: <span>{total}</span></span>
                    <span className="text-slate-300">|</span>
                    <span >Waktu: <span>{`${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`}</span></span>
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
                <div id="questionArea">
                    {currentQuestion && (
                        <div className="py-6">
                            <div className="font-semibold mb-4 text-base text-slate-800 dark:text-slate-200">{idx + 1}. {currentQuestion.q}</div>
                            {currentQuestion.code && (
                                <pre className="bg-slate-100 dark:bg-gray-900 text-slate-800 dark:text-slate-300 p-3 rounded-lg overflow-x-auto text-sm mb-3">
                                    <code>{currentQuestion.code}</code>
                                </pre>
                            )}
                            <div className="flex flex-col gap-3">
                                {currentQuestion.choices.map((c, ci) => (
                                    <label key={ci} className="border border-slate-200 dark:border-gray-700 p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/50 has-[:checked]:border-blue-400 dark:has-[:checked]:border-blue-500 text-sm text-slate-700 dark:text-slate-300">
                                        <input
                                            type="radio"
                                            className="mr-2.5"
                                            name={`q${currentQuestion.id}`}
                                            value={ci}
                                            checked={answers[currentQuestion.id] === ci}
                                            onChange={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: ci }))}
                                        />
                                        <span className="break-words" dangerouslySetInnerHTML={{ __html: escapeHtml(c) }} />
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
                            className="flex-1 bg-white dark:bg-gray-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-gray-600 px-4 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-600"
                        >
                            Sebelumnya
                        </button>
                        {idx < total - 1 ? (
                            <button
                                id="nextBtn"
                                onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
                                disabled={idx === total - 1}
                                className="flex-1 bg-blue-600 text-white border-none px-4 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                            >
                                Berikutnya
                            </button>
                        ) : null}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                        <button
                            id="saveBtn"
                            onClick={persist}
                            className="flex-1 sm:flex-none bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-none px-4 py-2.5 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/80 transition"
                        >
                            Simpan
                        </button>
                        {idx === total - 1 ? (
                            <button
                                id="submitBtn"
                                onClick={() => { if (confirm('Kirim jawaban dan lihat hasil?')) { grade(); } }}
                                className="flex-1 sm:flex-none bg-green-600 text-white border-none px-4 py-2.5 rounded-lg cursor-pointer hover:bg-green-700 transition"
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
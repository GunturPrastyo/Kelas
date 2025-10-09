"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { initFlowbite } from 'flowbite';

export default function ModulDetailPage({ params }: { params: { slug: string } }) {
    const [unlockedAccordions, setUnlockedAccordions] = useState<string[]>(['accordion-flush-heading-1']);
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 3;

    useEffect(() => {
        // Inisialisasi Flowbite untuk accordion
        initFlowbite();
    }, []);

    const handleQuizAnswer = (isCorrect: boolean, nextAccordionId: string | null) => {
        if (isCorrect) {
            alert("✅ Jawaban Benar! Materi berikutnya terbuka.");
            if (nextAccordionId && !unlockedAccordions.includes(nextAccordionId)) {
                setUnlockedAccordions(prev => [...prev, nextAccordionId]);
                // Re-initialize flowbite to detect newly enabled accordions
                setTimeout(() => initFlowbite(), 0);
            }
        } else {
            alert("❌ Jawaban Salah, coba lagi.");
        }
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const isAccordionUnlocked = (id: string) => {
        return unlockedAccordions.includes(id);
    };

    return (
        <>
            {/* Breadcrumb */}
            <nav className="flex mb-5" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-gray-700 dark:text-gray-300">
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
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 dark:text-gray-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <Link href="/modul" className="ms-1 text-sm font-medium hover:text-blue-600 md:ms-2 dark:hover:text-blue-400">Modul</Link>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 dark:text-gray-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400 capitalize">{params.slug.replace(/-/g, ' ')}</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Info Kursus */}
            <section className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-sans">
                <div className="w-full space-y-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide">
                        Javascript Dasar
                    </h2>

                    {/* 📝 Deskripsi / Overview */}
                    <p className="text-sm text-blue-100 leading-relaxed">
                        Mempelajari variabel, tipe data, operator, dan struktur kontrol fundamental dalam JavaScript.
                    </p>

                    <p className="text-sm text-blue-100">3 dari 44 pelajaran selesai</p>

                    <div className="w-full bg-white/30 rounded-full h-3 mt-3 overflow-hidden">
                        <div
                            className="bg-yellow-400 h-3 rounded-full transition-all duration-500 ease-in-out"
                            style={{ width: '7%' }}
                        ></div>
                    </div>
                </div>

                <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl shadow-md hover:bg-yellow-300 hover:scale-105 transition-all duration-300">
                    <span className="text-lg">▶</span> Lanjutkan
                </button>
            </section>


            {/* Materi dengan Accordion */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4">📖 Materi Pembelajaran</h3>
                <div id="accordion-flush" data-accordion="collapse" data-active-classes="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" data-inactive-classes="text-gray-800 dark:text-gray-400">

                    {/* Variabel */}
                    <h2 id="accordion-flush-heading-1">
                        <button type="button" className="flex items-center justify-between w-full py-4 font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 gap-3" data-accordion-target="#accordion-flush-body-1" aria-expanded="false" aria-controls="accordion-flush-body-1">
                            <span>Variabel</span>
                            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                            </svg>
                        </button>
                    </h2>
                    <div id="accordion-flush-body-1" className="hidden" aria-labelledby="accordion-flush-heading-1">
                        <div className="py-3 border-b border-gray-200 dark:border-gray-700 space-y-6">
                            <div className="w-full flex justify-center">
                                <iframe width="560" height="315" src="https://www.youtube.com/embed/7xStNKTM3bE?si=CvxpPZ8u7UmBCIXG" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="rounded-lg shadow-md w-full md:w-[560px] h-64 md:h-[315px]"></iframe>
                            </div>
                            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                <p>Variabel dalam JavaScript digunakan untuk menyimpan data agar bisa dipanggil atau diproses ulang. JavaScript menyediakan tiga cara untuk mendeklarasikan variabel: <code>var</code>, <code>let</code>, dan <code>const</code>.</p>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100">1. var</h4>
                                <p>Keyword <code>var</code> digunakan sejak versi awal JavaScript. Namun, penggunaannya sekarang <b>tidak direkomendasikan</b> karena sifatnya yang <i>function-scoped</i> dan bisa menimbulkan bug.</p>
                                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded">
                                    <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                                        var name = "Budi";<br />
                                        console.log(name); // Output: Budi
                                    </pre>
                                </div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100">2. let</h4>
                                <p>Keyword <code>let</code> diperkenalkan di ES6 (2015). Sifatnya <i>block-scoped</i>, artinya hanya berlaku di dalam blok kode tertentu. Variabel dengan <code>let</code> bisa diubah nilainya.</p>
                                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded">
                                    <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                                        let age = 21;<br />
                                        age = 22;<br />
                                        console.log(age); // Output: 22
                                    </pre>
                                </div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100">3. const</h4>
                                <p>Keyword <code>const</code> juga <i>block-scoped</i> tetapi <b>nilainya tidak bisa diubah</b> setelah didefinisikan. Biasanya digunakan untuk data konstan atau fungsi.</p>
                                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded">
                                    <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                                        const pi = 3.14;<br />
                                        console.log(pi); // Output: 3.14<br />
                                        <br />
                                        pi = 3.14159; // ❌ Error: Assignment to constant variable
                                    </pre>
                                </div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100">💡 Catatan Penting:</h4>
                                <ul className="list-disc ml-6 space-y-1">
                                    <li>Gunakan <code>let</code> untuk variabel yang nilainya bisa berubah.</li>
                                    <li>Gunakan <code>const</code> untuk nilai tetap atau konstanta.</li>
                                    <li>Hindari <code>var</code> kecuali untuk kompatibilitas kode lama.</li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-4">🎯 Post Test Variabel</h4>
                                <div id="slider" className="relative">
                                    <div className={`slide ${currentSlide === 0 ? 'block' : 'hidden'}`}>
                                        <p className="text-sm mb-2">1. Keyword mana yang digunakan untuk membuat variabel <b>konstan</b>?</p>
                                        <div className="space-x-2">
                                            <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">var</button>
                                            <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">let</button>
                                            <button onClick={() => handleQuizAnswer(true, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">const</button>
                                        </div>
                                    </div>
                                    <div className={`slide ${currentSlide === 1 ? 'block' : 'hidden'}`}>
                                        <p className="text-sm mb-2">2. Apa output dari kode berikut?</p>
                                        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                                            let x = 5;<br />
                                            let y = "5";<br />
                                            console.log(x == y);
                                        </pre>
                                        <div className="space-x-2">
                                            <button onClick={() => handleQuizAnswer(true, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">true</button>
                                            <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">false</button>
                                            <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">error</button>
                                        </div>
                                    </div>
                                    <div className={`slide ${currentSlide === 2 ? 'block' : 'hidden'}`}>
                                        <p className="text-sm mb-2">3. Manakah yang <b>benar</b> untuk mendeklarasikan variabel?</p>
                                        <div className="space-y-2">
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">let myName = "Andi";</pre>
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">const 123name = "Budi";</pre>
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">var city-name = "Bandung";</pre>
                                        </div>
                                        <div className="space-x-2 mt-2">
                                            <button onClick={() => handleQuizAnswer(true, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">1</button>
                                            <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">2</button>
                                            <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-2')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">3</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <button id="prevBtn" onClick={prevSlide} className="px-3 py-1.5 text-sm sm:px-4 sm:py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500">⬅ Sebelumnya</button>
                                    <button id="nextBtn" onClick={nextSlide} className="px-3 py-1.5 text-sm sm:px-4 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Selanjutnya ➡</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operator */}
                    <h2 id="accordion-flush-heading-2">
                        <button type="button" disabled={!isAccordionUnlocked('accordion-flush-heading-2')} className={`flex items-center justify-between w-full py-4 font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 gap-3 ${!isAccordionUnlocked('accordion-flush-heading-2') ? 'opacity-50 cursor-not-allowed' : ''}`} data-accordion-target="#accordion-flush-body-2" aria-expanded="false" aria-controls="accordion-flush-body-2">
                            <span>Operator</span>
                            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                            </svg>
                        </button>
                    </h2>
                    <div id="accordion-flush-body-2" className="hidden" aria-labelledby="accordion-flush-heading-2">
                        <div className="py-3 border-b border-gray-200 dark:border-gray-700 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Cara mengirim dan mengembalikan nilai pada fungsi.</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">🎯 Post Test Operator</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Apa hasil dari fungsi berikut?</p>
                                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                                    function kali(a, b) {'{'}<br />
                                    {'  '}return a * b;<br />
                                    {'}'}<br />
                                    console.log(kali(3, 4));
                                </pre>
                                <div className="space-x-2 mt-2">
                                    <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-3')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">7</button>
                                    <button onClick={() => handleQuizAnswer(true, 'accordion-flush-heading-3')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">12</button>
                                    <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-3')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">34</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Percabangan */}
                    <h2 id="accordion-flush-heading-3">
                        <button type="button" disabled={!isAccordionUnlocked('accordion-flush-heading-3')} className={`flex items-center justify-between w-full py-4 font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 gap-3 ${!isAccordionUnlocked('accordion-flush-heading-3') ? 'opacity-50 cursor-not-allowed' : ''}`} data-accordion-target="#accordion-flush-body-3" aria-expanded="false" aria-controls="accordion-flush-body-3">
                            <span>Percabangan</span>
                            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                            </svg>
                        </button>
                    </h2>
                    <div id="accordion-flush-body-3" className="hidden" aria-labelledby="accordion-flush-heading-3">
                        <div className="py-3 border-b border-gray-200 dark:border-gray-700 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Membuat dan mengakses properti serta method dalam objek.</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">🎯 Post Test Percabangan</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Apa output dari kode berikut?</p>
                                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                                    const person = {'{'}nama: "Guntur", umur: 21{'}'};<br />
                                    console.log(person.nama);
                                </pre>
                                <div className="space-x-2 mt-2">
                                    <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-4')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">undefined</button>
                                    <button onClick={() => handleQuizAnswer(true, 'accordion-flush-heading-4')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">"Guntur"</button>
                                    <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-4')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">21</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Perulangan */}
                    <h2 id="accordion-flush-heading-4">
                        <button type="button" disabled={!isAccordionUnlocked('accordion-flush-heading-4')} className={`flex items-center justify-between w-full py-4 font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 gap-3 ${!isAccordionUnlocked('accordion-flush-heading-4') ? 'opacity-50 cursor-not-allowed' : ''}`} data-accordion-target="#accordion-flush-body-4" aria-expanded="false" aria-controls="accordion-flush-body-4">
                            <span>Perulangan</span>
                            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                            </svg>
                        </button>
                    </h2>
                    <div id="accordion-flush-body-4" className="hidden" aria-labelledby="accordion-flush-heading-4">
                        <div className="py-3 border-b border-gray-200 dark:border-gray-700 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Mengeksekusi blok kode berulang kali dengan `for` dan `while`.</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">🎯 Post Test Perulangan</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Berapa kali "Hello" akan dicetak?</p>
                                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                                    for (let i = 0; i &lt; 5; i++) {'{'}<br />
                                    {'  '}console.log("Hello");<br />
                                    {'}'}
                                </pre>
                                <div className="space-x-2 mt-2">
                                    <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-5')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">4</button>
                                    <button onClick={() => handleQuizAnswer(true, 'accordion-flush-heading-5')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">5</button>
                                    <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-5')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">6</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Array */}
                    <h2 id="accordion-flush-heading-5">
                        <button type="button" disabled={!isAccordionUnlocked('accordion-flush-heading-5')} className={`flex items-center justify-between w-full py-4 font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 gap-3 ${!isAccordionUnlocked('accordion-flush-heading-5') ? 'opacity-50 cursor-not-allowed' : ''}`} data-accordion-target="#accordion-flush-body-5" aria-expanded="false" aria-controls="accordion-flush-body-5">
                            <span>Array</span>
                            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                            </svg>
                        </button>
                    </h2>
                    <div id="accordion-flush-body-5" className="hidden" aria-labelledby="accordion-flush-heading-5">
                        <div className="py-3 border-b border-gray-200 dark:border-gray-700 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Mendefinisikan blok kode yang dapat digunakan kembali.</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">🎯 Post Test Array</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Manakah sintaks arrow function yang valid?</p>
                                <div className="space-x-2 mt-2">
                                    <button onClick={() => handleQuizAnswer(true, 'accordion-flush-heading-6')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">const a = () =&gt; 1;</button>
                                    <button onClick={() => handleQuizAnswer(false, 'accordion-flush-heading-6')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">function a =&gt; 1;</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fungsi */}
                    <h2 id="accordion-flush-heading-6">
                        <button type="button" disabled={!isAccordionUnlocked('accordion-flush-heading-6')} className={`flex items-center justify-between w-full py-4 font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 gap-3 ${!isAccordionUnlocked('accordion-flush-heading-6') ? 'opacity-50 cursor-not-allowed' : ''}`} data-accordion-target="#accordion-flush-body-6" aria-expanded="false" aria-controls="accordion-flush-body-6">
                            <span>Fungsi</span>
                            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                            </svg>
                        </button>
                    </h2>
                    <div id="accordion-flush-body-6" className="hidden" aria-labelledby="accordion-flush-heading-6">
                        <div className="py-3 border-b border-gray-200 dark:border-gray-700 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Mendefinisikan blok kode yang dapat digunakan kembali.</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">🎯 Post Test Fungsi</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Manakah sintaks arrow function yang valid?</p>
                                <div className="space-x-2 mt-2">
                                    <button onClick={() => handleQuizAnswer(true, null)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">const a = () =&gt; 1;</button>
                                    <button onClick={() => handleQuizAnswer(false, null)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">function a =&gt; 1;</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Post Test Akhir */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="bg-white dark:bg-gray-800 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6 lg:p-2">
                    <div className="flex-1 text-center md:text-left w-full md:w-4/5">
                        <h2 className="text-xl lg:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Post Test Akhir
                        </h2>
                        <div className="sm:hidden w-full flex justify-center mb-4">
                            <Image src="/post-test.png" alt="Post Test" width={160} height={160} className="object-contain" />
                        </div>
                        <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-6">
                            Uji pemahamanmu setelah menyelesaikan seluruh materi.
                            Selesaikan post-test untuk melanjutkan ke modul berikutnya.
                        </p>
                        <button className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded-xl shadow-md transition">
                            🚀 Mulai Post Test
                        </button>
                    </div>
                    <div className="hidden sm:flex w-full md:w-1/3 justify-center">
                        <Image src="/post-test.png" alt="Post Test" width={240} height={240} className="object-contain" />
                    </div>
                </div>
            </section>
        </>
    );
}
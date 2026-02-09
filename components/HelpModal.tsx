"use client";

import { useState, Fragment } from 'react';
import { X, ChevronDown, HelpCircle, Wrench } from 'lucide-react';

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onClick: () => void;
}

const AccordionItem = ({ title, children, isOpen, onClick }: AccordionItemProps) => {
    return (
        <div className={`border rounded-xl mb-3 overflow-hidden transition-all duration-300 ${
            isOpen 
                ? 'bg-white dark:bg-gray-800 border-slate-300 dark:border-slate-600 shadow-sm' 
                : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}>
            <button
                onClick={onClick}
                className={`w-full flex justify-between items-center text-left p-4 group transition-colors ${isOpen ? 'bg-slate-50/50 dark:bg-slate-800/50' : ''}`}
            >
                <span className={`font-medium text-sm sm:text-base transition-colors ${
                    isOpen ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100'
                }`}>
                    {title}
                </span>
                <div className={`p-1 rounded-full transition-all duration-300 flex-shrink-0 ml-3 ${
                    isOpen 
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rotate-180' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 group-hover:text-slate-600'
                }`}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 px-4 pb-5 pt-2 leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

const helpData = {
    pusatBantuan: {
        title: "Pusat Bantuan",
        icon: HelpCircle,
        categories: [
            {
                title: "Panduan Belajar",
                items: [
                    { question: "Bagaimana alur belajar yang disarankan?", answer: "<p>Mulailah dengan mengerjakan <strong>Tes Awal</strong> untuk mengetahui level kemampuan Anda. Sistem akan merekomendasikan modul yang sesuai (Dasar, Menengah, atau Lanjut). Ikuti modul secara berurutan dan kerjakan kuis di setiap topik.</p>" },
                    { question: "Cara memulai modul pembelajaran", answer: "<p>Buka halaman <strong>Modul</strong>. Modul yang terbuka ditandai dengan status 'Mulai' atau 'Berjalan'. Klik tombol pada kartu modul untuk masuk ke materi.</p>" },
                    { question: "Menggunakan fitur Live Code (Playground)", answer: "<p>Di setiap halaman modul, terdapat tombol melayang <strong>Live Code</strong> di pojok kanan bawah. Gunakan fitur ini untuk mencoba menulis kode HTML, CSS, dan JavaScript secara langsung dan melihat hasilnya secara real-time.</p>" },
                    { question: "Cara mengerjakan Uji Pemahaman", answer: "<p>Setiap topik memiliki tes kecil (Uji Pemahaman Per-Topik). Setelah menyelesaikan semua topik dalam satu modul, Anda wajib mengerjakan <strong>Uji Pemahaman Akhir Modul</strong> untuk menuntaskan modul tersebut.</p>" },
                ]
            },
            {
                title: "Fitur & Analitik",
                items: [
                    { question: "Memahami halaman Analitik Belajar", answer: "<p>Halaman <strong>Analitik</strong> menampilkan grafik perkembangan belajar Anda, perbandingan skor dengan rata-rata kelas, serta rekomendasi topik yang perlu diperbaiki berdasarkan hasil tes Anda.</p>" },
                    { question: "Apa itu Peta Kompetensi?", answer: "<p>Peta Kompetensi di halaman Profil menunjukkan seberapa jauh Anda menguasai indikator materi (misalnya: Pemahaman Sintaks, Logika Pemrograman). Grafik radar membantu Anda melihat keseimbangan kemampuan Anda.</p>" },
                    { question: "Cara mendapatkan sertifikat", answer: "<p>Sertifikat kelulusan akan terbuka otomatis di halaman <strong>Profil</strong> setelah Anda menyelesaikan 100% progres belajar (semua modul dan tes selesai).</p>" },
                ]
            },
            {
                title: "Akun & Profil",
                items: [
                    { question: "Mengubah foto profil dan nama", answer: "<p>Buka menu dropdown di pojok kanan atas, pilih <strong>Profil Saya</strong>. Di sana Anda dapat mengunggah foto baru dan mengubah nama tampilan.</p>" },
                    { question: "Mengubah password", answer: "<p>Masuk ke halaman <strong>Profil Saya</strong>, lalu pilih tab <strong>Ubah Password</strong>. Masukkan password lama dan password baru Anda.</p>" },
                ]
            }
        ]
    },
    bantuanTeknis: {
        title: "Bantuan Teknis & Masalah",
        icon: Wrench,
        categories: [
            {
                title: "Kendala Akses",
                items: [
                    { question: "Saya lupa password akun", answer: "<p>Di halaman Login, klik tautan <strong>Lupa Password?</strong>. Masukkan email yang terdaftar, dan kami akan mengirimkan link untuk mengatur ulang kata sandi Anda.</p>" },
                    { question: "Tidak bisa membuka modul (Terkunci)", answer: "<p>Modul terkunci karena Anda belum menyelesaikan modul prasyarat atau belum mengerjakan Tes Awal. Pastikan Anda mengikuti alur belajar yang direkomendasikan.</p>" },
                    { question: "Email verifikasi tidak masuk", answer: "<p>Cek folder <strong>Spam</strong> atau <strong>Junk</strong> di email Anda. Jika masih tidak ada, coba kirim ulang verifikasi atau hubungi admin.</p>" },
                ]
            },
            {
                title: "Masalah Sistem",
                items: [
                    { question: "Halaman tidak memuat sempurna", answer: "<p>Cobalah untuk memuat ulang halaman (Refresh/F5). Jika masalah berlanjut, bersihkan cache browser Anda atau coba gunakan browser lain (Chrome/Edge/Firefox).</p>" },
                    { question: "Gambar atau video materi tidak muncul", answer: "<p>Pastikan koneksi internet Anda stabil. Jika menggunakan jaringan kantor/sekolah, pastikan tidak ada pembatasan akses (firewall) ke layanan seperti YouTube atau server gambar kami.</p>" },
                ]
            }
        ]
    }
};

type ActiveTab = keyof typeof helpData;

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAccordionClick = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    return (
        <div className="fixed inset-0 md:top-16  backdrop-blur-3xl bg-transparent z-[1000] flex justify-center items-start p-4" onClick={onClose}>
            <div
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col mt-8 md:mt-0 animate-in fade-in-0 zoom-in-95 border border-gray-200 dark:border-gray-700 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Pusat Bantuan</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Temukan jawaban untuk pertanyaanmu</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto">
                    {Object.values(helpData).map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-8 last:mb-0">
                            <div className="flex items-center gap-3 mb-4 px-1">
                                <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                    <section.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                    {section.title}
                                </h3>
                            </div>
                            {section.categories.map((category, catIndex) => (
                                <div key={catIndex} className="mb-6 last:mb-0">
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider px-1 ml-1">{category.title}</h4>
                                    <div className="space-y-1">
                                        {category.items.map((item, itemIndex) => {
                                        const accordionId = `${sectionIndex}-${catIndex}-${itemIndex}`;
                                        return (
                                            <AccordionItem
                                                key={accordionId}
                                                title={item.question}
                                                isOpen={openAccordion === accordionId}
                                                onClick={() => handleAccordionClick(accordionId)}
                                            >
                                                <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                                            </AccordionItem>
                                        );
                                    })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
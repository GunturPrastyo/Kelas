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
        <div className={`border rounded-xl mb-3 overflow-hidden transition-all duration-200 ${
            isOpen 
                ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 shadow-md ring-1 ring-blue-100 dark:ring-blue-900/30' 
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
        }`}>
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left p-4 group"
            >
                <span className={`font-medium text-sm sm:text-base transition-colors ${
                    isOpen ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`}>
                    {title}
                </span>
                <div className={`p-1 rounded-full transition-all duration-300 flex-shrink-0 ml-3 ${
                    isOpen 
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rotate-180' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500'
                }`}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 px-4 pb-5 pt-0 leading-relaxed border-t border-gray-100 dark:border-gray-700/50 mt-1">
                        <div className="pt-3">{children}</div>
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
                title: "Cara Menggunakan Platform",
                items: [
                    { question: "Cara login dan mengubah password", answer: "<p>Anda dapat login menggunakan email dan password yang telah didaftarkan. Untuk mengubah password, buka menu <strong>Profil Saya</strong> dari dropdown pengguna, lalu pilih tab 'Keamanan' untuk mengatur password baru.</p>" },
                    { question: "Cara memulai modul pembelajaran", answer: "<p>Kunjungi halaman <strong>Modul</strong>. Jika Anda sudah mengerjakan pre-test, modul yang direkomendasikan akan ditandai. Klik tombol 'Mulai Belajar' pada modul yang Anda inginkan.</p>" },
                    { question: "Cara melihat progres belajar", answer: "<p>Progres belajar secara keseluruhan dapat dilihat di <strong>Dashboard</strong>. Untuk analisis yang lebih mendalam, kunjungi halaman <strong>Analitik Belajar</strong>.</p>" },
                    { question: "Cara mendapatkan sertifikat", answer: "<p>Sertifikat akan otomatis terbit setelah Anda menyelesaikan semua modul dan post-test dalam satu jalur belajar (misalnya, semua modul Dasar). Sertifikat dapat diakses di halaman <strong>Sertifikat Saya</strong>.</p>" },
                    { question: "Cara mengakses rekomendasi materi terlemah", answer: "<p>Di halaman <strong>Dashboard</strong>, akan ada bagian 'Fokus Perbaikan' yang menampilkan topik-topik di mana Anda mendapatkan skor terendah. Anda bisa langsung mengklik topik tersebut untuk mempelajarinya kembali.</p>" },
                    { question: "Cara melihat riwayat belajar", answer: "<p>Riwayat aktivitas belajar Anda, termasuk modul yang diselesaikan dan skor tes, tercatat di halaman <strong>Analitik Belajar</strong>.</p>" },
                ]
            },
            {
                title: "Tanya Jawab Umum (FAQ)",
                items: [
                    { question: "Bagaimana jika saya lupa password?", answer: "<p>Pada halaman login, klik tautan 'Lupa Password?'. Masukkan email Anda, dan kami akan mengirimkan instruksi untuk mereset password Anda.</p>" },
                    { question: "Mengapa saya tidak bisa membuka modul tertentu?", answer: "<p>Modul bisa terkunci jika Anda belum menyelesaikan pre-test, atau jika level modul tersebut di atas level rekomendasi Anda (misalnya, mencoba membuka modul 'Lanjut' saat level Anda 'Dasar'). Selesaikan modul prasyarat terlebih dahulu.</p>" },
                    { question: "Bagaimana sistem menentukan rekomendasi jalur belajar?", answer: "<p>Rekomendasi ditentukan oleh hasil <strong>Pre-Test</strong> Anda. Sistem menganalisis jawaban Anda untuk mengukur pemahaman pada materi tingkat Dasar, Menengah, dan Lanjut, lalu menempatkan Anda di jalur yang paling sesuai.</p>" },
                    { question: "Apa syarat untuk mendapatkan sertifikat?", answer: "<p>Anda harus menyelesaikan 100% semua modul dan lulus semua post-test yang ada dalam satu jalur belajar yang ditentukan.</p>" },
                    { question: "Bagaimana cara menghubungi admin/guru?", answer: "<p>Untuk saat ini, fitur komunikasi langsung belum tersedia. Silakan hubungi administrator melalui kontak yang disediakan di luar platform.</p>" },
                ]
            }
        ]
    },
    bantuanTeknis: {
        title: "Bantuan Teknis",
        icon: Wrench,
        categories: [
            {
                title: "Login & Akun",
                items: [
                    { question: "Tidak bisa login", answer: "<p>Pastikan email dan password yang Anda masukkan sudah benar. Perhatikan huruf besar dan kecil pada password Anda. Jika masih bermasalah, coba gunakan fitur 'Lupa Password'.</p>" },
                    { question: "Lupa password", answer: "<p>Gunakan fitur 'Lupa Password' di halaman login. Anda akan menerima email untuk membuat password baru. Pastikan untuk memeriksa folder spam jika email tidak kunjung masuk.</p>" },
                    { question: "Email tidak masuk", answer: "<p>Jika Anda tidak menerima email (misalnya untuk reset password), tunggu beberapa menit dan periksa folder Spam atau Junk di email Anda. Pastikan juga tidak ada kesalahan pengetikan pada alamat email Anda.</p>" },
                    { question: "Ganti email", answer: "<p>Untuk saat ini, fitur penggantian alamat email belum dapat dilakukan secara mandiri. Silakan hubungi administrator untuk bantuan lebih lanjut.</p>" },
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
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Pusat Bantuan</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Temukan jawaban untuk pertanyaanmu</p>
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
                                <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400">
                                    <section.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                    {section.title}
                                </h3>
                            </div>
                            {section.categories.map((category, catIndex) => (
                                <div key={catIndex} className="mb-6 last:mb-0">
                                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider px-1 ml-1">{category.title}</h4>
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
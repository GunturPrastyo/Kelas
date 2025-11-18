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
        <div className="border-b border-gray-200 dark:border-gray-700 py-1">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left py-3 px-1 group"
            >
                <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 pb-4 pt-1 px-1">
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
        setOpenAccordion(openAccordion === id ? id : id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[99] flex justify-center items-start md:items-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 md:mt-0 animate-in fade-in-0 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pusat Bantuan</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {Object.values(helpData).map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-8 last:mb-0">
                            <h3 className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                                <section.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                {section.title}
                            </h3>
                            {section.categories.map((category, catIndex) => (
                                <div key={catIndex} className="mb-6 last:mb-0">
                                    <h4 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">{category.title}</h4>
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
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
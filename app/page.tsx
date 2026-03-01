"use client";
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Star,
  Menu,
  X,
  ChevronFirst,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  ArrowUp,
  Compass,
  Laptop,
  Award,
  Users,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Quote
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

// Data Dummy untuk Mentor
const mentors = [
  {
    name: "Dr. Budi Santoso",
    role: "Expert Web Development",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi", // Placeholder avatar
    desc: "Berpengalaman 10+ tahun di industri tech global.",
    bio: "Dr. Budi adalah praktisi teknologi yang berdedikasi untuk mencetak talenta digital baru. Dengan latar belakang akademis dan industri yang kuat, ia menyederhanakan konsep kompleks menjadi materi yang mudah dipahami.",
    experience: [
      "Senior Software Engineer di Google (2015-2020)",
      "CTO di EdTech Startup Indonesia (2020-Sekarang)",
      "Kontributor Core React.js Open Source"
    ],
    expertise: ["Full Stack Development", "Cloud Architecture", "DevOps"]
  },
  {
    name: "Siti Aminah, M.Kom",
    role: "Data Science Specialist",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti",
    desc: "Dosen dan praktisi AI yang fokus pada pembelajaran adaptif.",
    bio: "Siti Aminah percaya bahwa data adalah kunci masa depan. Ia aktif meneliti penerapan Artificial Intelligence dalam personalisasi pendidikan untuk meningkatkan efektivitas belajar siswa.",
    experience: [
      "Lead Data Scientist di GoTo (2019-2022)",
      "Dosen Tetap Ilmu Komputer UI",
      "Speaker di AI Summit Asia 2023"
    ],
    expertise: ["Machine Learning", "Python for Data Science", "Big Data Analytics"]
  },
  {
    name: "Andi Pratama",
    role: "UI/UX Designer Lead",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi",
    desc: "Mendesain pengalaman pengguna untuk aplikasi unicorn.",
    bio: "Andi memadukan estetika dan fungsionalitas. Ia telah membimbing ratusan desainer muda untuk memahami bahwa desain bukan hanya tentang visual, tapi tentang pemecahan masalah pengguna.",
    experience: [
      "Head of Design di Traveloka (2018-2021)",
      "UX Researcher Consultant untuk BUMN",
      "Mentor Google Certified Design Sprint"
    ],
    expertise: ["User Research", "Interaction Design", "Design Systems"]
  }
];

// Data Dummy Testimoni
const testimonials = [
  {
    name: "Rina Suryani",
    role: "Siswa SMK RPL",
    content: "Materi JavaScript dasarnya sangat lengkap! Dari variabel sampai DOM manipulation dijelaskan dengan sangat detail. Sangat membantu tugas sekolah saya.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rina"
  },
  {
    name: "Dimas Anggara",
    role: "Mahasiswa Teknik Informatika",
    content: "Akhirnya paham konsep Asynchronous JavaScript dan Promise setelah belajar di sini. Studi kasus real-world nya bikin logika coding jadi lebih jalan.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dimas"
  },
  {
    name: "Budi Santoso",
    role: "Siswa SMK TKJ",
    content: "Meskipun jurusan TKJ, belajar Node.js dan REST API di sini sangat mudah dipahami. Sekarang saya bisa buat bot monitoring jaringan sederhana.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi"
  },
  {
    name: "Sarah Putri",
    role: "Mahasiswa Sistem Informasi",
    content: "Modul integrasi API-nya juara! Sangat membantu skripsi saya yang membahas tentang pengembangan sistem informasi berbasis web.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  }
];

// Data Dummy Fitur
const features = [
  {
    icon: <Compass className="w-10 h-10 md:w-14 md:h-14 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />,
    title: "Jalur Belajar Personal",
    desc: "Sistem kami menyesuaikan materi berdasarkan hasil Pre-Test kamu. Tidak perlu belajar hal yang sudah kamu kuasai."
  },
  {
    icon: <Laptop className="w-10 h-10 md:w-14 md:h-14 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />,
    title: "Modul Interaktif",
    desc: "Materi disajikan dengan video, kuis, dan coding playground yang membuat belajar tidak membosankan."
  },
  {
    icon: <Award className="w-10 h-10 md:w-14 md:h-14 text-yellow-500 dark:text-yellow-400" strokeWidth={1.5} />,
    title: "Gamifikasi & Sertifikat",
    desc: "Dapatkan lencana setiap menyelesaikan tantangan dan sertifikat resmi untuk menunjang karirmu."
  },
  {
    icon: <Users className="w-10 h-10 md:w-14 md:h-14 text-green-600 dark:text-green-400" strokeWidth={1.5} />,
    title: "Komunitas Belajar",
    desc: "Bergabung dengan komunitas pelajar lainnya untuk berdiskusi dan berbagi pengetahuan."
  }
];

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [displayedText1, setDisplayedText1] = useState("");
  const [displayedText2, setDisplayedText2] = useState("");
  const [count, setCount] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mentorScrollRef = useRef<HTMLDivElement>(null);
  const [selectedMentor, setSelectedMentor] = useState<typeof mentors[0] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const text1 = "Bergabung dengan ";
    const text2 = " pelajar lainnya.";
    const targetCount = 10000;
    const countDuration = 1000;
    const typingSpeed = 60; // Kecepatan mengetik diperlambat (ms)

    let intervalId1: NodeJS.Timeout;
    let intervalId2: NodeJS.Timeout;
    let animationFrameId: number;

    // Fungsi untuk mengetik teks bagian kedua
    const startTypingText2 = () => {
      let j = 0;
      intervalId2 = setInterval(() => {
        if (j <= text2.length) {
          setDisplayedText2(text2.slice(0, j));
          j++;
        } else {
          clearInterval(intervalId2);
        }
      }, typingSpeed);
    };

    // Fungsi untuk animasi angka
    const startCounting = () => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / countDuration, 1);
        setCount(Math.floor(progress * targetCount));
        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        } else {
          // Setelah angka selesai, mulai ketik teks kedua
          startTypingText2();
        }
      };
      animationFrameId = window.requestAnimationFrame(step);
    };

    // Mulai mengetik teks pertama
    let i = 0;
    intervalId1 = setInterval(() => {
      if (i <= text1.length) {
        setDisplayedText1(text1.slice(0, i));
        i++;
      } else {
        clearInterval(intervalId1);
        // Setelah teks pertama selesai, mulai animasi angka
        startCounting();
      }
    }, typingSpeed);

    return () => {
      clearInterval(intervalId1);
      clearInterval(intervalId2);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Auto-rotate slider
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNextFeature = () => {
    setActiveFeature((prev) => (prev + 1) % features.length);
  };

  const handlePrevFeature = () => {
    setActiveFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const sections = ["fitur", "mentor", "faq"];
      let current = "";

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollMentors = (direction: 'left' | 'right') => {
    if (mentorScrollRef.current) {
      const { current } = mentorScrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth / 2 : current.offsetWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Auto scroll mentors
  useEffect(() => {
    const scrollContainer = mentorScrollRef.current;
    if (!scrollContainer) return;

    const interval = setInterval(() => {
      const cardWidth = scrollContainer.children[0]?.clientWidth || 300;
      const gap = 24;
      const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      
      if (scrollContainer.scrollLeft >= maxScrollLeft - 10) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainer.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-sans text-slate-800 dark:text-slate-200 selection:bg-blue-100 dark:selection:bg-blue-900">

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              {/* Menggunakan logo.webp sesuai request */}
              <img src="/logo.webp" alt="KELAS Logo" className="h-8 w-auto" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {['fitur', 'mentor', 'faq'].map((item) => (
                <Link
                  key={item}
                  href={`#${item}`}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    activeSection === item
                      ? 'text-blue-600 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white'
                  }`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                  {activeSection === item && (
                    <motion.span
                      layoutId="activeSection"
                      className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 dark:bg-white rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
              <div className="flex items-center gap-3 ml-4">
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                aria-label="Toggle Theme"
              >
                {mounted && resolvedTheme === 'dark' ? (
                  <Moon size={20} />
                ) : (
                  <Sun size={20} />
                )}
              </button>
                <Link href="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Masuk
                </Link>
                <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition shadow-lg shadow-blue-500/30">
                  Daftar Sekarang
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 mr-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                aria-label="Toggle Theme"
              >
                {mounted && resolvedTheme === 'dark' ? (
                  <Moon size={20} />
                ) : (
                  <Sun size={20} />
                )}
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-16 left-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-gray-800 shadow-2xl"
          >
            <div className="px-4 py-6 space-y-2">
              <Link 
                href="#fitur" 
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${activeSection === 'fitur' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-gray-800' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Fitur
              </Link>
              <Link 
                href="#mentor" 
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${activeSection === 'mentor' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-gray-800' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mentor
              </Link>
              <Link 
                href="#faq" 
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${activeSection === 'faq' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-gray-800' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-gray-800 flex">
                <Link 
                  href="/login" 
                  className="flex-1 flex items-center justify-center px-4 py-3 rounded-l-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-all"
                >
                  Masuk
                </Link>
                <Link 
                  href="/register" 
                  className="flex-1 flex items-center justify-center px-4 py-3 rounded-r-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Blob 1 - Top Right (Bentuk Cat Besar) */}
          <svg className="absolute top-0 right-0 w-full h-full pointer-events-none z-0 rotate-180" viewBox="0 0 400 540" preserveAspectRatio="xMinYMax slice">
            <g transform="translate(0, 540)" className="opacity-60 dark:opacity-20">
              <path d="M0 -189C39 -187.5 78 -186 94.5 -163.7C111 -141.4 104.9 -98.2 116.9 -67.5C128.9 -36.8 159 -18.4 189 0L0 0Z" className="fill-sky-200 dark:fill-sky-900" />
            </g>
          </svg>
          {/* Blob 2 - Bottom Wave Divider */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg className="w-full h-auto" viewBox="0 320 900 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 351L21.5 362C43 373 86 395 128.8 395.2C171.7 395.3 214.3 373.7 257.2 367.8C300 362 343 372 385.8 376.5C428.7 381 471.3 380 514.2 380.7C557 381.3 600 383.7 642.8 392.2C685.7 400.7 728.3 415.3 771.2 411.8C814 408.3 857 386.7 878.5 375.8L900 365L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-100 dark:fill-slate-800" />
              <path d="M0 462L21.5 463.2C43 464.3 86 466.7 128.8 459C171.7 451.3 214.3 433.7 257.2 424.7C300 415.7 343 415.3 385.8 415.5C428.7 415.7 471.3 416.3 514.2 427.2C557 438 600 459 642.8 466.3C685.7 473.7 728.3 467.3 771.2 463.2C814 459 857 457 878.5 456L900 455L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-200 dark:fill-sky-900" />
              <path d="M0 455L21.5 454.5C43 454 86 453 128.8 456.3C171.7 459.7 214.3 467.3 257.2 473.3C300 479.3 343 483.7 385.8 488.2C428.7 492.7 471.3 497.3 514.2 489.7C557 482 600 462 642.8 463.2C685.7 464.3 728.3 486.7 771.2 487C814 487.3 857 465.7 878.5 454.8L900 444L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-300 dark:fill-sky-800" />
              <path d="M0 535L21.5 532.7C43 530.3 86 525.7 128.8 520.5C171.7 515.3 214.3 509.7 257.2 505C300 500.3 343 496.7 385.8 502.5C428.7 508.3 471.3 523.7 514.2 524.2C557 524.7 600 510.3 642.8 506.5C685.7 502.7 728.3 509.3 771.2 512C814 514.7 857 513.3 878.5 512.7L900 512L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-400 dark:fill-sky-700" />
              <path d="M0 569L21.5 563.8C43 558.7 86 548.3 128.8 542.3C171.7 536.3 214.3 534.7 257.2 534.3C300 534 343 535 385.8 534.7C428.7 534.3 471.3 532.7 514.2 536.8C557 541 600 551 642.8 554.2C685.7 557.3 728.3 553.7 771.2 554.2C814 554.7 857 559.3 878.5 561.7L900 564L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-500 dark:fill-sky-600" />
            </svg>
          </div>

        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1 w-full text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-semibold uppercase tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Platform Belajar Pintar
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
            >
              Belajar Lebih Efektif dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Kurikulum Personal</span>
            </motion.h1>
            

            {/* Mobile Hero Image */}
            <div className="hidden items-center justify-center w-full my-6">
              <Image
                src="/ilustrasi2.png"
                alt="Ilustrasi Belajar Online"
                width={500}
                height={500}
                className="w-full max-w-md object-contain"
                priority
              />
            </div>

            <div className="flex flex-col md:flex-row lg:flex-col items-center gap-8 lg:gap-6">
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl text-left flex-1">
                KELAS membantu kamu menemukan jalur belajar yang tepat sesuai kemampuanmu. Ikuti pre-tes, dapatkan rekomendasi, dan mulai tingkatkan skillmu hari ini.
              </p>
              
              {/* Tablet Image (Visible MD, Hidden LG) */}
              <div className="hidden md:flex lg:hidden flex-1 items-center justify-center">
                <Image
                  src="/ilustrasi2.png"
                  alt="Ilustrasi Belajar Online"
                  width={400}
                  height={400}
                  className="w-full max-w-sm object-contain"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-row items-center justify-start gap-3 sm:gap-4 pt-2">
              <Link href="/pre-test" className="group relative inline-flex items-center justify-center px-4 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white transition-all duration-200 bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
                Coba Pre-tes
                <ChevronRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/modul" className="inline-flex items-center justify-center px-4 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-full hover:bg-slate-50 dark:hover:bg-gray-700 transition-all">
                <Play className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                Lihat Demo
              </Link>
            </div>
            <div className="flex items-center justify-start gap-4 text-sm text-slate-900 dark:text-slate-300">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <p>{displayedText1}<span className="font-bold text-blue-600 dark:text-blue-400">{count.toLocaleString('en-US')}+</span>{displayedText2}</p>
            </div>
          </div>

          {/* Hero Image / Illustration */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <Image
              src="/ilustrasi2.png" // Ganti dengan path ilustrasi yang sesuai
              alt="Ilustrasi Belajar Online"
              width={500}
              height={500}
              className="w-full max-w-md lg:max-w-lg object-contain"
              priority
            />
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="fitur" className="relative py-24 bg-slate-50 dark:bg-gray-900 overflow-hidden">
        
        {/* Top Wave Decoration */}
        <div className="absolute top-0 left-0 w-full pointer-events-none z-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 120" className="w-full h-12 md:h-20" preserveAspectRatio="none">
            <path d="M0 69L37.5 69.5C75 70 150 71 225 80.8C300 90.7 375 109.3 450 109.2C525 109 600 90 675 85.7C750 81.3 825 91.7 862.5 96.8L900 102L900 0L862.5 0C825 0 750 0 675 0C600 0 525 0 450 0C375 0 300 0 225 0C150 0 75 0 37.5 0L0 0Z" className="fill-sky-500 dark:fill-sky-600" strokeLinecap="round" strokeLinejoin="miter"/>
          </svg>
        </div>

        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen"></div>
            </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left md:text-center max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <span className="text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase text-sm">Keunggulan Kami</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Kenapa Memilih KELAS?</h2>
            </motion.div>
            
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-slate-600 dark:text-slate-400 text-left md:text-center"
            >
              Kami menggabungkan teknologi dan pedagogi untuk menciptakan pengalaman belajar yang tidak hanya efektif, tapi juga menyenangkan.
            </motion.p>
          </div>

          {/* 3D Carousel Slider */}
          <div className="relative h-[400px] md:h-[450px] w-full max-w-6xl mx-auto flex items-center mt-2 md:mt-8 mb-12 md:mb-20 justify-center perspective-1000">
            {features.map((feature, idx) => {
              const position = (idx - activeFeature + features.length) % features.length;
              
              // Tentukan properti animasi berdasarkan posisi
              let animateProps = {};
              if (position === 0) { // Active (Tengah)
                animateProps = { x: 0, scale: 1, zIndex: 30, opacity: 1, filter: "blur(0px)" };
              } else if (position === 1) { // Kanan
                animateProps = { x: 320, scale: 0.85, zIndex: 20, opacity: 0.7, filter: "blur(1px)" };
              } else if (position === features.length - 1) { // Kiri
                animateProps = { x: -320, scale: 0.85, zIndex: 20, opacity: 0.7, filter: "blur(1px)" };
              } else { // Belakang (Hidden/Faint)
                animateProps = { x: 0, scale: 0.6, zIndex: 10, opacity: 0, filter: "blur(4px)" };
              }

              return (
                <motion.div 
                  key={idx} 
                  animate={animateProps}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute w-full max-w-xs sm:max-w-sm md:max-w-md p-8 md:p-12 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-xl flex flex-col items-start md:items-center text-left md:text-center cursor-pointer overflow-hidden group min-h-[340px] md:min-h-0"
                  onClick={() => setActiveFeature(idx)}
                  style={{
                    boxShadow: position === 0 ? "0 25px 50px -12px rgba(0, 0, 0, 0.15)" : "none"
                  }}
                >
                  {/* Decorative SVG - Softer Colors */}
                  <svg xmlns="http://www.w3.org/2000/svg" id="visual" viewBox="0 0 900 600" className="absolute left-0 top-0 w-full h-full opacity-100 dark:opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110" version="1.1" preserveAspectRatio="none">
                    <path d="M336 0L259 0L259 86L297 86L297 171L376 171L376 257L288 257L288 343L344 343L344 429L361 429L361 514L290 514L290 600L0 600L0 514L0 514L0 429L0 429L0 343L0 343L0 257L0 257L0 171L0 171L0 86L0 86L0 0L0 0Z" className="fill-sky-100 dark:fill-sky-100/10" />
                    <path d="M263 0L264 0L264 86L289 86L289 171L216 171L216 257L253 257L253 343L280 343L280 429L226 429L226 514L197 514L197 600L0 600L0 514L0 514L0 429L0 429L0 343L0 343L0 257L0 257L0 171L0 171L0 86L0 86L0 0L0 0Z" className="fill-sky-200 dark:fill-sky-200/10" />
                    <path d="M196 0L171 0L171 86L156 86L156 171L194 171L194 257L192 257L192 343L144 343L144 429L152 429L152 514L200 514L200 600L0 600L0 514L0 514L0 429L0 429L0 343L0 343L0 257L0 257L0 171L0 171L0 86L0 86L0 0L0 0Z" className="fill-sky-300 dark:fill-sky-300/10" />
                    <path d="M119 0L127 0L127 86L109 86L109 171L77 171L77 257L95 257L95 343L107 343L107 429L123 429L123 514L46 514L46 600L0 600L0 514L0 514L0 429L0 429L0 343L0 343L0 257L0 257L0 171L0 171L0 86L0 86L0 0L0 0Z" className="fill-sky-400 dark:fill-sky-400/10" />
                  </svg>

                  <div className="relative z-10 flex flex-col items-start md:items-center h-full justify-center w-full">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-white dark:bg-gray-700 rounded-3xl shadow-xl shadow-blue-100/50 dark:shadow-none border border-slate-50 dark:border-gray-600 flex items-center justify-center mb-6 md:mb-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 md:mb-4 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-lg px-0 md:px-2 text-left md:text-center font-medium opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* Navigation Buttons */}
            <button onClick={handlePrevFeature} className="absolute left-4 md:left-10 z-40 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all text-slate-700 dark:text-slate-200">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={handleNextFeature} className="absolute right-4 md:right-10 z-40 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all text-slate-700 dark:text-slate-200">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

   

        {/* Bottom Wave Decoration */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0 ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 400 900 200" className="w-full h-40 md:h-60" preserveAspectRatio="none">
            <path d="M0 431L21.5 439.3C43 447.7 86 464.3 128.8 470.2C171.7 476 214.3 471 257.2 470.3C300 469.7 343 473.3 385.8 466.2C428.7 459 471.3 441 514.2 442.3C557 443.7 600 464.3 642.8 475.8C685.7 487.3 728.3 489.7 771.2 482.2C814 474.7 857 457.3 878.5 448.7L900 440L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-100 dark:fill-sky-900"/>
            <path d="M0 530L21.5 530.2C43 530.3 86 530.7 128.8 529.8C171.7 529 214.3 527 257.2 519.7C300 512.3 343 499.7 385.8 497.8C428.7 496 471.3 505 514.2 503.2C557 501.3 600 488.7 642.8 487.8C685.7 487 728.3 498 771.2 501C814 504 857 499 878.5 496.5L900 494L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-200 dark:fill-sky-800"/>
            <path d="M0 549L21.5 546.5C43 544 86 539 128.8 534C171.7 529 214.3 524 257.2 529.5C300 535 343 551 385.8 558.3C428.7 565.7 471.3 564.3 514.2 563.8C557 563.3 600 563.7 642.8 554.8C685.7 546 728.3 528 771.2 519.8C814 511.7 857 513.3 878.5 514.2L900 515L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-300 dark:fill-sky-700"/>
          </svg>
        </div>
      </section>

      {/* --- MENTOR SECTION --- */}
      <section id="mentor" className="relative py-24 bg-sky-300 dark:bg-sky-700 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 ">
          <div className="text-left md:text-center max-w-3xl mx-auto mb-10 -mt-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4"
            >
              Belajar Langsung dari Ahlinya
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-slate-700 dark:text-blue-100 text-lg font-medium text-left md:text-center"
            >
              Dapatkan wawasan berharga dari praktisi industri dan akademisi berpengalaman yang siap membimbing perjalanan karirmu.
            </motion.p>
          </div>

          <div className="relative group px-4 md:px-10">
            <div 
              ref={mentorScrollRef}
              className={`flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 [&::-webkit-scrollbar]:hidden`}
              onTouchStart={(e) => {
                // Logika touch start
              }}
              onTouchEnd={(e) => {}}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {mentors.map((mentor, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex-shrink-0 w-full md:w-[calc(33.333%-1rem)] snap-center group/card relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800"
                  onClick={() => setSelectedMentor(mentor)}
                >
                  <div className="aspect-[4/5] w-full relative overflow-hidden">
                    <img
                      src={mentor.image}
                      alt={mentor.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity"></div>

                    <div className="absolute bottom-0 left-0 p-6 text-white w-full transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">
                      <div className="w-12 h-1 bg-blue-500 mb-4 rounded-full"></div>
                      <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">{mentor.role}</p>
                      <h3 className="text-2xl font-bold mb-2">{mentor.name}</h3>
                      <p className="text-sm text-gray-300 opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-all duration-300 delay-100 h-auto md:h-0 md:group-hover/card:h-auto overflow-hidden text-left">
                        {mentor.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>


          </div>
        </div>
        
        {/* Bottom Transition */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none translate-y-[1px]">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto block">
                <path fill="currentColor" className="text-white dark:text-gray-900" fillOpacity="1" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
        </div>
      </section>

      {/* Mentor Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMentor(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelectedMentor(null)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10">
              <X size={20} />
            </button>
            
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-2/5 h-64 md:h-auto relative">
                <img src={selectedMentor.image} alt={selectedMentor.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:hidden flex items-end p-6">
                  <div>
                    <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">{selectedMentor.role}</p>
                    <h3 className="text-2xl font-bold text-white">{selectedMentor.name}</h3>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto max-h-[60vh] md:max-h-auto">
                <div className="hidden md:block mb-6">
                  <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">{selectedMentor.role}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{selectedMentor.name}</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-2 flex items-center gap-2"><Users size={16} /> Tentang Mentor</h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{selectedMentor.bio}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-2 flex items-center gap-2"><Award size={16} /> Pengalaman & Riwayat</h4>
                    <ul className="space-y-2">
                      {selectedMentor.experience.map((exp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                          <span>{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-2 flex items-center gap-2"><Laptop size={16} /> Keahlian Utama</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMentor.expertise.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="pt-6 pb-0 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4"
            >
              Apa Kata Mereka?
            </motion.h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Ribuan siswa dari berbagai jurusan telah merasakan dampak positif belajar di KELAS.
            </p>
          </div>

          {/* Infinite Scroll Container */}
          <div className="relative w-full overflow-hidden">
            
            {/* Desktop View (Horizontal Scroll) */}
            <div className="hidden md:flex relative w-full overflow-hidden">
               {/* Gradient Masks */}
               <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-20"></div>
               <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-20"></div>
               
               <motion.div 
                 className="flex gap-8"
                 animate={{ x: ["0%", "-50%"] }}
                 transition={{ 
                   repeat: Infinity, 
                   ease: "linear", 
                   duration: 30 
                 }}
                 style={{ width: "max-content" }}
               >
                 {[...testimonials, ...testimonials].map((item, idx) => (
                   <div key={`desktop-${idx}`} className="w-[400px] bg-slate-50 dark:bg-gray-800 p-8 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                     <Quote className="text-blue-100 dark:text-blue-900/30 w-10 h-10 mb-4 rotate-180" />
                     <p className="text-slate-600 dark:text-slate-300 mb-6 italic text-sm leading-relaxed min-h-[80px]">"{item.content}"</p>
                     <div className="flex items-center gap-4">
                       <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full bg-gray-200" />
                       <div>
                         <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                         <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </motion.div>
            </div>

            {/* Mobile View (Vertical Scroll with Timeline) */}
            <div className="md:hidden relative h-[500px] overflow-hidden">
               {/* Gradient Masks */}
               <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white dark:from-gray-900 to-transparent z-20"></div>
               <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-20"></div>

               <motion.div 
                 className="flex flex-col"
                 animate={{ y: ["0%", "-50%"] }}
                 transition={{ 
                   repeat: Infinity, 
                   ease: "linear", 
                   duration: 30 
                 }}
               >
                 {[...testimonials, ...testimonials].map((item, idx) => (
                   <div key={`mobile-${idx}`} className="flex gap-4 pb-8 relative px-4">
                      {/* Timeline Line */}
                      <div className="absolute left-[35px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                      
                      {/* Timeline Dot */}
                      <div className="relative z-10 shrink-0 w-10 h-10 flex items-start justify-center pt-1">
                         <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900 shadow-sm"></div>
                      </div>
                      
                      {/* Card */}
                      <div className="flex-1 bg-slate-50 dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                         <p className="text-slate-600 dark:text-slate-300 mb-4 italic text-sm">"{item.content}"</p>
                         <div className="flex items-center gap-3">
                           <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full bg-gray-200" />
                           <div>
                             <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</h4>
                             <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.role}</p>
                           </div>
                         </div>
                      </div>
                   </div>
                 ))}
               </motion.div>
            </div>

          </div>
        </div>
        <div className="relative w-full pointer-events-none z-0 mt-10">
          <svg xmlns="http://www.w3.org/2000/svg" id="visual" viewBox="0 400 900 200" className="w-full h-24 sm:h-32 block" preserveAspectRatio="none">
            <path d="M0 430L21.5 422.2C43 414.3 86 398.7 128.8 402.7C171.7 406.7 214.3 430.3 257.2 444.2C300 458 343 462 385.8 463.3C428.7 464.7 471.3 463.3 514.2 452C557 440.7 600 419.3 642.8 424.5C685.7 429.7 728.3 461.3 771.2 468.5C814 475.7 857 458.3 878.5 449.7L900 441L900 601L878.5 601C857 601 814 601 771.2 601C728.3 601 685.7 601 642.8 601C600 601 557 601 514.2 601C471.3 601 428.7 601 385.8 601C343 601 300 601 257.2 601C214.3 601 171.7 601 128.8 601C86 601 43 601 21.5 601L0 601Z" className="fill-sky-300 dark:fill-sky-700" strokeLinecap="round" strokeLinejoin="miter"/>
          </svg>
        </div>
      </section>

      {/* --- CTA & FAQ SECTION --- */}
      <section id="faq" className="py-8 sm:py-20 bg-slate-50 dark:bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* CTA Card */}
            <div className="bg-blue-600 rounded-3xl p-8 md:p-12 text-left md:text-center text-white relative overflow-hidden shadow-2xl shadow-blue-600/30 h-full flex flex-col justify-center">
               {/* Decorative Circles */}
               <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-900 opacity-20 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>

               <div className="relative z-10">
                 <motion.h2 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.5 }}
                   className="text-3xl md:text-4xl font-bold mb-6"
                 >Siap Memulai Perjalanan Belajarmu?</motion.h2>
                 <p className="text-blue-100 text-lg mb-8 text-left md:text-center">
                   Jangan buang waktu mempelajari apa yang sudah kamu tahu. Ikuti tes awal kami dan dapatkan kurikulum yang dipersonalisasi khusus untukmu.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 justify-start md:justify-center">
                   <Link href="/register" className="bg-white text-blue-600 px-8 py-3.5 rounded-full font-bold hover:bg-blue-50 transition shadow-lg">
                     Daftar Gratis Sekarang
                   </Link>
                   <Link href="/pre-test" className="bg-transparent border border-white text-white px-8 py-3.5 rounded-full font-bold hover:bg-white/10 transition">
                     Coba Pre-Test Dulu
                   </Link>
                 </div>
               </div>
            </div>

            {/* FAQ List */}
            <div className="w-full">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold text-slate-900 dark:text-white mb-8"
              >Pertanyaan Umum</motion.h2>
              <div className="space-y-4">
                {[
                  { q: "Apakah Pre-Test ini wajib?", a: "Sangat disarankan. Pre-test membantu sistem kami menentukan level materi yang paling cocok untukmu (Dasar, Menengah, atau Lanjut)." },
                  { q: "Apakah sertifikatnya valid untuk melamar kerja?", a: "Ya, sertifikat KELAS diakui oleh banyak mitra industri kami sebagai bukti kompetensi." },
                  { q: "Berapa lama akses materi berlaku?", a: "Sekali kamu mendaftar pada sebuah modul, kamu memiliki akses seumur hidup ke materi tersebut." }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-gray-700">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{item.q}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-left">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Scroll To Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 z-50 hover:bg-blue-700 hover:scale-110 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-6 h-6" />
      </button>

      {/* --- FOOTER --- */}
      <footer className="bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.webp" alt="KELAS Icon" className="h-8 w-auto" />
               
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 text-left">
                Platform e-learning adaptif yang membantu kamu belajar lebih cepat dan efektif dengan kurikulum yang dipersonalisasi.
              </p>
              <div className="flex gap-4">
                <Link href="https://instagram.com/kartinielearning" target="_blank" className="text-slate-400 hover:text-pink-600 transition-colors">
                  <Instagram size={20} />
                </Link>
                <Link href="https://youtube.com/@kartinielearning" target="_blank" className="text-slate-400 hover:text-red-600 transition-colors">
                  <Youtube size={20} />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Produk</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><Link href="#" className="hover:text-blue-600">Semua Modul</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Pre-Test</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Bootcamp</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><Link href="#" className="hover:text-blue-600">Tentang Kami</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Karir</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Blog</Link></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Hubungi Kami</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <Mail size={18} className="text-blue-600 mt-0.5 shrink-0" />
                  <a href="mailto:kartinielearningapps@gmail.com" className="hover:text-blue-600 break-all">kartinielearningapps@gmail.com</a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-blue-600 mt-0.5 shrink-0" />
                  <span>Semarang, Jawa Tengah, Indonesia</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-gray-800 pt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>&copy; 2025 KELAS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

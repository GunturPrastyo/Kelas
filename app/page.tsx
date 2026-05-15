"use client";
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Star,
  Sparkles,
  Menu,
  Home,
  Award,
  X,
  ChevronFirst,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  ArrowUp,
  ArrowUpRight,
  Laptop,
  Users,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Quote,
  Database,
  Server,
  Smartphone,
  Globe,
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
    icon: "/target.webp",
    title: "Jalur Belajar Personal",
    desc: "Sistem cerdas kami menyesuaikan tingkat kesulitan materi berdasarkan hasil Tes Awal. Belajar mulai dari Dasar, Menengah, atau Lanjut sesuai kemampuanmu.",
    image: "/pre-tes.webp"
  },
  {
    icon: "/modules.png",
    title: "Mode Belajar Fleksibel",
    desc: "Pilih gaya belajarmu sendiri. Tersedia materi dalam bentuk teks interaktif, video pembelajaran, hingga sesi praktik langsung untuk pengalaman yang optimal.",
    image: "/book.webp"
  },
  {
    icon: "/analitik.png",
    title: "Analisis Pembelajaran",
    desc: "Pantau perkembanganmu secara terperinci. Dapatkan laporan akurasi, kecepatan, fokus, serta rekomendasi untuk topik yang masih menjadi kelemahanmu.",
    image: "/analisis.webp"
  },
  {
    icon: "/coding.webp",
    title: "Live Code Playground",
    desc: "Terapkan teori langsung ke praktik. Tulis, jalankan, dan lihat hasil kode HTML maupun JavaScript secara real-time di dalam browser tanpa aplikasi tambahan.",
    image: "/post-test.webp"
  },
  {
    icon: "/robot.png",
    title: "Tutor AI 'Kak Gem'",
    desc: "Buntu saat belajar? Tanyakan saja pada Kak Gem, asisten AI cerdas yang siap membantumu memahami materi dan memecahkan masalah koding kapan saja.",
    image: "/robot.png"
  },
  {
    icon: "/progress1.webp",
    title: "Gamifikasi & Sertifikat",
    desc: "Jaga motivasi belajar dengan sistem streak harian, raih skor terbaik di setiap post-test, dan dapatkan sertifikat resmi setelah menyelesaikan modul.",
    image: "/post-test-akhir.webp"
  }
];

interface Module {
  _id: string;
  title: string;
  slug: string;
  overview: string;
  category: string;
  icon: string;
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [displayedText1, setDisplayedText1] = useState("");
  const [displayedText2, setDisplayedText2] = useState("");
  const [displayedBadgeText, setDisplayedBadgeText] = useState("");
  const [count, setCount] = useState(0);  const [activeFeature, setActiveFeature] = useState(0);
  const [activeMentorIdx, setActiveMentorIdx] = useState(0);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<typeof mentors[0] | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoadingModules(true);
        // Mengasumsikan ada endpoint publik di /api/modul. Endpoint /api/modul/progress memerlukan autentikasi.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) throw new Error("API URL not configured");

        const res = await fetch(`${apiUrl}/api/modul`);
        if (!res.ok) {
          console.warn("Gagal memuat modul.");
          return;
        }
        const data = await res.json();
        setModules(data);
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const text = "Platform Belajar Pintar";
    let i = 0;
    const intervalId = setInterval(() => {
      if (i <= text.length) {
        setDisplayedBadgeText(text.slice(0, i));
        i++;
      } else {
        clearInterval(intervalId);
      }
    }, 100);
    return () => clearInterval(intervalId);
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

  // Auto-rotate feature slider
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [features.length]);

  const handleNextFeature = () => {
    setActiveFeature((prev) => (prev + 1) % features.length);
  };
  const handlePrevFeature = () => {
    setActiveFeature((prev) => (prev - 1 + features.length) % features.length);
  };
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 400);

      const sections = ["fitur", "modul", "mentor", "CTA"];
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

  // Auto rotate mentors
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMentorIdx((prev) => (prev + 1) % mentors.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen max-w-[100vw] bg-white dark:bg-gray-900 font-sans text-slate-800 dark:text-slate-200 selection:bg-blue-100 dark:selection:bg-blue-900 overflow-x-hidden">

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-40 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")" }}></div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.04); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(30px) scale(0.96); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(0.5deg); }
          66% { transform: translateY(-6px) rotate(-0.3deg); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 10s ease-in-out infinite; }
        .animate-card-float { animation: cardFloat 6s ease-in-out infinite; }
        .animate-card-float-1 { animation: cardFloat 5s ease-in-out infinite 1s; }
        .animate-card-float-2 { animation: cardFloat 7s ease-in-out infinite 0.5s; }
        .animate-card-float-3 { animation: cardFloat 6s ease-in-out infinite 2s; }
      `}</style>
      <style jsx global>{`
        html {
            scroll-behavior: smooth;
        }
        .hide-scrollbar-on-mobile::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar-on-mobile {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    `}</style>

      {/* --- NAVBAR --- */}
      <nav id="navbar" className={`fixed top-0 left-0 right-0 z-[100] px-4 md:px-16 lg:px-12 h-[60px] lg:h-[68px] flex items-center justify-between transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-gray-900/95 shadow-[0_4px_24px_rgba(0,0,0,0.06)]' : 'bg-white/80 dark:bg-gray-900/80'} backdrop-blur-[20px] saturate-[180%] border-b border-slate-200/70 dark:border-gray-800 `}>
        <Link href="#" className="px-0">
          <img src="/logo.webp" alt="KELAS Logo" className="h-8 w-auto" />
     
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link href="#fitur" className="text-slate-600 dark:text-slate-300 text-[0.9rem] font-medium px-4 py-2 rounded-full transition-all duration-200 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30">Fitur</Link>
          <Link href="#modul" className="text-slate-600 dark:text-slate-300 text-[0.9rem] font-medium px-4 py-2 rounded-full transition-all duration-200 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30">Modul</Link>
          <Link href="#mentor" className="text-slate-600 dark:text-slate-300 text-[0.9rem] font-medium px-4 py-2 rounded-full transition-all duration-200 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30">Mentor</Link>
          <Link href="#CTA" className="text-slate-600 dark:text-slate-300 text-[0.9rem] font-medium px-4 py-2 rounded-full transition-all duration-200 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30">CTA</Link>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="px-5 py-2 rounded-full border-none bg-transparent text-slate-700 dark:text-slate-300 text-[0.9rem] font-medium cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 no-underline">Masuk</Link>
          <Link href="/register" className="px-6 py-[0.55rem] rounded-full border-none bg-blue-600 text-white text-[0.9rem] font-semibold cursor-pointer transition-all duration-250 no-underline shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:bg-blue-700 hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(37,99,235,0.4)]">Daftar Gratis</Link>
        </div>
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed top-[60px] z-[90] left-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-gray-800 shadow-2xl"
        >
          <div className="px-4 py-6 space-y-2">
            <Link href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${activeSection === 'fitur' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-gray-800' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'}`}>Fitur</Link>
            <Link href="#modul" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${activeSection === 'modul' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-gray-800' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'}`}>Modul</Link>
            <Link href="#mentor" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${activeSection === 'mentor' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-gray-800' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'}`}>Mentor</Link>
            <Link href="#CTA" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${activeSection === 'CTA' ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-gray-800' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'}`}>CTA</Link>
            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-gray-800 flex">
              <Link href="/login" className="flex-1 flex items-center justify-center px-4 py-3 rounded-l-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-all">Masuk</Link>
              <Link href="/register" className="flex-1 flex items-center justify-center px-4 py-3 rounded-r-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all">Daftar</Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- HERO --- */}
      <section className="min-h-screen md:min-h-[60vh] lg:min-h-screen pt-[100px] md:pt-[120px] lg:pt-[100px] pb-10 flex items-center relative overflow-hidden" id="home">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_60%_40%,black_30%,transparent_70%)]"></div>
          <div className="absolute top-[-10%] right-[-5%] w-[650px] h-[650px] bg-[radial-gradient(circle_at_40%_40%,rgba(99,102,241,0.12)_0%,rgba(37,99,235,0.08)_40%,transparent_70%)] rounded-full animate-float"></div>
          <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(14,165,233,0.10)_0%,transparent_70%)] rounded-full animate-float-reverse"></div>
        </div>

        <div className="relative z-10 max-w-full mx-auto px-4 md:px-16 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center mt-10 md:mt-0">
          {/* Left: Text */}
          <div className="text-left">
            <div className="text-blue-600 dark:text-blue-400 font-bold tracking-wider text-lg mb-2 block font-[family-name:var(--font-kalam)]">
              
              {displayedBadgeText}
            </div>
            <h1 className="text-3xl md:text-5xl text-slate-900 font-medium dark:text-white mb-6 font-[family-name:var(--font-gagalin)] leading-tight">
              Belajar Lebih Efektif dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Kurikulum Personal</span>
            </h1>
            <p className="text-[1.1rem] text-slate-600 dark:text-slate-400 max-w-[500px] mx-auto md:mx-0 mb-10 font-normal leading-[1.7]">
              KELAS membantu kamu menemukan jalur belajar yang tepat sesuai kemampuanmu. Ikuti pre-tes, dapatkan rekomendasi, dan tingkatkan skillmu hari ini.
            </p>
            <div className="flex justify-start gap-2 sm:gap-4 mb-12 w-full">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 py-3 px-4 sm:py-[0.85rem] sm:px-8 rounded-full bg-blue-600 text-white text-sm sm:text-[1rem] font-semibold no-underline shadow-[0_8px_28px_rgba(37,99,235,0.35),0_2px_8px_rgba(37,99,235,0.2)] transition-all duration-300 relative overflow-hidden hover:-translate-y-[2px] hover:shadow-[0_16px_40px_rgba(37,99,235,0.45)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/15 before:to-transparent before:rounded-full whitespace-nowrap flex-1 sm:flex-none">
                Mulai Belajar Gratis
              </Link>
              <a href="#fitur" className="inline-flex justify-center items-center py-3 px-4 sm:py-[0.85rem] sm:px-6 text-sm sm:text-[1rem] rounded-full border-[1.5px] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium no-underline transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap flex-1 sm:flex-none">
                Lihat Fitur
              </a>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="flex">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" alt="u1" className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-900 -ml-2 first:ml-0 bg-slate-200 dark:bg-slate-700" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=2" alt="u2" className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-900 -ml-2 first:ml-0 bg-slate-200 dark:bg-slate-700" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=3" alt="u3" className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-900 -ml-2 first:ml-0 bg-slate-200 dark:bg-slate-700" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=4" alt="u4" className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-900 -ml-2 first:ml-0 bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="text-[0.88rem] text-slate-600 dark:text-slate-400">
                {displayedText1}<strong className="text-blue-600 dark:text-blue-400 font-bold"></strong>{displayedText2}
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative h-[560px] hidden lg:flex items-center justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-br from-blue-600/5 to-indigo-500/10 border border-blue-600/10 rounded-full"></div>

            <div className="absolute top-[40px] right-0 w-[340px] bg-white dark:bg-gray-800 rounded-[24px] p-6 shadow-[0_20px_60px_-10px_rgba(37,99,235,0.12),0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-gray-700 animate-card-float">
              <div className="flex items-center justify-between mb-5">
                <div className="w-[44px] h-[44px] rounded-[14px] overflow-hidden flex-shrink-0">
                  <img src="/js.png" alt="JS" className="w-full h-full object-cover" />
                </div>
                <div className="px-3 py-1 bg-green-200 dark:bg-green-900/60 text-green-800 dark:text-green-300 rounded-full text-[0.72rem] font-semibold">▶ Sedang Belajar</div>
              </div>
              <div className="font-[family-name:var(--font-gagalin)] text-[1rem] font-bold text-slate-900 dark:text-white mb-2 tracking-wide">JavaScript Fundamental</div>
              <div className="flex justify-between text-[0.78rem] text-slate-600 dark:text-slate-400 mb-2">
                <span>Progress Modul</span>
                <span>73%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-[width] duration-1000 ease-out" style={{ width: '73%' }}></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2 text-center">
                  <div className="font-[family-name:var(--font-gagalin)] text-[1rem] font-bold text-slate-900 dark:text-white">12</div>
                  <div className="text-[0.65rem] text-slate-400 font-medium">Modul</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2 text-center">
                  <div className="font-[family-name:var(--font-gagalin)] text-[1rem] font-bold text-slate-900 dark:text-white">4.8</div>
                  <div className="text-[0.65rem] text-slate-400 font-medium">Rating</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2 text-center">
                  <div className="font-[family-name:var(--font-gagalin)] text-[1rem] font-bold text-slate-900 dark:text-white">🔥 5</div>
                  <div className="text-[0.65rem] text-slate-400 font-medium">Streak</div>
                </div>
              </div>
            </div>

            <div className="absolute bg-white dark:bg-gray-800 rounded-[16px] py-[0.85rem] px-[1.1rem] shadow-[0_12px_40px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-200/80 dark:border-gray-700 flex items-center gap-3 text-[0.82rem] font-semibold whitespace-nowrap top-0 left-[-20px] animate-card-float-1">
              <div className="w-[36px] h-[36px] rounded-[10px] grid place-items-center text-[1.1rem] shrink-0 bg-blue-200 dark:bg-blue-900/60">🎯</div>
              <div>
                <div className="text-slate-900 dark:text-white">Pre-Tes Selesai!</div>
                <div className="text-[0.72rem] text-slate-400 font-normal">Jalur belajar sudah siap</div>
              </div>
            </div>
            <div className="absolute bg-white dark:bg-gray-800 rounded-[16px] py-[0.85rem] px-[1.1rem] shadow-[0_12px_40px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-200/80 dark:border-gray-700 flex items-center gap-3 text-[0.82rem] font-semibold whitespace-nowrap bottom-[120px] left-0 animate-card-float-2">
              <div className="w-[36px] h-[36px] rounded-[10px] grid place-items-center text-[1.1rem] shrink-0 bg-yellow-200 dark:bg-yellow-900/60">🏆</div>
              <div>
                <div className="text-slate-900 dark:text-white">Sertifikat Diraih</div>
                <div className="text-[0.72rem] text-slate-400 font-normal">HTML & CSS Basic</div>
              </div>
            </div>
            <div className="absolute bg-white dark:bg-gray-800 rounded-[16px] py-[0.85rem] px-[1.1rem] shadow-[0_12px_40px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-200/80 dark:border-gray-700 flex items-center gap-3 text-[0.82rem] font-semibold whitespace-nowrap bottom-[60px] right-[20px] animate-card-float-3">
              <div className="w-[36px] h-[36px] rounded-[10px] grid place-items-center text-[1.1rem] shrink-0 bg-green-200 dark:bg-green-900/60">🤖</div>
              <div className="text-slate-900 dark:text-white">Kak Gem siap membantu</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATS BANNER --- */}
      <div className="bg-slate-900 dark:bg-slate-950 py-10 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border-r border-white/10 last:border-0 max-md:border-b max-md:even:border-r-0 max-md:[&:nth-last-child(-n+2)]:border-b-0">
            <div className="font-[family-name:var(--font-gagalin)] text-[2.4rem] font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70 leading-none">10K+</div>
            <div className="text-[0.85rem] text-white/45 mt-1 font-normal">Pelajar Aktif</div>
          </div>
          <div className="text-center p-4 border-r border-white/10 last:border-0 max-md:border-b max-md:even:border-r-0 max-md:[&:nth-last-child(-n+2)]:border-b-0">
            <div className="font-[family-name:var(--font-gagalin)] text-[2.4rem] font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70 leading-none">50+</div>
            <div className="text-[0.85rem] text-white/45 mt-1 font-normal">Modul Pembelajaran</div>
          </div>
          <div className="text-center p-4 border-r border-white/10 last:border-0 max-md:border-b max-md:even:border-r-0 max-md:[&:nth-last-child(-n+2)]:border-b-0">
            <div className="font-[family-name:var(--font-gagalin)] text-[2.4rem] font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70 leading-none">4.9★</div>
            <div className="text-[0.85rem] text-white/45 mt-1 font-normal">Rating Platform</div>
          </div>
          <div className="text-center p-4 border-r border-white/10 last:border-0 max-md:border-b max-md:even:border-r-0 max-md:[&:nth-last-child(-n+2)]:border-b-0">
            <div className="font-[family-name:var(--font-gagalin)] text-[2.4rem] font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70 leading-none">98%</div>
            <div className="text-[0.85rem] text-white/45 mt-1 font-normal">Tingkat Kepuasan</div>
          </div>
        </div>
      </div>

      {/* --- FEATURES SECTION --- */}
      <section className="bg-slate-50 dark:bg-gray-900 py-16" id="fitur">
        <div className="max-w-full mx-auto px-4 md:px-16 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 md:gap-20 items-start">
            <div className="lg:sticky lg:top-[120px]">
              <div className="text-blue-600 dark:text-blue-400 font-bold tracking-wider text-lg mb-2 block font-[family-name:var(--font-kalam)]">
                Keunggulan Kami
              </div>
              <h2 className="text-3xl md:text-5xl text-slate-900 font-medium dark:text-white mb-6 font-[family-name:var(--font-gagalin)] leading-tight">
                Kenapa Memilih<br/><span className="text-blue-600 dark:text-blue-400">KELAS?</span>
              </h2>
              <p className="text-[1.05rem] text-slate-600 dark:text-slate-400 leading-[1.7] max-w-[520px]">
                Kami memadukan teknologi AI dan pedagogi modern untuk menciptakan ruang belajar yang efektif, seru, dan personal bagi setiap siswa.
              </p>
              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-start gap-3 text-[0.95rem] font-medium text-slate-700 dark:text-slate-300">
                  <div className="w-[22px] h-[22px] flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-full shrink-0 text-green-600 dark:text-green-400 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>Materi interaktif & terstruktur berbasis kurikulum</span>
                </div>
                <div className="flex items-start gap-3 text-[0.95rem] font-medium text-slate-700 dark:text-slate-300">
                  <div className="w-[22px] h-[22px] flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-full shrink-0 text-green-600 dark:text-green-400 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>Fokus pada praktik langsung dengan Live Code</span>
                </div>
                <div className="flex items-start gap-3 text-[0.95rem] font-medium text-slate-700 dark:text-slate-300">
                  <div className="w-[22px] h-[22px] flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-full shrink-0 text-green-600 dark:text-green-400 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>AI Tutor 24/7 siap membantu kapan saja</span>
                </div>
                <div className="flex items-start gap-3 text-[0.95rem] font-medium text-slate-700 dark:text-slate-300">
                  <div className="w-[22px] h-[22px] flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-full shrink-0 text-green-600 dark:text-green-400 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>Sertifikat resmi setelah menyelesaikan modul</span>
                </div>
              </div>
            </div>
            <div className="relative h-[480px] md:h-[500px] overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)' }}>
              <motion.div
                className="flex flex-col gap-5 py-2"
                animate={{ y: ["0%", "-50%"] }}
                transition={{
                  repeat: Infinity,
                  ease: "linear",
                  duration: 25
                }}
              >
                {[...features, ...features].map((feat, i) => {
                  const originalIndex = i % features.length;
                  return (
                    <div key={i} className={`bg-white dark:bg-gray-800 rounded-[24px] p-7 border border-slate-200 dark:border-gray-700 flex items-start gap-5 transition-all duration-300 cursor-pointer relative overflow-hidden group hover:border-blue-600/30 hover:shadow-[0_8px_32px_rgba(37,99,235,0.1)] hover:translate-x-[6px] mx-2 ${originalIndex === activeFeature ? 'border-blue-600/30 shadow-[0_8px_32px_rgba(37,99,235,0.1)] translate-x-[6px]' : ''}`} onMouseEnter={() => setActiveFeature(originalIndex)}>
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-blue-600 to-indigo-500 origin-top transition-transform duration-300 rounded-r-[2px] ${originalIndex === activeFeature ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}></div>
                      <div className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center shrink-0 bg-blue-200 dark:bg-blue-900/50">
                        <img src={feat.icon} alt={feat.title} className="w-8 h-8 object-contain" />
                      </div>
                      <div>
                        <div className="font-[family-name:var(--font-gagalin)] tracking-wide text-[1rem] font-bold text-slate-900 dark:text-white mb-1">{feat.title}</div>
                        <div className="text-[0.88rem] text-slate-600 dark:text-slate-400 leading-[1.6]">{feat.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MODULES SECTION --- */}
      <section id="modul" className="py-16 md:py-24 bg-white dark:bg-gray-900 relative overflow-hidden border-t border-slate-200 dark:border-gray-800">
        <div className="max-w-full mx-auto px-4 md:px-16 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">

            {/* Right Column: Text Content */}
            <div className="w-full lg:w-1/2 text-left relative z-20">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-blue-600 dark:text-blue-400 font-bold tracking-wider text-lg mb-2 block font-[family-name:var(--font-kalam)]">
                  Modul Pembelajaran
                </span>
                <h2 className="text-3xl md:text-5xl text-slate-900 font-medium dark:text-white mb-6 font-[family-name:var(--font-gagalin)] leading-tight">
                  Jelajahi Materi <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Pilihan Terbaik</span>
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed"
              >
                Kurikulum dirancang khusus oleh praktisi industri untuk mempersiapkanmu menghadapi dunia kerja. Pilih jalur yang sesuai dengan minatmu dan mulai belajar sekarang.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="hidden lg:block mt-12 relative h-32"
              >
                <div className="absolute -left-24 top-0">
                  <span className="absolute top-0 left-28 font-[family-name:var(--font-kalam)] text-[1.75rem] font-bold text-blue-600 dark:text-blue-400 -rotate-12 whitespace-nowrap z-10 drop-shadow-sm">
                    Pilih Modulmu!
                  </span>
                  <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-8 left-0 text-blue-500/70 dark:text-blue-400/70">
                    <path d="M220 20 C 160 20 120 100 20 70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" strokeDasharray="8 8" />
                    <path d="M40 50 L 15 68 L 45 85" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Scrolling Cards */}
            <div className="w-full lg:w-1/2 relative">
              {/* Decoration Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-[3rem] scale-105 z-0 blur-2xl opacity-60"></div>
              <div className="absolute inset-0 bg-white/30 dark:bg-gray-800/30 rounded-[2.5rem] scale-[1.02] z-0 border border-slate-300/50 dark:border-gray-700/50 backdrop-blur-sm"></div>

              {/* Scrolling Container */}
              <div
                className="relative z-10 h-[600px] overflow-hidden rounded-3xl p-4"
                style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
              >
                {loadingModules ? (
                  <div className="flex flex-col gap-5 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-sm mx-2 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="w-12 h-12 bg-slate-200 dark:bg-gray-700 rounded-xl"></div>
                          <div className="w-16 h-6 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                        <div className="h-6 w-3/4 bg-slate-200 dark:bg-gray-700 rounded-md mb-3 relative z-10"></div>
                        <div className="h-4 w-full bg-slate-200 dark:bg-gray-700 rounded-md mb-2 relative z-10"></div>
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-gray-700 rounded-md mb-4 relative z-10"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className="flex flex-col gap-5"
                    animate={{ y: ["0%", "-50%"] }}
                    transition={{
                      repeat: Infinity,
                      ease: "linear",
                      duration: modules.length > 0 ? modules.length * 5 : 40
                    }}
                  >
                    {/* Render modules twice for infinite loop */}
                    {[...modules, ...modules].map((modul, idx) => (
                      <div
                        key={`scroll-card-${modul._id}-${idx}`}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all group mx-2 relative overflow-hidden"
                      >
                        {/* Decorative Stacked Bubbles */}
                        <div className="absolute -top-12 -left-10 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out"></div>
                        <div className="absolute top-4 -left-6 w-20 h-20 bg-blue-100 dark:bg-blue-800/30 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out delay-75"></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <img
                              src={modul.icon?.startsWith('http') ? modul.icon : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`}
                              alt={modul.title}
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${modul.category.toLowerCase() === 'mudah' ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300' :
                            modul.category.toLowerCase() === 'sedang' ? 'bg-blue-200 text-blue-900 dark:bg-blue-900/60 dark:text-blue-300' :
                              'bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-300'
                            }`}>
                            {modul.category}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10">
                          {modul.title}
                        </h3>

                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 relative z-10">
                          {modul.overview}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 z-20 flex items-end justify-center pb-8 rounded-b-[2.5rem]">
                <Link href="/login" className="text-base font-bold text-blue-600 dark:text-blue-400 hover:underline transition-all">
                  Lihat Semua Modul
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- MENTOR SECTION --- */}
      <section id="mentor" className="relative pt-8 py-16 md:py-24 bg-slate-900 dark:bg-slate-950 overflow-hidden">
        <div className="relative z-10 max-w-full mx-auto px-4 md:px-16 lg:px-12 ">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-20">
            {/* Left Column: Carousel */}
            <div className="w-full lg:w-1/2 relative mt-4 sm:mt-0">
              {/* Mobile & Tablet: Horizontal Scroll */}
              <div className="lg:hidden w-full overflow-x-auto pb-4 hide-scrollbar-on-mobile">
                <div className="flex gap-4">
                  {mentors.map((mentor, idx) => (
                    <div key={`mobile-mentor-${idx}`} className="w-[280px] sm:w-[320px] md:w-[380px] flex-shrink-0 rounded-2xl overflow-hidden shadow-lg cursor-pointer" onClick={() => setSelectedMentor(mentor)}>
                      <div className="aspect-[4/5] w-full relative group bg-white dark:bg-gray-800">
                        <img
                          src={mentor.image}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 md:p-5 text-white w-full flex justify-between items-end">
                          <div className="flex-1">
                            <p className="text-blue-300 text-[10px] md:text-xs font-bold uppercase tracking-wider">{mentor.role}</p>
                            <h3 className="text-lg md:text-2xl font-bold truncate pr-2">{mentor.name}</h3>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-white bg-white/20 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full backdrop-blur-md whitespace-nowrap mb-0.5">
                            Lihat Bio <ArrowUpRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Vertical Carousel */}
              <div className="hidden lg:flex relative h-[600px] items-center justify-center perspective-1000 w-full">
              <motion.div 
                className="relative w-full max-w-xs sm:max-w-sm md:max-w-md h-full flex items-center justify-center touch-pan-x"
                onPanEnd={(e, info) => {
                  const swipeDistance = info.offset.y;
                  if (swipeDistance < -50) {
                    setActiveMentorIdx((prev) => (prev + 1) % mentors.length);
                  } else if (swipeDistance > 50) {
                    setActiveMentorIdx((prev) => (prev - 1 + mentors.length) % mentors.length);
                  }
                }}
              >
                {mentors.map((mentor, idx) => {
                  const position = (idx - activeMentorIdx + mentors.length) % mentors.length;
                  
                  let animateProps = {};
                  if (position === 0) { // Active
                    animateProps = { y: 0, scale: 1, zIndex: 30, opacity: 1, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" };
                  } else if (position === 1) { // Next (below)
                    animateProps = { y: 60, scale: 0.9, zIndex: 20, opacity: 0.4, boxShadow: "0 0px 0px rgba(0,0,0,0)" };
                  } else if (position === mentors.length - 1) { // Prev (above)
                    animateProps = { y: -60, scale: 0.9, zIndex: 20, opacity: 0.4, boxShadow: "0 0px 0px rgba(0,0,0,0)" };
                  } else { // Hidden
                    animateProps = { y: 0, scale: 0.6, zIndex: 10, opacity: 0, boxShadow: "0 0px 0px rgba(0,0,0,0)" };
                  }
                  
                  return (
                    <motion.div
                      key={idx}
                      animate={animateProps}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="absolute w-full rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-gray-800"
                      onClick={() => {
                        if (position === 0) setSelectedMentor(mentor);
                        else setActiveMentorIdx(idx);
                      }}
                    >
                      <div className="aspect-[4/5] w-full relative group">
                        <img
                          src={mentor.image}
                          alt={mentor.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                        <div className="absolute bottom-0 left-0 p-6 text-white w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="w-12 h-1 bg-blue-500 mb-4 rounded-full"></div>
                          <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">{mentor.role}</p>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-2xl font-bold">{mentor.name}</h3>
                            <div className="flex items-center gap-1 text-xs font-medium text-white bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Lihat Bio <ArrowUpRight size={14} />
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 delay-100 h-auto lg:h-0 lg:group-hover:h-auto overflow-hidden text-left">
                            {mentor.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
              </div>
            </div>

            {/* Right Column: Text Content */}
            <div className="w-full lg:w-1/2 text-left relative z-20">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-blue-400 font-bold tracking-wider text-lg mb-2 block font-[family-name:var(--font-kalam)]">
                  Tutor Berpengalaman
                </span>
                <h2 className="text-3xl md:text-5xl font-medium text-white mb-4 font-[family-name:var(--font-gagalin)] leading-tight">
                  Belajar Langsung dari <br /> <span className="text-blue-500">Ahlinya</span>
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-slate-300 text-lg font-medium leading-relaxed max-w-lg"
              >
                Dapatkan wawasan berharga dari praktisi industri dan akademisi berpengalaman yang siap membimbing perjalanan karirmu.
              </motion.p>

              {/* Dots Indicator */}
              <div className="hidden lg:flex gap-3 mt-8">
                {mentors.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMentorIdx(idx)}
                    className={`rounded-full transition-all duration-300 ${
                      activeMentorIdx === idx
                        ? "w-8 h-2.5 bg-blue-500"
                        : "w-2.5 h-2.5 bg-blue-500/30 hover:bg-blue-500/50"
                    }`}
                    aria-label={`Go to mentor ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
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
      <section id="CTA" className="py-16 md:py-24 bg-white dark:bg-gray-900 relative overflow-hidden border-t border-slate-200 dark:border-gray-800">
        <div className="z-10 max-w-full mx-auto px-4 md:px-16 lg:px-12">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-blue-600 dark:text-blue-400 font-bold tracking-wider text-lg mb-2 block font-[family-name:var(--font-kalam)]">
              Kata Mereka
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-5xl font-medium text-slate-900 dark:text-white mb-6 font-[family-name:var(--font-gagalin)] leading-tight"
            >
              Apa Kata Mereka?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            >
              Ribuan siswa dari berbagai jurusan telah merasakan dampak positif belajar bersama KELAS.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {testimonials.map((item, idx) => (
              <motion.div
                key={`testimonial-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="w-full bg-slate-50 dark:bg-gray-800 p-8 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex text-yellow-400">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <Quote className="text-blue-100 dark:text-blue-900/30 w-10 h-10 rotate-180" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 italic text-sm leading-relaxed min-h-[80px]">"{item.content}"</p>
                <div className="flex items-center gap-4">
                  <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full bg-gray-200" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section id="mulai" className="py-16 md:py-24 bg-slate-900 dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-900/10 blur-3xl rounded-full w-1/2 h-1/2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-full mx-auto px-4 md:px-16 lg:px-12 relative z-10 text-center">
          <div className="text-blue-400 font-bold tracking-wider text-lg mb-2 block font-[family-name:var(--font-kalam)]">
            Mulai Sekarang
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-medium text-white mb-6 font-[family-name:var(--font-gagalin)] leading-tight"
          >
            Siap Memulai Perjalanan Belajarmu?
          </motion.h2>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            Jangan buang waktu mempelajari apa yang sudah kamu tahu. Ikuti tes awal dan dapatkan kurikulum yang dipersonalisasi khusus untukmu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-full font-bold hover:bg-blue-700 transition shadow-[0_4px_14px_rgba(37,99,235,0.35)] w-full sm:w-auto">
              Daftar Gratis Sekarang 
            </Link>
            <a href="#fitur" className="inline-flex items-center justify-center bg-slate-800 text-white px-8 py-3.5 rounded-full font-bold hover:bg-slate-700 transition border border-slate-700 w-full sm:w-auto">
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3 items-center">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className={`p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center border border-slate-200 dark:border-slate-700 transform ${showScrollTop ? 'translate-y-0' : 'translate-y-[60px]'}`}
          aria-label="Toggle dark mode"
        >
          {mounted && resolvedTheme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        {/* Scroll To Top Button */}
        <button
          onClick={scrollToTop}
          className={`p-3 rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:scale-110 transform ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-white dark:bg-gray-900 border-t border-slate-200 border-t-white dark:border-gray-800 dark:border-t-gray-900 pt-16 pb-6">
        <div className="max-w-full mx-auto px-4 md:px-16 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-8 mb-12">
            <div className="md:col-span-4 lg:col-span-4">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.webp" alt="KELAS Icon" className="h-8 w-auto" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed text-left max-w-sm">
                Platform e-learning adaptif yang membantu kamu belajar lebih cepat dan efektif dengan kurikulum yang dipersonalisasi.
              </p>
            </div>

            <div className="md:col-span-4 lg:col-span-4">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Belajar Kapan Saja, Di Mana Saja</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed text-left max-w-sm mb-4">
                Unduh aplikasi KELAS untuk pengalaman belajar yang lebih mulus di perangkat mobile Anda.
              </p>
              <div className="flex flex-col sm:flex-row md:flex-col xl:flex-row gap-3">
                <button className="flex items-center gap-3 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity w-full sm:w-fit md:w-full xl:w-fit justify-center shadow-md cursor-default border border-transparent">
                  <svg className="w-6 h-6 fill-current flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186c-.185-.182-.29-.413-.309-.65V2.47c.01-.24.115-.47.309-.656zM15.3 13.51l3.484-3.485L5.753.896c.365.176.67.45.875.79l8.672 11.824zm1.425 1.425L7.996 23.64c-.37.33-.8.47-1.22.42l9.95-10.556zM4.777 22.825l10.55-10.55-10.55-10.55v21.1z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-medium leading-none opacity-80">Google Play</div>
                    <div className="text-sm font-bold leading-none mt-1">Coming Soon</div>
                  </div>
                </button>
                <button className="flex items-center gap-3 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity w-full sm:w-fit md:w-full xl:w-fit justify-center shadow-md cursor-default border border-transparent">
                  <svg className="w-6 h-6 fill-current flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.48 2.43-2.45 4.13-2.48 1.28-.03 2.5.87 3.29.87.94 0 2.25-1.09 3.93-.99 1.42.09 2.48.51 3.28 1.68-2.65 1.69-2.2 6.04 1.1 7.07-1.09 2.18-2.36 3.72-2.73 4.21zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.53-2.95 1.46-.15-1.17.32-2.35 1.05-3.15z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-medium leading-none opacity-80">App Store</div>
                    <div className="text-sm font-bold leading-none mt-1">Coming Soon</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="md:col-span-4 lg:col-span-4 flex flex-col sm:flex-row justify-start gap-8 sm:gap-12 w-full">
              <div>
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
              <div className="shrink-0">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Sosial Media</h4>
                <div className="flex flex-col gap-3">
                  <Link href="https://youtube.com/@kartinielearning" target="_blank" className="group flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 transition-colors">
                    <div className="p-2 bg-slate-100 dark:bg-gray-800 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-colors">
                      <Youtube size={16} />
                    </div>
                    <span className="font-medium">YouTube</span>
                  </Link>
                  <Link href="https://instagram.com/kartinielearning" target="_blank" className="group flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 hover:text-pink-600 transition-colors">
                    <div className="p-2 bg-slate-100 dark:bg-gray-800 rounded-full group-hover:bg-pink-50 dark:group-hover:bg-pink-900/30 transition-colors">
                      <Instagram size={16} />
                    </div>
                    <span className="font-medium">Instagram</span>
                  </Link>
                </div>
              </div>
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

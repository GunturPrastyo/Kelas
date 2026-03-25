"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useUI } from "@/context/UIContext";
import Link from "next/link"
import { authFetch } from "@/lib/authFetch";
import ModuleList from "@/components/ModuleList"
import PreTestModal from "@/components/PreTestModal";
import { BarChart2, Clock, TrendingUp, Target, PlayCircle, Rocket, ClipboardCheck, Play, BookOpen, Star, AlertTriangle } from "lucide-react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAlert } from "@/context/AlertContext";


type ModuleStatus = 'Selesai' | 'Berjalan' | 'Terkunci' | 'Belum Mulai';

interface Module {
  [x: string]: any;
  _id: string;
  title: string;
  slug: string;
  status: ModuleStatus;
  progress: number;
  icon: string;
  category: 'mudah' | 'sedang' | 'sulit';
  isHighlighted?: boolean;
  firstTopicTitle?: string; 
  order: number;
  completedTopics: number;
  totalTopics: number;
}

interface AnalyticsData {
  averageScore: number;
  weakestTopic: {
    title: string;
    topicId: string;
    modulSlug: string;
    topicSlug: string;
    score: number;
  } | null;
  completedModulesCount: number;
  dailyStreak?: number;
}

interface RecommendationData {
  continueToModule: {
    moduleTitle: string;
    moduleSlug: string;
    nextTopic: {
      title: string;
      id: string;
    } | null;
  } | null;
}

// Opsi untuk useInView, termasuk properti kustom `triggerOnce`
interface InViewOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

// --- Custom Hook untuk mendeteksi elemen di viewport ---
const useInView = (options: InViewOptions = { threshold: 0.1, triggerOnce: true }) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (ref.current && options.triggerOnce) { // TypeScript sekarang mengenali `triggerOnce`
          observer.unobserve(ref.current);
        }
      }
    }, options);

    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current) };
  }, [options]);

  return [ref, isInView] as const;
};

// --- Custom Hook untuk Animasi Hitung (dengan pemicu) ---
const useCountUp = (end: number, duration: number = 1500, start: boolean = true) => {
  const [count, setCount] = useState(0); // Memberikan nilai awal
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  useEffect(() => {
    if (!start || end === undefined || isNaN(end)) return;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const currentCount = Math.floor(easedProgress * end);
      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration, start]);

  return count;
};

export default function DashboardPage() {
  const { showAlert } = useAlert();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [studyTime, setStudyTime] = useState({ hours: 0, minutes: 0 });
  const [hasTakenPreTest, setHasTakenPreTest] = useState(false);
  // const { searchQuery } = useUI(); // Tidak lagi diperlukan
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    averageScore: 0,
    weakestTopic: null,
    completedModulesCount: 0,
    dailyStreak: 0,
  });
  const [recommendation, setRecommendation] = useState<RecommendationData>({
    continueToModule: null,
  });
  const [showPreTestModal, setShowPreTestModal] = useState(false);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Cek status Pre-Test dari API (Source of Truth)
        const preTestRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/check-pre-test`);

        if (preTestRes.ok) {
          const data = await preTestRes.json();
          if (data.hasTakenPreTest) {
            setHasTakenPreTest(true);
            setUserLevel(data.learningLevel);
          } else {
            setHasTakenPreTest(false);
            setShowPreTestModal(true);
          }
        } else {
          // Fallback ke localStorage jika API gagal
          const userRaw = localStorage.getItem('user');
          if (userRaw) {
            const parsedUser = JSON.parse(userRaw);
            const learningLevel = parsedUser.learningLevel?.toLowerCase();
            if (learningLevel) {
              setHasTakenPreTest(true);
              setUserLevel(learningLevel);
            } else {
              setShowPreTestModal(true);
            }
          }
        }

        // Mengambil semua data yang dibutuhkan secara paralel
        const [modulesRes, studyTimeRes, analyticsRes, recommendationsRes] = await Promise.all([
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/study-time`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/analytics`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/recommendations`), // <-- Fetch rekomendasi
        ]);

        // Memproses data modul
        if (modulesRes.ok) {
          const data = await modulesRes.json();
          setModules(data);
        } else {
          console.error(`Error fetching modules: ${modulesRes.status} ${modulesRes.statusText}`);
        }

        // Memproses data waktu belajar
        if (studyTimeRes.ok) {
          const data = await studyTimeRes.json();
          const totalSeconds = data.totalTimeInSeconds || 0;
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          setStudyTime({ hours, minutes });
        } else {
          console.error(`Error fetching study time: ${studyTimeRes.status} ${studyTimeRes.statusText}`);
        }

        // Memproses data analitik
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(prev => ({
            ...prev,
            averageScore: data.averageScore || 0,
            weakestTopic: data.weakestTopic || null,
            dailyStreak: data.dailyStreak || 0,
          }));
        } else {
          console.error(`Error fetching analytics: ${analyticsRes.status} ${analyticsRes.statusText}`);
        }

        // Memproses data rekomendasi
        if (recommendationsRes.ok) {
          const data = await recommendationsRes.json();
          setRecommendation(data);
        } else {
          console.error(`Error fetching recommendations: ${recommendationsRes.status} ${recommendationsRes.statusText}`);
        }

      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const personalizedModules = useMemo(() => {
    const categoryMap: Record<string, string> = { 
      mudah: 'dasar', 
      sedang: 'menengah', 
      sulit: 'lanjut',
      dasar: 'dasar',
      menengah: 'menengah',
      lanjut: 'lanjut',
      lanjutan: 'lanjut'
    };

    const normalizedUserLevel = userLevel?.toLowerCase();

    // Pastikan modul diurutkan berdasarkan 'order' sebelum diproses lebih lanjut
    const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sortedModules.map(modul => {
      const mappedCategory = categoryMap[modul.category?.toLowerCase()] || 'dasar';
      let status: ModuleStatus;
      let isLocked = userLevel === null; // Kunci semua jika belum pre-test

      if (normalizedUserLevel) {
        if (normalizedUserLevel === 'lanjut' || normalizedUserLevel === 'lanjutan') {
          isLocked = false;
        } else if (normalizedUserLevel === 'menengah') {
          isLocked = mappedCategory === 'lanjut';
        } else if (normalizedUserLevel === 'dasar') {
          isLocked = mappedCategory !== 'dasar';
        }
      }

      if (modul.progress === 100) {
        status = 'Selesai';
      } else if (modul.progress > 0) {
        status = 'Berjalan';
      } else {
        status = 'Belum Mulai';
      }

      if (isLocked && status !== 'Selesai') {
        status = 'Terkunci';
      }

      return { ...modul, status, isLocked }; // Hapus filter dari sini
    });
  }, [modules, userLevel]);

  // Hitung modul yang selesai setelah personalizedModules dihitung
  useEffect(() => {
    const completedCount = personalizedModules.filter(m => m.status === 'Selesai').length;
    setAnalytics(prev => ({ ...prev, completedModulesCount: completedCount }));
  }, [personalizedModules]);

  const overallProgress = useMemo(() => {
    if (modules.length === 0) return 0;
    const totalAllTopics = modules.reduce((sum, module) => sum + (module.totalTopics || 0), 0);
    const totalCompletedTopics = modules.reduce((sum, module) => sum + (module.completedTopics || 0), 0);
    if (totalAllTopics === 0) return 0;
    return Math.round((totalCompletedTopics / totalAllTopics) * 100);
  }, [modules]);

  // --- Inisialisasi hook untuk setiap kartu ---
  const [progressCardRef, isProgressCardInView] = useInView({ threshold: 0.5, triggerOnce: true });
  const [studyTimeCardRef, isStudyTimeCardInView] = useInView({ threshold: 0.5, triggerOnce: true });
  const [analyticsCardRef, isAnalyticsCardInView] = useInView({ threshold: 0.5, triggerOnce: true });

  // --- Gunakan hook animasi dengan pemicu dari useInView ---
  const animatedOverallProgress = useCountUp(overallProgress, 1500, isProgressCardInView);
  const animatedStudySeconds = useCountUp(studyTime.hours * 3600 + studyTime.minutes * 60, 1500, isStudyTimeCardInView);
  const animatedHours = Math.floor(animatedStudySeconds / 3600);
  const animatedMinutes = Math.floor((animatedStudySeconds % 3600) / 60);

  // --- Tour Guide Effect ---
  useEffect(() => {
    if (!loading && !showPreTestModal) {
      // Ambil ID user dari localStorage untuk membuat key unik per user
      const userRaw = localStorage.getItem('user');
      let userId = '';
      if (userRaw) {
        try {
          const parsedUser = JSON.parse(userRaw);
          userId = parsedUser._id || parsedUser.id;
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }

      const tourKey = userId ? `hasSeenDashboardTour-${userId}` : 'hasSeenDashboardTour';
      const hasSeenTour = localStorage.getItem(tourKey);
      
      if (!hasSeenTour) {
        let isDestroying = false;

        const driverObj = driver({
          showProgress: true,
          animate: true,
          steps: [
            { 
                element: '#dashboard-stats', 
                popover: { 
                    title: 'Selamat Datang di Dashboard!', 
                    description: 'Ini adalah pusat kendali belajarmu. Di sini kamu bisa melihat progres, waktu belajar, dan rekomendasi materi.' 
                } 
            },
            { 
                element: '#pre-test-card', 
                popover: { 
                    title: 'Langkah 1: Tes Awal', 
                    description: 'Sebelum mulai, kerjakan Tes Awal ini dulu ya! Hasilnya akan menentukan modul mana yang terbuka untukmu.' 
                } 
            },
            { 
                element: '#recommendation-card', 
                popover: { 
                    title: 'Rekomendasi Spesial', 
                    description: 'Perhatikan bagian ini! Bagian ini adalah tempat untuk melihat rekomendasi materi yang paling kami sarankan untuk kamu pelajari saat ini.' 
                } 
            },
            { 
                element: '#learning-path-section', 
                popover: { 
                    title: 'Jalur Pembelajaran', 
                    description: 'Daftar semua modul ada di sini. Mulailah dari modul yang statusnya "Mulai" atau "Berjalan".' 
                } 
            }
          ],
          onDestroyStarted: () => {
             if (isDestroying) return;

             if (!driverObj.hasNextStep()) {
                localStorage.setItem(tourKey, 'true');
                driverObj.destroy();
             } else {
                const activeIndex = driverObj.getActiveIndex();
                driverObj.destroy();
                setTimeout(() => {
                    showAlert({
                        type: 'confirm',
                        title: 'Akhiri Tur?',
                        message: 'Apakah kamu yakin ingin mengakhiri tur pengenalan ini?',
                        confirmText: 'Ya, Akhiri',
                        cancelText: 'Lanjut Tur',
                        onConfirm: () => {
                            isDestroying = true;
                            localStorage.setItem(tourKey, 'true');
                        },
                        onCancel: () => {
                            if (typeof activeIndex === 'number') {
                                driverObj.drive(activeIndex);
                            }
                        }
                    });
                }, 100);
             }
          },
        });

        // Delay sedikit untuk memastikan elemen sudah ter-render
        setTimeout(() => {
            driverObj.drive();
        }, 1500);
      }
    }
  }, [loading, showPreTestModal]);

  return (
    <>
      <section id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-22">
        {/* Progres Belajar */}
        <div
          ref={progressCardRef}
          className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between overflow-hidden border border-slate-200 dark:border-slate-800 border-b-[6px] border-l-2 border-b-slate-200 border-l-slate-200 dark:border-b-slate-700 dark:border-l-slate-700"
        >
          {/* Konten Teks */}
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <img src="/progress1.webp" width={128} height={128} className="w-full h-full object-contain p-1" alt="" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Progres Belajar</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${overallProgress}%` }}></div>
              </div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">{animatedOverallProgress}%</p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {overallProgress === 0 ? "Belum ada progres, yuk mulai!" :
                overallProgress < 25 ? "Awal yang baik, lanjutkan!" :
                  overallProgress < 50 ? "Semangat! Kamu sudah melangkah jauh." :
                    overallProgress < 75 ? "Hebat! Sudah lebih dari setengah jalan." :
                      overallProgress < 100 ? "Sedikit lagi! Kamu hampir menyelesaikannya." :
                        "Luar biasa! Semua materi telah selesai."}
            </p>
          </div>

          {/* Gambar */}
          <div className="flex-shrink-0 flex items-center justify-center max-w-[40%]">
            <img
              src="/progress.webp"
              alt="Progress Illustration"
              width={256}
              height={256}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>
        </div>

        {/* Jam Belajar */}
        <div
          ref={studyTimeCardRef}
          className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between overflow-hidden border border-slate-200 dark:border-slate-800 border-b-[6px] border-l-2 border-b-slate-200 border-l-slate-200 dark:border-b-slate-700 dark:border-l-slate-700"
        >
          
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <img src="/clock2.webp" width={128} height={128} className="w-full h-full object-contain p-1" alt="" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Jam Belajar</h2>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-blue-700 dark:text-blue-400">{animatedHours} Jam {animatedMinutes} Mnt</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Total waktu belajar hingga saat ini
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center justify-center max-w-[40%]">
            <img
              src="/clock.webp"
              alt="Clock Illustration"
              width={256}
              height={256}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>
        </div>

        {/* Rekomendasi */}
        <div id="recommendation-card" className="relative bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between md:col-span-2 lg:col-span-1 overflow-hidden border border-slate-200 dark:border-slate-800 border-b-[6px] border-l-2 border-b-slate-200 border-l-slate-200 dark:border-b-slate-700 dark:border-l-slate-700">
          {/* Decorative Bubbles */}
          {/* <div className="absolute buttom-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/80 to-transparent dark:from-green-800/20 rounded-tl-[100px] -ml-64 -mb-32 transition-transform duration-500 group-hover:scale-110" /> */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-200 dark:bg-gray-900/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-200 dark:bg-gray-900/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col justify-center flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <img src="/target.webp" width={128} height={128} className="w-full h-full object-contain p-1" alt="" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Rekomendasi Belajar
              </h2>
            </div>

            {recommendation?.continueToModule ? (
              <Link
                href={
                  recommendation.continueToModule.nextTopic
                    ? `/modul/${recommendation.continueToModule.moduleSlug}#${recommendation.continueToModule.nextTopic.id}`
                    : `/modul/${recommendation.continueToModule.moduleSlug}`
                }
                className="relative overflow-hidden block p-3 border border-slate-200 dark:border-slate-600 border-b-[5px] border-b-blue-500 border-l-[2px] border-l-blue-500 dark:border-l-gray-600  dark:border-b-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-50/60 dark:hover:bg-gray-700 cursor-pointer transition-all group shadow-sm hover:shadow-md"
              >
                {/* Background Icon Watermark */}
                <Rocket className="absolute -bottom-3 -right-3 w-20 h-20 text-blue-500 opacity-[0.08] group-hover:scale-110 group-hover:opacity-20 transition-all duration-500 -rotate-12 pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">
                      Mulai : {recommendation.continueToModule.moduleTitle}
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Rekomendasi topik selanjutnya adalah{" "}
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        {recommendation.continueToModule.nextTopic?.title || "Topik pertama"}
                      </span>.
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 group-hover:bg-blue-700 transition-colors text-white shadow-md">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative overflow-hidden p-4 border border-slate-200 dark:border-slate-800 border-l-[5px] border-l-blue-500 dark:border-l-gray-600 rounded-xl bg-white/60 dark:bg-gray-900/50 text-center shadow-sm">
                {/* Background Icon Watermark */}
                <Target className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-500/10 dark:text-gray-400/10 rotate-12 pointer-events-none" />
                
                <div className="relative z-10">
                  {!hasTakenPreTest || overallProgress === 0 ? (
                    <>
                     
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Kerjakan Tes Awal dulu untuk membuka materi yang pas buat kamu, atau mulai dari modul dasar.
                      </p>
                    </>
                  ) : overallProgress === 100 ? (
                    <>
                     
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Kamu telah menyelesaikan semua materi dengan sangat baik. Pertahankan semangat belajarmu!
                      </p>
                    </>
                  ) : (
                    <>
                     
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Mantap! Lanjutkan progres belajarmu dan eksplor topik-topik baru yang menantang.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>




        </div>
      </section>





      {/* Pre-Test + Analitik */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Pre-Test */}
        <div id="pre-test-card" className="lg:col-span-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 border-b-[6px] border-l-2 border-b-slate-200 border-l-slate-200 dark:border-b-slate-700 dark:border-l-slate-700">
          {/* Kiri: teks dan tombol */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-500 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img
                  src="/test-pre-test.webp"
                  width={128}
                  height={128}
                  className="object-contain p-0.5"
                  alt="Ikon Pre-Test"
                />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Tes Awal
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-3 text-xs sm:text-sm leading-relaxed">
              Ikuti tes awal untuk memetakan level pengetahuanmu. <span className="font-medium text-red-600 dark:text-red-500">Hasilnya akan menentukan jalur belajar yang paling sesuai untukmu.</span>
            </p>
            <Link
              href="/pre-test"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              {hasTakenPreTest ? 'Lihat Hasil' : 'Mulai Tes Awal'}
            </Link>
          </div>

          {/* Kanan: ilustrasi */}
          <div className="flex-shrink-0">
            <img
              src="/pre-tes.webp"
              alt="Quiz Illustration"
              width={140}
              height={120}
              className="w-28 h-28 sm:w-40 sm:h-40 object-contain"
            />
          </div>
        </div>




        {/* Analitik */}
        {(() => {
          const animatedCompletedModules = useCountUp(analytics.completedModulesCount ?? 0, 1500, isAnalyticsCardInView);
          const animatedAverageScore = useCountUp(parseFloat((analytics.averageScore || 0).toFixed(2)), 1500, isAnalyticsCardInView);
          return (
            <div
              ref={analyticsCardRef}
              className="lg:col-span-3 max-w-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-800 border-b-[6px] border-l-2 border-b-slate-200 border-l-slate-200 dark:border-b-slate-700 dark:border-l-slate-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 rounded-3xl w-10 h-10 flex items-center justify-center">
                  <img src="/analisis.webp" width={128} height={128} className="w-full h-full object-contain p-1" alt="" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Analitik Belajar
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 text-left sm:text-center">
                {/* Wrapper untuk 2 kartu atas */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-4 text-center">
                  {/* Modul Selesai */}
                  <div className="relative overflow-hidden group border border-slate-200 dark:border-slate-800 border-l-[2px] border-b-[6px] border-b-blue-500 border-l-blue-500 dark:border-b-gray-600 dark:border-l-gray-600 p-3 lg:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-md hover:shadow-lg transition">
                    <BookOpen className="absolute -bottom-2 -right-2 w-16 h-16 text-blue-500 opacity-[0.1] group-hover:scale-110 group-hover:opacity-20 transition-all duration-500 -rotate-12 pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="bg-blue-600 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center">
                        <img src="/book.webp" width={256} height={256} className="w-full h-full object-contain p-1" alt="" />
                      </div>
                      <p className="text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {animatedCompletedModules ?? 0} <span className="text-sm lg:text-xl text-gray-500 dark:text-gray-400">/ {modules.length}</span>
                      </p>
                      <p className="text-xs lg:text-sm font-semibold text-gray-600 dark:text-gray-300">Modul Selesai</p>
                    </div>
                  </div>
                  {/* Rata-rata Skor */}
                  <div className="relative overflow-hidden group border border-slate-200 dark:border-slate-800 border-l-[2px] border-l-blue-500 border-b-[6px] border-b-blue-500 dark:border-l-gray-600 dark:border-b-gray-600 p-3 sm:lg:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-md hover:shadow-lg transition">
                    <Star className="absolute -bottom-2 -right-2 w-16 h-16 text-blue-500 opacity-[0.1] group-hover:scale-110 group-hover:opacity-20 transition-all duration-500 -rotate-12 pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="bg-blue-600 rounded-full w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center">
                        <img src="/score.webp" width={256} height={256} className="w-full h-full object-contain p-1" alt="" />
                      </div>
                      <p className="text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-400">{loading ? '...' : `${animatedAverageScore ?? 0}%`}</p>
                      <p className="text-xs lg:text-sm font-semibold text-gray-600 dark:text-gray-300">Rata-rata Skor</p>
                    </div>
                  </div>
                </div>

                {/* Topik Terlemah */}
                <Link
                  href={analytics.weakestTopic ? `/modul/${analytics.weakestTopic.modulSlug}#${analytics.weakestTopic.topicId}` : "#"}
                  className={`relative overflow-hidden border border-slate-200 dark:border-slate-800 border-l-[2px] border-b-[6px] border-l-blue-500 border-b-blue-500 dark:border-l-gray-600 sm:col-span-3 max-w-full p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-md transition ${analytics.weakestTopic ? "hover:shadow-lg cursor-pointer group" : "cursor-default"}`}
                >
                  <AlertTriangle className="absolute -bottom-3 -right-3 w-24 h-24 text-blue-500 opacity-[0.1] group-hover:scale-110 group-hover:opacity-20 transition-all duration-500 -rotate-12 pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-row items-center justify-between gap-4 h-full text-left">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="bg-blue-600 rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <img src="/thunder.png" width={128} height={128} className="w-8 h-8 object-contain p-1" alt="Topik Terlemah" />
                    </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">Topik Terlemah</p>
                      <p
                          className="font-bold text-blue-800 dark:text-blue-300 text-sm sm:text-base lg:text-md leading-tight line-clamp-2"
                        title={analytics.weakestTopic?.title || 'Belum ada'}
                      >
                        {analytics.weakestTopic?.title || 'Belum ada'}
                      </p>
                      </div>
                    </div>

                    {analytics.weakestTopic && (
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors text-white shadow-md">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 fill-current" />
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          )
        })()}
      </section>

      {/* Learning Path - Sekarang dengan data dinamis */}
      <div id="learning-path-section">
        <ModuleList 
          title="Jalur Pembelajaran" 
          allModules={personalizedModules} 
          filter={() => true} 
          loading={loading} 
        />
      </div>

      {/* Modal Pop-up Pre-Test */}
      <PreTestModal
        isOpen={showPreTestModal}
        onClose={() => setShowPreTestModal(false)}
      />
    </>
  )
}
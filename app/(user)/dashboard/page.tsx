"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useUI } from "@/context/UIContext";
import Link from "next/link"
import { authFetch } from "@/lib/authFetch";
import ModuleList from "@/components/ModuleList"
import PreTestModal from "@/components/PreTestModal";
import { BarChart2, Clock, TrendingUp, Target, PlayCircle, Rocket, ClipboardCheck } from "lucide-react";


type ModuleStatus = 'Selesai' | 'Berjalan' | 'Terkunci' | 'Belum Mulai';

interface Module {
  [x: string]: any;
  _id: string;
  title: string;
  slug: string;
  // status akan dihitung di client-side, jadi tidak perlu dari API
  status: ModuleStatus;
  progress: number;
  icon: string;
  category: 'mudah' | 'sedang' | 'sulit';
  isHighlighted?: boolean;
  firstTopicTitle?: string; // Menambahkan properti yang hilang
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

  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-22">
        {/* Progres Belajar */}
        <div
          ref={progressCardRef}
          className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between overflow-hidden border border-slate-200 dark:border-slate-800"
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
          className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between overflow-hidden border border-slate-200 dark:border-slate-800"
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
        <div className="relative bg-gradient-to-br border border-slate-200 dark:border-slate-800 border-r-[5px] border-r-blue-500 dark:border-r-gray-600 from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between md:col-span-2 lg:col-span-1 overflow-hidden ">
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
                className="block p-3 border border-slate-200 dark:border-slate-600 border-l-[5px] border-l-blue-500 dark:border-l-gray-600 rounded-2xl bg-white dark:bg-gray-800 hover:bg-blue-50/60 dark:hover:bg-gray-700 cursor-pointer transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-2">

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
                  {/* <PlayCircle className="w-10 h-10 text-green-800/70 dark:text-green-400/70 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex-shrink-0 mt-2" /> */}
                </div>
              </Link>
            ) : (
              <div className="p-4 border border-slate-200 dark:border-slate-800 border-l-[5px] border-l-green-500 dark:border-l-gray-600 rounded-2xl bg-white/60 dark:bg-gray-900/50 text-center shadow-sm">
                {!hasTakenPreTest || overallProgress === 0 ? (
                  <>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Yuk, Mulai Belajarmu!</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Kerjakan <b>Pre-Test</b> dulu untuk membuka materi yang pas buat kamu, atau mulai dari modul dasar.
                    </p>
                  </>
                ) : overallProgress === 100 ? (
                  <>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Luar Biasa! Semua Modul Selesai</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Kamu telah menyelesaikan semua materi dengan sangat baik. Pertahankan semangat belajarmu!
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Semua modul rekomendasi telah kamu mulai</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Mantap! Lanjutkan progres belajarmu dan eksplor topik-topik baru yang menantang.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>




        </div>
      </section>





      {/* Pre-Test + Analitik */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pre-Test */}
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-800">
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
                Pre-Test
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-3 text-xs sm:text-sm leading-relaxed">
              Ikuti pre-test untuk memetakan level pengetahuanmu. <span className="font-medium text-red-600 dark:text-red-500">Hasilnya akan menentukan jalur belajar yang paling sesuai untukmu.</span>
            </p>
            <Link
              href="/pre-test"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              {hasTakenPreTest ? 'Lihat Hasil' : 'Mulai Pre-Test'}
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
              className="max-w-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
                  <img src="/analisis.webp" width={128} height={128} className="w-full h-full object-contain p-1" alt="" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Analitik Belajar
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
                {/* Wrapper untuk 2 kartu atas */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                  {/* Modul Selesai */}
                  <div className="  border border-slate-200 dark:border-slate-800 border-l-[8px] border-l-blue-500 dark:border-l-gray-600 p-4 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 dark:from-gray-700 dark:to-gray-800 shadow-md hover:shadow-lg transition">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                        <img src="/book.webp" width={256} height={256} className="w-full h-full object-contain p-1" alt="" />
                      </div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {animatedCompletedModules ?? 0} <span className="text-xl text-gray-500 dark:text-gray-400">/ {modules.length}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Modul Selesai</p>
                    </div>
                  </div>
                  {/* Rata-rata Skor */}
                  <div className="border border-slate-200 dark:border-slate-800 border-l-[8px] border-l-blue-500 dark:border-l-gray-600 p-4 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 dark:from-gray-700 dark:to-gray-800 shadow-md hover:shadow-lg transition">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                        <img src="/score.webp" width={256} height={256} className="w-full h-full object-contain p-1" alt="" />
                      </div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{loading ? '...' : `${animatedAverageScore ?? 0}%`}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Skor</p>
                    </div>
                  </div>
                </div>

                {/* Topik Terlemah */}
                <Link
                  href={analytics.weakestTopic ? `/modul/${analytics.weakestTopic.modulSlug}#${analytics.weakestTopic.topicId}` : "#"}
                  className={`border border-slate-200 dark:border-slate-800 border-l-[8px] border-l-blue-500 dark:border-l-gray-600 col-span-2 sm:col-span-1 max-w-full p-4 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 dark:from-gray-700 dark:to-gray-800 shadow-md transition ${analytics.weakestTopic ? "hover:shadow-lg cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex flex-col items-center justify-center gap-2 break-words h-full text-center">
                    <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <img src="/thunder.png" width={256} height={256} className="w-full h-full object-contain p-1" alt="Topik Terlemah" />
                    </div>
                    <div className="min-w-0 w-11/12">
                      <p
                        className="font-bold text-blue-700 dark:text-blue-400 w-full text-md truncate sm:truncate-none whitespace-normal sm:whitespace-nowrap"
                        title={analytics.weakestTopic?.title || 'Belum ada'}
                      >
                        {analytics.weakestTopic?.title || 'Belum ada'}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-300">Topik Terlemah</p>
                    </div>
                  </div>
                </Link>

                {/* Kartu Topik Terlemah yang lama (sekarang digabung) */}
                {/* <Link
                  href={
                    analytics.weakestTopic
                      ? `/modul/${analytics.weakestTopic.modulSlug}#${analytics.weakestTopic.topicId}`
                      : "#"
                  }
                  className={`max-w-full p-4 rounded-lg bg-gradient-to-br from-red-100 to-red-200 dark:from-gray-700 dark:to-gray-800 shadow-md transition ${analytics.weakestTopic ? "hover:shadow-lg cursor-pointer" : "cursor-default"
                    }`}
                >
                </Link> */}
              </div>
            </div>
          )
        })()}
      </section>

      {/* Learning Path - Sekarang dengan data dinamis */}
      {loading ? (
        <div className="text-center p-8">Memuat modul...</div>
      ) : (
        // Gabungkan semua modul ke dalam satu section "Jalur Belajar"
        <ModuleList title="Jalur Pembelajaran" allModules={personalizedModules} filter={() => true} />
      )}

      {/* Modal Pop-up Pre-Test */}
      <PreTestModal
        isOpen={showPreTestModal}
        onClose={() => setShowPreTestModal(false)}
      />
    </>
  )
}
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useUI } from "@/context/UIContext";
import Image from "next/image";
import Link from "next/link"
import { authFetch } from "@/lib/authFetch";
import ModuleList from "@/components/ModuleList"
import { BarChart2, ClipboardCheck, Clock, TrendingUp, Target, PlayCircle, Rocket } from "lucide-react";


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
  const { searchQuery } = useUI();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    averageScore: 0,
    weakestTopic: null,
    completedModulesCount: 0,
  });
  const [recommendation, setRecommendation] = useState<RecommendationData>({
    continueToModule: null,
  });


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Mengambil semua data yang dibutuhkan secara paralel
        const [preTestRes, modulesRes, studyTimeRes, analyticsRes, recommendationsRes] = await Promise.all([
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/latest-by-type/pre-test-global`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/study-time`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/analytics`),
          authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/recommendations`), // <-- Fetch rekomendasi
        ]);

        // Memproses data pre-test
        if (preTestRes.ok) {
          const preTestResult = await preTestRes.json();
          if (preTestResult) {
            setHasTakenPreTest(true);
            if (preTestResult.score >= 75) setUserLevel('lanjut');
            else if (preTestResult.score >= 40) setUserLevel('menengah');
            else setUserLevel('dasar');

            // Sinkronkan ke localStorage untuk akses cepat
            const userRaw = localStorage.getItem('user');
            if (userRaw) {
              const parsedUser = JSON.parse(userRaw);
              const resultKey = `pretest_result_${parsedUser._id}`;
              localStorage.setItem(resultKey, JSON.stringify(preTestResult));
            }
          }
        } else {
          console.error(`Error fetching pre-test data: ${preTestRes.status} ${preTestRes.statusText}`);
        }

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
    const categoryMap = { mudah: 'dasar', sedang: 'menengah', sulit: 'lanjut' };

    // Pastikan modul diurutkan berdasarkan 'order' sebelum diproses lebih lanjut
    const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sortedModules.map(modul => {
      const mappedCategory = categoryMap[modul.category as keyof typeof categoryMap];
      let status: ModuleStatus;
      let isLocked = userLevel === null; // Kunci semua jika belum pre-test

      if (userLevel) {
        if (userLevel === 'lanjut') isLocked = false;
        else if (userLevel === 'menengah') isLocked = mappedCategory === 'lanjut';
        else if (userLevel === 'dasar') isLocked = mappedCategory !== 'dasar';
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

      return { ...modul, status };
    }).filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [modules, userLevel, searchQuery]);

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
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Progres Belajar */}
        <div
          ref={progressCardRef}
          className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between overflow-hidden"
        >
          {/* Konten Teks */}
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <Image src="/progress1.png" width={30} height={30} className="w-full h-full object-contain p-1" alt="" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Progres Belajar</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${overallProgress}%` }}></div>
              </div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">{animatedOverallProgress}%</p>
            </div>
          </div>

          {/* Gambar */}
          <div className="flex-shrink-0 flex items-center justify-center max-w-[40%]">
            <Image
              src="/progress.png"
              alt="Progress Illustration"
              width={128}
              height={128}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>
        </div>

        {/* Jam Belajar */}
        <div
          ref={studyTimeCardRef}
          className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between overflow-hidden"
        >
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <Image src="/clock2.png" width={30} height={30} className="w-full h-full object-contain p-1" alt="" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Jam Belajar</h2>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-400">{animatedHours} Jam {animatedMinutes} Mnt</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total waktu belajar hingga saat ini
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center justify-center max-w-[40%]">
            <Image
              src="/clock.png"
              alt="Clock Illustration"
              width={128}
              height={128}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>
        </div>

        {/* Rekomendasi */}
        <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex items-center justify-between md:col-span-2 lg:col-span-1 overflow-hidden">
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <Image src="/target.png" width={30} height={30} className="w-full h-full object-contain p-1" alt="" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rekomendasi
              </h2>
            </div>

            {recommendation.continueToModule ? (
              <Link
                href={`/modul/${recommendation.continueToModule.moduleSlug}`}
                className="block p-5 border border-green-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 hover:bg-green-50/60 dark:hover:bg-gray-700 cursor-pointer transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-2">
                  <PlayCircle className="w-8 h-8 text-green-500/70 dark:text-green-500/70 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-green-700 dark:text-green-400 group-hover:text-green-800 dark:group-hover:text-green-300 transition-colors">
                      Mulai: {recommendation.continueToModule.moduleTitle}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Rekomendasi topik selanjutnya adalah{" "}
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        {recommendation.continueToModule.nextTopic?.title || "Topik pertama"}
                      </span>.
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/60 dark:bg-gray-900/50 text-center shadow-sm">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Semua modul rekomendasi telah kamu mulai 🎉
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Mantap! Lanjutkan progres belajarmu dan eksplor topik-topik baru yang menantang.
                </p>
              </div>
            )}
          </div>




        </div>
      </section>





      {/* Pre-Test + Analitik */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pre-Test */}
        <div className="bg-gradient-to-r from-blue-100 via-indigo-200 to-indigo-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 rounded-xl shadow flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Teks */}
          <div className="flex-1 text-left">
            <h2 className="text-lg sm:text-2xl font-semibold mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-7 h-7 text-blue-700 dark:text-blue-400" />
              Pre-Test Awal
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
              Ikuti pre-test untuk memetakan level pengetahuanmu. <br />
              <span className="text-red-600 dark:text-red-400 font-medium">Hasil pre-test menentukan jalur belajar wajib.</span>
            </p>
            <Link href="/pre-test" className="inline-block px-4 sm:px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
              {hasTakenPreTest ? 'Lihat Hasil' : 'Mulai Pre-Test'}
            </Link>
          </div>
          {/* Ilustrasi */}
          <div className="flex-shrink-0 max-w-full">
            <Image src="/pre-tes.png" alt="Quiz Illustration" width={160} height={160} className="w-24 h-24 sm:w-40 sm:h-40 object-contain" />
          </div>
        </div>

        {/* Analitik */}
        {(() => {
          const animatedCompletedModules = useCountUp(analytics.completedModulesCount ?? 0, 1500, isAnalyticsCardInView);
          const animatedAverageScore = useCountUp(parseFloat((analytics.averageScore || 0).toFixed(2)), 1500, isAnalyticsCardInView);
          return (
            <div
              ref={analyticsCardRef}
              className="max-w-full bg-gradient-to-br from-indigo-200 via-purple-200 to-violet-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-xl shadow"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-indigo-800 dark:text-indigo-300" />
                Analitik Belajar
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {/* Modul Selesai */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-800 shadow-md hover:shadow-lg transition">
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                      <Image src="/book.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="" />
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{animatedCompletedModules ?? 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Modul Selesai</p>
                  </div>
                </div>
                {/* Rata-rata Skor */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-gray-700 dark:to-gray-800 shadow-md hover:shadow-lg transition">
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-green-600 rounded-full w-10 h-10 flex items-center justify-center">
                      <Image src="/score.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="" />
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{loading ? '...' : `${animatedAverageScore ?? 0}%`}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Skor</p>
                  </div>
                </div>
                {/* Topik Terlemah */}
                <Link
                  href={
                    analytics.weakestTopic
                      ? `/modul/${analytics.weakestTopic.modulSlug}#${analytics.weakestTopic.topicId}`
                      : "#"
                  }
                  className={`max-w-full p-4 rounded-lg bg-gradient-to-br from-red-100 to-red-200 dark:from-gray-700 dark:to-gray-800 shadow-md transition ${analytics.weakestTopic ? "hover:shadow-lg cursor-pointer" : "cursor-default"
                    }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2 break-words h-full text-center">
                    <div className="bg-red-600 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <Image src="/thunder.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="Topik Terlemah" />
                    </div>
                    <div className="min-w-0 w-11/12">
                      <p
                        className={`font-bold text-red-700 dark:text-red-400 w-full whitespace-normal ${(analytics.weakestTopic?.title?.length || 0) > 25 ? 'text-sm' : 'text-md'
                          }`}
                      >
                        {analytics.weakestTopic?.title || 'Belum ada'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Topik Terlemah</p>
                    </div>
                  </div>
                </Link>
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
    </>
  )
}
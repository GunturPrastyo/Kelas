"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image"; 
import { useRouter } from "next/navigation";
import { Award, TrendingUp, TrendingDown, LayoutDashboard, Activity, BarChartHorizontal, AlertTriangle, Users, Target, Play } from "lucide-react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

interface SummaryData {
  completedModules: number;
  totalModules: number;
  averageScore: number;
  studyHours: number;
  studyMinutes: number;
  dailyStreak: number;
}

interface ModuleScoreData {
  moduleTitle: string;
  score: number;
}

interface ComparisonData {
  labels: string[];
  userScores: number[];
  classAverages: number[];
  rank: number;
  totalParticipants: number;
  scoreDifference: number;
}

interface RecommendationData {
  repeatModule: {
    moduleSlug: string;
    moduleTitle: string;
    moduleIcon: string;
    moduleScore: number;
    weakestTopic: {
      title: string;
    } | null;
    moduleSlug: string;
    weakestTopicDetails: {
      _id: string;
      slug: string;
    } | null;
    allTopicsMastered?: boolean; // Tambahkan flag ini
  } | null;
  deepenTopic: {
    topicId: string;
    [key: string]: any; // Allow other properties
  } | null;
  continueToModule: {
    moduleTitle: string;
    moduleSlug: string;
    moduleIcon: string;
    nextTopic: {
      title: string;
      id: string;
    } | null;
  } | null;
}

interface WeakTopicData {
  topicTitle: string;
  score: number;
  status: "Perlu review" | "Butuh latihan" | "Sudah bagus";
}

// Opsi untuk useInView, termasuk properti kustom `triggerOnce`
interface InViewOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

// --- Custom Hook untuk mendeteksi elemen di viewport ---
const useInView = (options: InViewOptions = { threshold: 0.1, triggerOnce: true }) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement | HTMLCanvasElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (ref.current && options.triggerOnce) {
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
  const frameRef = useRef<number | undefined>(); // Mengizinkan undefined
  const startTimeRef = useRef<number | undefined>(); // Mengizinkan undefined

  const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  useEffect(() => {
    if (!start || end === undefined || isNaN(end)) return;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === undefined) {
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

    startTimeRef.current = undefined;
    frameRef.current = requestAnimationFrame(animate);

    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) };
  }, [end, duration, start]);

  return count;
};

export default function AnalitikBelajarPage() {
  const router = useRouter();
  const [summaryCardRef, isSummaryCardInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [chartAktivitasRef, isChartAktivitasInView] = useInView({ threshold: 0.5, triggerOnce: true });
  const [chartNilaiRef, isChartNilaiInView] = useInView({ threshold: 0.5, triggerOnce: true });
  const [chartPerbandinganRef, isChartPerbandinganInView] = useInView({ threshold: 0.5, triggerOnce: true });
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([]);
  const [moduleScores, setModuleScores] = useState<ModuleScoreData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weakTopicSearch, setWeakTopicSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // --- 1️⃣ FETCH DATA SEKALI SAJA ---
  useEffect(() => {
    const fetchAllAnalytics = async () => {
      try {
        setLoading(true);

        const [progressRes, analyticsRes, weeklyActivityRes, moduleScoresRes, comparisonRes, recommendationsRes, weakTopicsRes] =
          await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`, { credentials: "include" }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/analytics`, { credentials: "include" }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/weekly-activity`, { credentials: "include" }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/module-scores`, { credentials: "include" }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/comparison-analytics`, { credentials: "include" }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/recommendations`, { credentials: "include" }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/topics-to-reinforce`, { credentials: "include" }),
          ]);
        
        // Handle potential errors from individual fetches
        if (!progressRes.ok || !analyticsRes.ok || !weeklyActivityRes.ok || !moduleScoresRes.ok || !comparisonRes.ok || !recommendationsRes.ok || !weakTopicsRes.ok) {
          throw new Error("Satu atau lebih permintaan data gagal.");
        }

        const progressData = await progressRes.json();
        const analyticsData = await analyticsRes.json();
        const weeklyActivityData = await weeklyActivityRes.json();
        const moduleScoresData = await moduleScoresRes.json();
        const comparisonData = await comparisonRes.json();
        const recommendationsData = await recommendationsRes.json();
        const weakTopicsData = await weakTopicsRes.json();
        
        const completedModules = progressData.filter((m: any) => m.progress === 100).length;
        const totalModules = progressData.length;
        const averageScore = analyticsData.averageScore || 0;
        const totalSeconds = analyticsData.totalStudyTime || 0;
        const studyHours = Math.floor(totalSeconds / 3600);
        const studyMinutes = Math.floor((totalSeconds % 3600) / 60);
        const dailyStreak = analyticsData.dailyStreak || 0;

        // Konversi detik ke jam untuk data grafik, tapi simpan data asli untuk tooltip
        // 1. Buat peta skor untuk pencarian cepat
        const scoresMap = new Map(moduleScoresData.map((s: ModuleScoreData) => [s.moduleTitle, s.score]));        
        const comparisonUserScoresMap = new Map(comparisonData.labels.map((label: string, index: number) => [label, comparisonData.userScores[index]]));
        const comparisonClassAveragesMap = new Map(comparisonData.labels.map((label: string, index: number) => [label, comparisonData.classAverages[index]]));
        
        // 2. Gunakan `progressData` sebagai sumber kebenaran untuk semua judul modul
        const allModuleScores = progressData.map((modul: any) => ({
          moduleTitle: modul.title,
          score: scoresMap.get(modul.title) || 0, // Beri nilai 0 jika tidak ada skor
        }));

        // 3. Buat ulang data perbandingan berdasarkan semua modul
        const allModuleTitles = progressData.map((modul: any) => modul.title);
        const updatedComparisonData = {
          ...comparisonData,
          labels: allModuleTitles,
          userScores: allModuleTitles.map((title: string) => comparisonUserScoresMap.get(title) || 0),
          classAverages: allModuleTitles.map((title: string) => comparisonClassAveragesMap.get(title) || 0),
        };        

        const weeklySeconds = weeklyActivityData.weeklySeconds || Array(7).fill(0);
        setWeeklyActivity(weeklySeconds); // Simpan dalam detik, konversi akan dilakukan di chart options
        setModuleScores(allModuleScores);
        setComparisonData(updatedComparisonData);
        setRecommendations(recommendationsData);
        setWeakTopics(weakTopicsData.filter((t: WeakTopicData) => t.status !== "Sudah bagus"));

        setSummary({
          completedModules,
          totalModules,
          averageScore,
          studyHours,
          studyMinutes,
          dailyStreak,
        });
      } catch (error) {
        console.error("Gagal memuat data analitik:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAnalytics();
  }, []); // ✅ hanya sekali di-mount


  // --- 2️⃣ BUAT GRAFIK SAAT DATA TERSEDIA ---
  useEffect(() => {
    if (!chartAktivitasRef.current || weeklyActivity.length === 0 || !isChartAktivitasInView) return;

    // label hari otomatis (Senin - Minggu)
    const dayLabels = (() => {
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const today = new Date().getDay(); // 0=Min, 6=Sab
      // Urutkan agar grafik dimulai dari 6 hari sebelum hari ini
      const rotated = [...days.slice(today + 1), ...days.slice(0, today + 1)];
      return rotated.slice(-7);
    })();

    const chartAktivitasInstance = new Chart(chartAktivitasRef.current as HTMLCanvasElement, {
      type: "line",
      data: {
        labels: dayLabels,
        datasets: [
          {
            label: "Jam Belajar",
            data: weeklyActivity,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.15)",
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: "#2563eb",
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                } 
                if (context.parsed.y !== null) {
                  const totalSeconds = context.raw as number; // Gunakan data mentah (dalam detik)
                  const hours = Math.floor(totalSeconds / 3600); 
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  label += `${hours > 0 ? hours + ' jam ' : ''}${minutes} menit`;
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              display: true, // Tampilkan ticks untuk referensi
              callback: function(value) {
                // Konversi detik ke jam untuk label sumbu Y
                const hours = (value as number) / 3600;
                return `${hours.toFixed(1)} jam`;
              }
            },
          },
        },
      },
    });

    return () => chartAktivitasInstance.destroy();
  }, [weeklyActivity, isChartAktivitasInView]); // ✅ hanya update kalau data & visibilitas terpenuhi


  // --- 3️⃣ GRAFIK NILAI PER MODUL & PERBANDINGAN (tidak berubah dinamis) ---
  useEffect(() => {
    if (chartNilaiRef.current && moduleScores.length > 0 && isChartNilaiInView) {
      const chartNilaiInstance = new Chart(chartNilaiRef.current as HTMLCanvasElement, {
        type: "bar",
        data: {
          labels: moduleScores.map(m => m.moduleTitle),
          datasets: [
            {
              data: moduleScores.map(m => m.score),
              backgroundColor: [
                "#3b82f6",
                "#06b6d4",
                "#f59e0b",
                "#a855f7",
                "#10b981",
                "#d1d5db",
              ],
              borderRadius: 8,
            },
          ],
        },
        options: {
          indexAxis: 'y', // <-- Ini membuat chart menjadi horizontal
          plugins: { legend: { display: false } },
          scales: {
            // Sumbu X (horizontal) sekarang menjadi sumbu nilai
            x: { beginAtZero: true, max: 100, ticks: { display: false } },
            // Sumbu Y (vertikal) sekarang menjadi sumbu kategori/label
            y: { ticks: { autoSkip: false } } // autoSkip: false memastikan semua label modul ditampilkan
          },
        },
      });
      return () => chartNilaiInstance.destroy();
    }
  }, [moduleScores, isChartNilaiInView]);

  useEffect(() => {
    if (chartPerbandinganRef.current && comparisonData && isChartPerbandinganInView) {
      const chartPerbandinganInstance = new Chart(chartPerbandinganRef.current as HTMLCanvasElement, {
        type: "radar",
        data: {
          labels: comparisonData.labels,
          datasets: [
            {
              label: "Kamu",
              data: comparisonData.userScores,
              fill: true,
              backgroundColor: "rgba(59, 130, 246, 0.3)",
              borderColor: "rgb(59, 130, 246)",
              pointBackgroundColor: "rgb(59, 130, 246)",
            },
            {
              label: "Rata-rata Kelas",
              data: comparisonData.classAverages,
              fill: true,
              backgroundColor: "rgba(156, 163, 175, 0.3)",
              borderColor: "rgb(156, 163, 175)",
              pointBackgroundColor: "rgb(156, 163, 175)",
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom', // Pindahkan legenda ke bawah
              align: 'center',    // Pusatkan legenda
              labels: {
                padding: 15,      // Mengurangi jarak antara legenda dan grafik
              }
            }
          },
          scales: {
            r: { beginAtZero: true, max: 100, ticks: { display: false } },
          },
        },
      });
      return () => chartPerbandinganInstance.destroy();
    }
  }, [comparisonData, isChartPerbandinganInView]);

  // --- Gunakan hook animasi untuk ringkasan ---
  const animatedCompletedModules = useCountUp(summary?.completedModules || 0, 1500, isSummaryCardInView);
  const animatedTotalModules = useCountUp(summary?.totalModules || 0, 1500, isSummaryCardInView);
  const animatedAverageScore = useCountUp(parseFloat((summary?.averageScore || 0).toFixed(2)), 1500, isSummaryCardInView);
  const animatedStudyHours = useCountUp(summary?.studyHours || 0, 1500, isSummaryCardInView);
  const animatedDailyStreak = useCountUp(summary?.dailyStreak || 0, 1500, isSummaryCardInView);

  // --- Logic for Weak Topics Search and Pagination ---
  const filteredWeakTopics = weakTopics.filter(topic =>
    topic.topicTitle.toLowerCase().includes(weakTopicSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filteredWeakTopics.length / ITEMS_PER_PAGE);
  const paginatedWeakTopics = filteredWeakTopics.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  return (
    <div className="space-y-10">
      {/* RINGKASAN */}
      <section>
        <h2 ref={summaryCardRef as React.RefObject<HTMLHeadingElement>} className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          Ringkasan Kemajuan
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" >
          {/* Card 1 */}
          <div className="flex items-center gap-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-5 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <div className="flex-shrink-0">
              <Image
                src="/modules2.png"
                alt="Modul Icon"
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-gray-700 p-2"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Modul Selesai</p>
              {loading || !summary ? (
                <div className="h-12 w-32 bg-blue-100/50 dark:bg-gray-700/50 rounded-md animate-pulse mt-1"></div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{animatedCompletedModules} / {animatedTotalModules}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Kamu telah menyelesaikan {summary.totalModules > 0 ? Math.round((summary.completedModules / summary.totalModules) * 100) : 0}%
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center gap-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-5 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <div className="flex-shrink-0">
              <Image src="/star.png" alt="Score Icon" width={64} height={64} className="w-16 h-16 rounded-xl bg-green-100 dark:bg-gray-700 p-2" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Nilai</p>
              {loading || !summary ? (
                <div className="h-12 w-24 bg-green-100/50 dark:bg-gray-700/50 rounded-md animate-pulse mt-1"></div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{animatedAverageScore}%</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dari semua post-test topik</p>
                </>
              )}
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center gap-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-5 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <div className="flex-shrink-0">
              <Image
                src="https://img.icons8.com/fluency/96/time.png"
                alt="Time Icon"
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-gray-700 p-2"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Waktu Belajar</p>
              {loading || !summary ? (
                <div className="h-12 w-32 bg-purple-100/50 dark:bg-gray-700/50 rounded-md animate-pulse mt-1"></div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{animatedStudyHours} jam</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{summary.studyMinutes} menit</p>
                </>
              )}
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex items-center gap-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-5 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <div className="flex-shrink-0">
              <Image src="/streak.png" alt="Streak Icon" width={64} height={64} className="w-16 h-16 rounded-xl bg-orange-100 dark:bg-gray-700 p-2" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Streak Harian</p>
              {loading || !summary ? (
                <div className="h-12 w-20 bg-orange-100/50 dark:bg-gray-700/50 rounded-md animate-pulse mt-1"></div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{animatedDailyStreak}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hari berturut-turut aktif</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* GRAFIK */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Aktivitas Mingguan
          </h3>
          <canvas ref={chartAktivitasRef as React.RefObject<HTMLCanvasElement>}></canvas>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <BarChartHorizontal className="w-5 h-5" />
            Nilai per Modul
          </h3>
          <canvas ref={chartNilaiRef as React.RefObject<HTMLCanvasElement>}></canvas>
        </div>
      </section>

      {/* TOPIK YANG PERLU DIPERKUAT */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Topik yang Perlu Diperkuat
          </h3>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cari topik..."
              value={weakTopicSearch}
              onChange={(e) => {
                setWeakTopicSearch(e.target.value);
                setCurrentPage(1); // Reset ke halaman pertama saat mencari
              }}
              className="w-full sm:w-64 pl-4 pr-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <tr>
                <th className="p-3 font-medium">Topik</th>
                <th className="p-3 font-medium">Nilai Terakhir</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b dark:border-gray-700">
                    <td className="p-3"><div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                    <td className="p-3"><div className="h-5 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                    <td className="p-3"><div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                  </tr>
                ))
              ) : paginatedWeakTopics.length > 0 ? (
                paginatedWeakTopics.map((topic, index) => (
                  <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{topic.topicTitle}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{topic.score}%</td>
                    <td className="p-3">
                      {topic.status === "Perlu review" && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Perlu review</span>}
                      {topic.status === "Butuh latihan" && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Butuh latihan</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b dark:border-gray-700">
                  <td colSpan={3} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {weakTopicSearch ? "Tidak ada topik yang cocok dengan pencarian." : "Kerja bagus! Tidak ada topik yang perlu diperkuat saat ini. 🎉"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            >
              Sebelumnya
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            >
              Berikutnya
            </button>
          </div>
        )}
      </section>

      {/* PERBANDINGAN DENGAN KELAS */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 -mb-5">
          <Users className="w-5 h-5" />
          Perbandingan dengan Rata-rata Kelas
        </h2>
        <div className="flex flex-col lg:flex-row gap-4 items-center mt-2">
          <div className="lg:w-3/5 w-full">
            <canvas ref={chartPerbandinganRef as React.RefObject<HTMLCanvasElement>}></canvas>
          </div>
          <div className="lg:w-2/5 w-full space-y-4 text-gray-800 dark:text-gray-200">
            {loading || !comparisonData ? (
              <>
                <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg border border-blue-100 dark:border-gray-700">
                  <Award className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Peringkat Kamu</p>
                    <p className="font-bold text-lg">
                      {comparisonData.rank} <span className="text-sm font-normal">dari {comparisonData.totalParticipants} peserta</span>
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-4 p-3 rounded-lg border ${comparisonData.scoreDifference > 0 ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-100 dark:border-yellow-800'}`}>
                  {comparisonData.scoreDifference > 0 ? (
                    <TrendingUp className="w-8 h-8 text-green-500 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Performa Nilai</p>
                    <p className="font-bold text-lg">
                      {comparisonData.scoreDifference > 0 ? `Lebih Tinggi ${comparisonData.scoreDifference}%` : comparisonData.scoreDifference < 0 ? `Lebih Rendah ${Math.abs(comparisonData.scoreDifference)}%` : 'Setara'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-center md:text-left text-gray-600 dark:text-gray-400 pt-2">
                  {comparisonData.scoreDifference > 0 ? '🏆 Kerja bagus, terus pertahankan performa belajarmu!' : '💡 Terus tingkatkan pemahamanmu di setiap modul untuk hasil yang lebih baik.'}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* REKOMENDASI */}
      <section className="bg-gradient-to-br from-blue-50 via-blue-100 to-gray-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 p-6 rounded-2xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <Target className="w-6 h-6" />
            Rekomendasi Pembelajaran
          </h3>
          <span className="text-sm bg-blue-200/60 dark:bg-gray-700/50 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300">
            Diperbarui hari ini
          </span>
        </div>

        {loading || !recommendations ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-700/40 rounded-xl animate-pulse">
                <div className="w-16 h-16 rounded-lg bg-white/30 dark:bg-gray-600/30"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-white/30 dark:bg-gray-600/30 rounded"></div>
                  <div className="h-4 w-1/2 bg-white/30 dark:bg-gray-600/30 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {/* REPEAT MODULE */}
            {recommendations.repeatModule && (
              <li className="flex items-center justify-between gap-4 p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl hover:bg-white/80 dark:hover:bg-gray-600/50 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${recommendations.repeatModule.moduleIcon}`}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-lg object-contain bg-white/30 dark:bg-gray-700/40 p-1"
                    alt="gambar modul"
                  />
                  <div>
                    <p className="font-semibold">
                      Ulangi <b>{recommendations.repeatModule.moduleTitle}</b>
                    </p>
                    <p className="text-sm opacity-80">
                      Nilai post-test akhirmu masih {recommendations.repeatModule.moduleScore}%.
                      {recommendations.repeatModule.allTopicsMastered ? (
                        " Semua topik sudah bagus, coba kerjakan ulang post-test akhir dengan lebih teliti."
                      ) : recommendations.repeatModule.weakestTopic ? (
                        ` Fokus pada topik ${recommendations.repeatModule.weakestTopic}.`
                      ) : null}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const slug = recommendations.repeatModule.moduleSlug;
                    if (recommendations.repeatModule.allTopicsMastered) {
                      router.push(`/modul/${slug}/post-test`);
                    } else {
                      const hash = recommendations.repeatModule.weakestTopicDetails ? '#' + recommendations.repeatModule.weakestTopicDetails._id : '';
                      router.push(`/modul/${slug}${hash}`);
                    }
                  }}
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 transition text-white shadow-md"
                >
                  <Play className="w-5 h-5" />
                </button>
              </li>
            )}

            {/* DEEPEN TOPIC */}
            {recommendations.deepenTopic && (
              <li className="flex items-center justify-between gap-4 p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl hover:bg-white/80 dark:hover:bg-gray-600/50 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <Image
                    src="https://img.icons8.com/fluency/96/books.png"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-lg object-contain bg-white/30 dark:bg-gray-700/40 p-1"
                    alt="gambar modul"
                  />
                  <div>
                    <p className="font-semibold">
                      Perdalam topik <b>{recommendations.deepenTopic.topicTitle || 'Tidak Diketahui'}</b>
                    </p>
                    <p className="text-sm opacity-80">
                      Coba latihan tambahan agar lebih memahami topik ini secara mendalam.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    recommendations.deepenTopic.modulSlug && recommendations.deepenTopic.topicSlug && router.push(
                      `/modul/${recommendations.deepenTopic.modulSlug}#${recommendations.deepenTopic.topicId}`
                    )
                  }
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 transition text-white shadow-md"
                >
                  <Play className="w-5 h-5" />
                </button>
              </li>
            )}

            {/* CONTINUE MODULE */}
            {recommendations.continueToModule ? (
              <li className="flex items-center justify-between gap-4 p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl hover:bg-white/80 dark:hover:bg-gray-600/50 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${recommendations.continueToModule.moduleIcon}`}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-lg object-contain bg-white/30 dark:bg-gray-700/40 p-1"
                    alt="gambar modul"
                  />
                  <div>
                    <p className="font-semibold">
                      Lanjutkan ke <b>{recommendations.continueToModule.moduleTitle}</b>
                    </p>
                    <p className="text-sm opacity-80">
                      {recommendations.continueToModule.nextTopic
                        ? `Kamu sudah siap untuk materi lanjutan tentang ${recommendations.continueToModule.nextTopic.title}.`
                        : "Lanjutkan progres belajarmu di modul ini."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    router.push(`/modul/${recommendations.continueToModule.moduleSlug}${recommendations.continueToModule.nextTopic ? `#${recommendations.continueToModule.nextTopic.id}` : ''}`)
                  }
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 transition text-white shadow-md"
                >
                  <Play className="w-5 h-5" />
                </button>
              </li>
            ) : (
              <p className="p-4 text-center text-gray-700 dark:text-gray-300">
                Selamat 🎉 Semua modul telah kamu selesaikan dengan baik!
              </p>
            )}
          </ul>
        )}
      </section>


    </div>
  )
}
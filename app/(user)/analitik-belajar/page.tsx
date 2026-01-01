"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { authFetch } from "@/lib/authFetch";
import { useRouter } from "next/navigation";
import { Award, TrendingUp, TrendingDown, LayoutDashboard, Activity, BarChartHorizontal, AlertTriangle, Users, Target, Play, Rocket } from "lucide-react";
import { Chart, registerables } from "chart.js";
import { ChevronDown } from "lucide-react";
Chart.register(...registerables);

interface SummaryData {
  completedModules: number;
  totalModules: number;
  averageScore: number;
  studyHours: number;
  studyMinutes: number;
  dailyStreak: number;
}

interface ModulProgress {
  title: string;
  progress: number;
  isLocked: boolean;
}

interface ComparisonData {
  labels: string[];
  userScores: number[];
  classAverages: number[];
  rank: number;
  totalParticipants: number;
  scoreDifference: number;
}

interface CompetencyFeature {
  name: string;
  score: number;
}
// Definisikan tipe untuk modul yang akan ditingkatkan
interface ModuleForCompetencyMap {
  slug: string;
}

// Definisikan tipe untuk data kompetensi yang dikelompokkan
interface GroupedCompetencyData {
  [level: string]: CompetencyFeature[];
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
    weakestTopicDetails: {
      _id: string;
      slug: string;
    } | null;
    allTopicsMastered?: boolean; // Tambahkan flag ini
  } | null;
  deepenTopic: {
    topicId: string;
    topicTitle?: string;
    modulSlug?: string;
    topicSlug?: string;
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
  modulSlug: string; // Memastikan modulSlug ada di level atas
  score: number;
  weakSubTopics: {
    title: string;
    subMateriId: string;
  }[];
  status: "Perlu review" | "Butuh latihan" | "Sudah bagus";
}

// Opsi untuk useInView, termasuk properti kustom `triggerOnce`
interface InViewOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

// --- Custom Hook untuk mendeteksi elemen di viewport ---
const useInView = (options: InViewOptions = { threshold: 0.1, triggerOnce: true }) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement | HTMLCanvasElement | HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (ref.current && options.triggerOnce) {
          observer.unobserve(ref.current);
        }
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [options]);

  return [ref, isInView] as const;
};

// --- Custom Hook untuk Animasi Hitung (dengan pemicu) ---
const useCountUp = (end: number, duration: number = 1500, start: boolean = true) => {
  const [count, setCount] = useState(0); // Memberikan nilai awal
  const frameRef = useRef<number | null>(null); // Mengizinkan undefined
  const startTimeRef = useRef<number | null>(null); // Mengizinkan undefined

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

    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) };
  }, [end, duration, start]);

  return count;
};

// Helper function untuk mendapatkan feedback berdasarkan skor kompetensi
const getCompetencyFeedback = (score: number) => {
  if (score >= 85) {
    return {
      level: "Sangat Baik",
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
      textColor: "text-green-600 dark:text-green-400"
    };
  }
  if (score >= 70) {
    return {
      level: "Baik",
      color: "bg-gradient-to-r from-blue-500 to-indigo-500",
      textColor: "text-blue-600 dark:text-blue-400"
    };
  }
  return {
    level: "Perlu Ditingkatkan",
    color: "bg-gradient-to-r from-red-500 to-rose-500",
    textColor: "text-red-600 dark:text-red-400"
  };
};

export default function AnalitikBelajarPage() {
  const router = useRouter();
  const [summaryCardRef, isSummaryCardInView] = useInView({ threshold: 0.2, triggerOnce: true }) as [React.RefObject<HTMLHeadingElement>, boolean];
  const [chartPerbandinganRef, isChartPerbandinganInView] = useInView({ threshold: 0.5, triggerOnce: true }) as [React.RefObject<HTMLCanvasElement>, boolean];
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([]);
  const [classWeeklyActivity, setClassWeeklyActivity] = useState<number[]>([]);  
  const [competencyData, setCompetencyData] = useState<(GroupedCompetencyData & { nextModuleToImprove?: ModuleForCompetencyMap | null }) | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weakTopicSearch, setWeakTopicSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [competencyCurrentPage, setCompetencyCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [openCompetency, setOpenCompetency] = useState<string | null>(null);

  const [userLearningLevel, setUserLearningLevel] = useState<string | null>(null);
  // Definisikan ref dan state inView untuk chart aktivitas di sini
  const [chartAktivitasRef, isChartAktivitasInView] = useInView({ threshold: 0.5, triggerOnce: true }) as [React.RefObject<HTMLCanvasElement>, boolean];

  // --- 1️⃣ FETCH DATA SEKALI SAJA ---
  useEffect(() => {
    const fetchAllAnalytics = async () => {
      try {
        setLoading(true);

        const [progressRes, analyticsRes, weeklyActivityRes, classWeeklyActivityRes, competencyProfileRes, comparisonRes, recommendationsRes, weakTopicsRes] =
          await Promise.all([
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/analytics`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/weekly-activity`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/class-weekly-activity`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/competency-profile`), // Endpoint khusus untuk competencyProfile
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/comparison-analytics`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/recommendations`),
            authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/topics-to-reinforce`),
          ]);

        // --- Penanganan Error yang Lebih Baik ---
        const checkResponse = (res: Response, name: string) => {
          if (!res.ok) {
            console.error(`Gagal memuat ${name}:`, res.status, res.statusText);
            return null; // Kembalikan null jika gagal
          }
          return res.json();
        };

        // Ambil data user untuk mendapatkan learningLevel
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const parsedUser = JSON.parse(userRaw);
          setUserLearningLevel(parsedUser.learningLevel);
          // Buka accordion level pengguna saat ini secara default
          if (parsedUser.learningLevel) {
            const formattedLevel = parsedUser.learningLevel.charAt(0).toUpperCase() + parsedUser.learningLevel.slice(1);
            setOpenCompetency(formattedLevel);
          }

        }

        const progressData = await checkResponse(progressRes, 'progress');
        const analyticsData = await checkResponse(analyticsRes, 'analytics');
        const weeklyActivityData = await checkResponse(weeklyActivityRes, 'weekly activity');
        const classWeeklyActivityData = await checkResponse(classWeeklyActivityRes, 'class weekly activity');
        const competencyProfileData = await checkResponse(competencyProfileRes, 'competency profile');
        const comparisonData = await checkResponse(comparisonRes, 'comparison');
        const recommendationsData: RecommendationData | null = await checkResponse(recommendationsRes, 'recommendations');
        const weakTopicsData = await checkResponse(weakTopicsRes, 'weak topics');

        const completedModules = progressData.filter((m: ModulProgress) => m.progress === 100).length;
        const totalModules = progressData.length;
        const averageScore = analyticsData.averageScore || 0;
        const totalSeconds = analyticsData.totalStudyTime || 0;
        const studyHours = Math.floor(totalSeconds / 3600);
        const studyMinutes = Math.floor((totalSeconds % 3600) / 60);
        const dailyStreak = analyticsData.dailyStreak || 0;

        const comparisonUserScoresMap = new Map(comparisonData.labels.map((label: string, index: number) => [label, comparisonData.userScores[index]]));
        const comparisonClassAveragesMap = new Map(comparisonData.labels.map((label: string, index: number) => [label, comparisonData.classAverages[index]]));

        // Buat ulang data perbandingan berdasarkan semua modul
        const allModuleTitles = progressData.map((modul: ModulProgress) => modul.title);
        const updatedComparisonData = {
          ...comparisonData,
          labels: allModuleTitles,
          userScores: allModuleTitles.map((title: string) => comparisonUserScoresMap.get(title) || 0),
          classAverages: allModuleTitles.map((title: string) => comparisonClassAveragesMap.get(title) || 0),
        };

        const weeklySeconds = weeklyActivityData.weeklySeconds || Array(7).fill(0);
        setWeeklyActivity(weeklySeconds); // Simpan dalam detik, konversi akan dilakukan di chart options
        setClassWeeklyActivity(classWeeklyActivityData.weeklyAverages || Array(7).fill(0));
        
        // --- Logika untuk Tombol Tingkatkan di Peta Kompetensi ---
        let nextModuleToImprove = null;
        if (progressData && userLearningLevel) {
          const levelMap = { 'Dasar': 'mudah', 'Menengah': 'sedang', 'Lanjutan': 'sulit' };
          const targetCategory = levelMap[userLearningLevel as keyof typeof levelMap];

          // Cari modul pertama yang belum dimulai pada level pengguna saat ini
          const firstUnstartedModuleInLevel = progressData
            .filter((m: any) => m.category === targetCategory && m.progress === 0 && !m.isLocked)
            .sort((a: any, b: any) => a.order - b.order)[0];

          if (firstUnstartedModuleInLevel) {
            nextModuleToImprove = firstUnstartedModuleInLevel;
          }
        }

        // Simpan data kompetensi yang sudah dikelompokkan dari backend
        if (competencyProfileData && competencyProfileData.competencyProfile) {
          // Tambahkan modul yang akan ditingkatkan ke data kompetensi
          setCompetencyData({ ...competencyProfileData.competencyProfile as GroupedCompetencyData, nextModuleToImprove });
        }

        setComparisonData(updatedComparisonData);
        setRecommendations(recommendationsData);

        // Tambahkan modulSlug ke setiap topik yang lemah
        const enrichedWeakTopics = weakTopicsData.map((topic: any) => {
          const moduleForTopic = progressData.find((modul: any) =>
            modul.topics.some((t: any) => t.title === topic.topicTitle)
          ); 
          return { ...topic, modulSlug: moduleForTopic?.slug };
        }).filter((t: WeakTopicData) => t.status !== "Sudah bagus" && t.modulSlug);

        setWeakTopics(enrichedWeakTopics);

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

    // label hari otomatis (7 hari terakhir)
    const dayLabels = (() => {
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const today = new Date().getDay(); // 0=Min, 6=Sab
      // Urutkan agar grafik dimulai dari 6 hari sebelum hari ini
      const rotated = [...days.slice(today + 1), ...days.slice(0, today + 1)];
      return rotated.slice(-7);
    })();

    const chartAktivitasInstance = new Chart(chartAktivitasRef.current, {
      type: "line",
      data: {
        labels: dayLabels,
        datasets: [
          {
            label: "Jam Belajar",
            data: classWeeklyActivity,
            borderColor: "rgb(156, 163, 175)",
            backgroundColor: "rgba(156, 163, 175, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: "Aktivitas Kamu",
            data: weeklyActivity,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.15)",
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "#2563eb",
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            position: 'nearest',
            padding: 12,
            boxPadding: 4,
            titleFont: { weight: 'bold' },
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
              callback: function (value) {
                const totalSeconds = value as number;
                if (totalSeconds === 0) return '0 mnt';
                if (totalSeconds < 3600) {
                  const minutes = Math.round(totalSeconds / 60);
                  return `${minutes} mnt`;
                } else {
                  const hours = Math.round(totalSeconds / 3600);
                  return `${hours} jam`;
                }
              }
            },
          },
        },
      },
    });

    return () => chartAktivitasInstance.destroy();
  }, [weeklyActivity, classWeeklyActivity, isChartAktivitasInView, chartAktivitasRef]); // ✅ hanya update kalau data & visibilitas terpenuhi


  useEffect(() => {
    if (chartPerbandinganRef.current && comparisonData && isChartPerbandinganInView) { // chartPerbandinganRef.current sudah pasti HTMLCanvasElement
      // Tentukan label berdasarkan ukuran layar
      const isMobile = window.innerWidth < 768; // md breakpoint
      const chartLabels = isMobile
        ? comparisonData.labels.map(label => label.split(' ')) // Wrap label di mobile
        : comparisonData.labels; // Tampilkan satu baris di desktop

      const chartPerbandinganInstance = new Chart(chartPerbandinganRef.current, {
        type: "radar",
        data: {
          // Gunakan label yang sudah di-wrap
          labels: chartLabels as any,
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
          elements: {
            line: {
              borderWidth: 2, // Atur ketebalan garis
              tension: 0.1    // Sedikit melengkungkan garis antar titik
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
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
  }, [comparisonData, isChartPerbandinganInView, chartPerbandinganRef]);

  // --- Gunakan hook animasi untuk ringkasan ---
  const animatedCompletedModules = useCountUp(summary?.completedModules || 0, 1500, isSummaryCardInView);
  const animatedTotalModules = useCountUp(summary?.totalModules || 0, 1500, isSummaryCardInView);
  const averageScoreForAnimation = parseFloat((summary?.averageScore || 0).toFixed(2));
  const animatedAverageScore = useCountUp(averageScoreForAnimation, 1500, isSummaryCardInView);
  const animatedStudyHours = useCountUp(summary?.studyHours || 0, 1500, isSummaryCardInView);
  const animatedDailyStreak = useCountUp(summary?.dailyStreak || 0, 1500, isSummaryCardInView);

  // --- Logic for Weak Topics Search and Pagination ---
  const filteredWeakTopics = weakTopics?.filter(topic =>
    topic.topicTitle.toLowerCase().includes(weakTopicSearch.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredWeakTopics?.length / ITEMS_PER_PAGE);
  const paginatedWeakTopics = filteredWeakTopics?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleRowClick = (topic: WeakTopicData) => {
    if (topic.weakSubTopics && topic.weakSubTopics.length > 0) {
      const firstWeakSubTopic = topic.weakSubTopics[0];
      // Menggunakan modulSlug dari level topik dan subMateriId dari sub-topik
      router.push(`/modul/${topic.modulSlug}#${firstWeakSubTopic.subMateriId}`);
    }
  };

  // --- Logic for Weekly Activity Feedback ---
  const userTotalWeekly = weeklyActivity.reduce((acc, curr) => acc + curr, 0);
  const classTotalWeekly = classWeeklyActivity.reduce((acc, curr) => acc + curr, 0);
  const weeklyDifference = userTotalWeekly - classTotalWeekly;

  const getWeeklyFeedback = () => {
    if (userTotalWeekly === 0 && classTotalWeekly > 0) {
      return {
        text: "Kamu belum ada aktivitas minggu ini. Ayo mulai belajar!",
        icon: <TrendingDown className="w-5 h-5 text-red-500" />,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-100 dark:border-red-800/50"
      };
    }
    if (weeklyDifference > 3600) { // Lebih dari 1 jam di atas rata-rata
      return {
        text: "Luar biasa! Aktivitas belajarmu jauh di atas rata-rata. Pertahankan!",
        icon: <TrendingUp className="w-5 h-5 text-green-500" />,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-100 dark:border-green-800/50"
      };
    }
    if (weeklyDifference > 0) {
      return {
        text: "Bagus! Aktivitas belajarmu sudah di atas rata-rata kelas.",
        icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-100 dark:border-blue-800/50"
      };
    }
    return {
      text: "Ayo tingkatkan lagi! Aktivitas belajarmu masih di bawah rata-rata.",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-100 dark:border-yellow-800/50"
    };
  };

  // --- Logic for Competency Map Pagination ---
  const [itemsPerPage, setItemsPerPage] = useState(6);
  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth < 768 ? 3 : 6);
    };
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);
  return (
    <div className="space-y-10 mt-22">
      {/* RINGKASAN */}
      <section>
        <h2 ref={summaryCardRef} className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          Ringkasan Kemajuan
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5" >
          {/* Card 1 */}
          <div className="flex flex-col gap-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-4 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <p className="text-sm text-gray-600 dark:text-gray-400">Modul Selesai</p>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Image src="/modules2.png" alt="Modul Icon" width={48} height={48} className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-gray-700 p-1" />
              </div>
              {loading || !summary ? (
                <div className="h-8 w-24 bg-blue-100/50 dark:bg-gray-700/50 rounded-md animate-pulse"></div>
              ) : (
                <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{animatedCompletedModules} / {animatedTotalModules}</h2>
              )}
            </div>
            {loading || !summary ? (
              <div className="h-4 w-full bg-blue-100/50 dark:bg-gray-700/50 rounded-md animate-pulse"></div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Kamu telah menyelesaikan {summary.totalModules > 0 ? Math.round((summary.completedModules / summary.totalModules) * 100) : 0}%
              </p>
            )}
          </div>

          {/* Card 2 */}
          <div className="flex flex-col gap-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-4 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Nilai</p>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Image src="/star.png" alt="Score Icon" width={48} height={48} className="w-12 h-12 rounded-lg bg-green-100 dark:bg-gray-700 p-1" />
              </div>
              {loading || !summary ? (
                <div className="h-8 w-20 bg-green-100/50 dark:bg-gray-700/50 rounded-md animate-pulse"></div>
              ) : (
                <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">{animatedAverageScore}%</h2>
              )}
            </div>
            {loading || !summary ? (
              <div className="h-4 w-full bg-green-100/50 dark:bg-gray-700/50 rounded-md animate-pulse"></div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">Dari semua tes setiap topik</p>
            )}
          </div>

          {/* Card 3 */}
          <div className="flex flex-col gap-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-4 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Waktu Belajar</p>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Image src="/study.png" alt="Time Icon" width={48} height={48} className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-gray-700 p-1" />
              </div>
              {loading || !summary ? (
                <div className="h-8 w-24 bg-purple-100/50 dark:bg-gray-700/50 rounded-md animate-pulse"></div>
              ) : (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400 leading-none">{animatedStudyHours}</h2>
                  <span className="text-xl font-semibold text-purple-500 dark:text-purple-300">jam</span>
                  <p className="text-base text-purple-500 dark:text-purple-400">{summary.studyMinutes} menit</p>                </div>
              )}
            </div>
            {loading || !summary ? (
              <div className="h-4 w-full bg-purple-100/50 dark:bg-gray-700/50 rounded-md animate-pulse"></div>
            ) : (
              null
            )}
          </div>

          {/* Card 4 */}
          <div className="flex flex-col gap-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl p-4 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <p className="text-sm text-gray-600 dark:text-gray-400">Streak Harian</p>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Image src="/streak.png" alt="Streak Icon" width={48} height={48} className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-gray-700 p-1" />
              </div>
              {loading || !summary ? (
                <div className="h-8 w-16 bg-orange-100/50 dark:bg-gray-700/50 rounded-md animate-pulse"></div>
              ) : (
                <h2 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{animatedDailyStreak}</h2>
              )}
            </div>
            {loading || !summary ? (
              <div className="h-4 w-full bg-orange-100/50 dark:bg-gray-700/50 rounded-md animate-pulse"></div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">Hari berturut-turut aktif</p>
            )}
          </div>
        </div>
      </section>

      {/* TOPIK YANG PERLU DIPERKUAT */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Topik yang Perlu Diperkuat
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ini adalah daftar topik di mana skormu masih di bawah standar. Fokuskan belajarmu di sini untuk meningkatkan pemahaman.</p>
          </div>
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

        <div className="overflow-x-auto min-h-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <tr>
                <th className="p-3 font-medium rounded-l-lg">Topik</th>
                <th className="p-3 font-medium text-center" style={{ width: '120px' }}>Nilai Terakhir</th>
                <th className="p-3 font-medium" style={{ width: '40%' }}>Rekomendasi Perbaikan</th>
                <th className="p-3 font-medium rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b dark:border-gray-700">
                    <td className="p-3"><div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                    <td className="p-3"><div className="h-5 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div></td>
                    <td className="p-3"><div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>
                    <td className="p-3 text-center"><div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div></td>
                  </tr>
                ))
              ) : paginatedWeakTopics.length > 0 ? (
                paginatedWeakTopics.map((topic) => (
                  <tr key={topic.topicTitle} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{topic.topicTitle.replace(/^\d+\.?\s*/, '')}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 text-center">{topic.score}%</td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {topic.weakSubTopics && topic.weakSubTopics.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {topic.weakSubTopics.map((sub, subIndex) => (
                            <li key={subIndex}>{sub.title.replace(/^\d+\.?\s*/, '')}</li>
                          ))}
                        </ul>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRowClick(topic)}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!topic.weakSubTopics || topic.weakSubTopics.length === 0}
                      >
                        Pelajari Lagi
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b dark:border-gray-700">
                  <td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {weakTopicSearch ? "Tidak ada topik yang cocok dengan pencarian." : "Kerja bagus! Tidak ada topik yang perlu diperkuat saat ini."}
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

      {/* GRAFIK */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Aktivitas Belajar Mingguan
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Lihat seberapa aktif kamu belajar minggu ini! Grafik ini membandingkan total waktu belajarmu setiap hari dengan rata-rata peserta lain.</p>
          <div className="relative">
            <canvas ref={chartAktivitasRef}></canvas>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm">
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-gray-600 dark:text-gray-400">Aktivitas Kamu</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-400"></span><span className="text-gray-600 dark:text-gray-400">Rata-rata Kelas</span></div>
            </div>

          </div>
          {!loading && weeklyActivity.length > 0 && (
            <div className={`flex items-center gap-3 p-2.5 mt-5 rounded-lg w-full sm:w-auto ${getWeeklyFeedback().bgColor} ${getWeeklyFeedback().borderColor} border`}>
              {getWeeklyFeedback().icon}
              <p className={`text-xs font-medium ${getWeeklyFeedback().color}`}>{getWeeklyFeedback().text}</p>
            </div>
          )}
        </div>

        {/* PERBANDINGAN DENGAN KELAS */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Perbandingan Nilai per Modul
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Bagaimana performa nilaimu dibandingkan teman-teman sekelas? Lihat perbandingan skormu dengan rata-rata kelas di setiap modul.</p>
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="lg:w-3/5 w-full flex justify-center">
              <canvas ref={chartPerbandinganRef}></canvas>
            </div>
            <div className="lg:w-2/5 w-full space-y-3 text-gray-800 dark:text-gray-200">
              {loading || !comparisonData ? (
                <>
                  <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg border border-blue-100 dark:border-gray-700">
                    <Award className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Peringkat Kamu</p>
                      <p className="font-bold text-base">
                        {comparisonData.rank} <span className="text-xs font-normal">dari {comparisonData.totalParticipants} peserta</span>
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
                      <p className="text-xs text-gray-600 dark:text-gray-400">Performa Nilai</p>
                      <p className="font-bold text-base">
                        {comparisonData.scoreDifference > 0 ? `Lebih Tinggi ${comparisonData.scoreDifference}%` : comparisonData.scoreDifference < 0 ? `Lebih Rendah ${Math.abs(comparisonData.scoreDifference)}%` : 'Setara'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PETA KOMPETENSI */}
      <section className="bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-gray-800 dark:to-slate-800 p-6 rounded-2xl shadow-md">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Peta Kompetensi Individu
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Lihat penguasaanmu pada setiap kompetensi yang diukur dari tes yang telah dikerjakan, dikelompokkan per modul.</p>

        {loading ? (
          <div className="h-60 bg-white/30 dark:bg-gray-800/30 rounded-xl animate-pulse"></div>
        ) : competencyData && (Object.keys(competencyData).length > 1) ? (
          (() => {
            const validLevels = Object.entries(competencyData).filter(([level, features]) => level !== 'nextModuleToImprove' && Array.isArray(features) && features.length > 0);
            const totalCards = validLevels.length;
            const userCurrentLevel = userLearningLevel;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {validLevels.map(([level, features], index) => {
                  const isLastItem = index === totalCards - 1;
                  const isOddCount = totalCards % 2 !== 0;
                  const cardClassName = (isLastItem && isOddCount) ? 'md:col-span-2' : '';

                  const avgScore = (features as CompetencyFeature[]).length > 0 ? Math.round((features as CompetencyFeature[]).reduce((acc, f) => acc + f.score, 0) / (features as CompetencyFeature[]).length) : 0;

                  const levelInfo = {
                    'Dasar': {
                      title: 'Kompetensi Dasar',
                      unlockInfo: `Skor rata-rata Dasar <b class="${avgScore >= 75 ? 'text-green-500' : 'text-red-500'}">(${avgScore}%)</b> harus ≥ 75% untuk membuka level Menengah.`,
                      icon: '/dasar.png'
                    },
                    'Menengah': {
                      title: 'Kompetensi Menengah',
                      unlockInfo: `Skor rata-rata Menengah <b class="${avgScore >= 75 ? 'text-green-500' : 'text-red-500'}">(${avgScore}%)</b> harus ≥ 75% untuk membuka level Lanjutan.`,
                      icon: '/menengah.png'
                    },
                    'Lanjutan': {
                      title: 'Kompetensi Lanjutan',
                      unlockInfo: 'Kamu telah mencapai level tertinggi. Terus asah kemampuanmu!',
                      icon: '/lanjut.png'
                    },
                  };

                  const info = levelInfo[level as keyof typeof levelInfo];
                  const isCurrentUserLevel = userCurrentLevel?.toLowerCase() === level.toLowerCase();
                  const isOpen = openCompetency === level;
                  
                  // Warna border berdasarkan level
                  const levelColors = {
                    'Dasar': 'border-l-4 border-l-green-500',
                    'Menengah': 'border-l-4 border-l-blue-500',
                    'Lanjutan': 'border-l-4 border-l-purple-500',
                  };
                  const borderColor = levelColors[level as keyof typeof levelColors] || 'border-l-4 border-l-gray-500';

                  return (
                    <div key={level} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 ${cardClassName} ${borderColor}`}>
                      <button 
                        onClick={() => setOpenCompetency(prev => prev === level ? null : level)} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 w-full text-left transition-colors ${isOpen ? 'bg-gray-50 dark:bg-gray-700/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-1.5 rounded-xl ${level === 'Dasar' ? 'bg-green-100 dark:bg-green-900/30' : level === 'Menengah' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                            <Image src={info.icon} alt={`${info.title} icon`} width={128} height={128} className="w-24 sm:w-12 h-auto object-contain" />
                          </div>
                          <div>
                            <h4 className="font-bold text-md text-gray-800 dark:text-gray-100">{info.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed max-w-md" dangerouslySetInnerHTML={{ __html: info.unlockInfo }} />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {isCurrentUserLevel && (
                            <span className="flex sm:inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                              <Target className="w-3 h-3 mr-1.5" />
                              Level Kamu
                            </span>
                          )}
                          <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-gray-200 dark:bg-gray-600' : ''}`}>
                            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                      </button>
                      
                      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {(features as CompetencyFeature[]).map((feature, index) => {
                              const score = Math.round(feature.score);
                              const feedback = getCompetencyFeedback(score);
                              return (
                                <div key={index} className="group">
                                  <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{feature.name}</span>
                                    <div className="text-right">
                                      <span className={`text-sm font-bold ${feedback.textColor}`}>{score}%</span>
                                      <p className={`text-[10px] font-medium ${feedback.textColor} opacity-80`}>{feedback.level}</p>
                                    </div>
                                  </div>
                                  <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${feedback.color} relative`} style={{ width: `${score}%` }}>
                                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-8">Data kompetensi belum tersedia. Kerjakan pre-test untuk melihatnya.</p>
        )}
        {/* Tombol Tingkatkan dipindahkan ke luar dari pengecekan loading */}
        {!loading && competencyData?.nextModuleToImprove && (
          <div className="mt-8 text-center md:text-left">
            <button
              onClick={() => router.push(`/modul/${competencyData.nextModuleToImprove.slug}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-all transform hover:scale-105 text-sm md:text-base"
            >
              <Rocket className="w-5 h-5" />
              Tingkatkan Kompetensi di Modul Selanjutnya
            </button>
          </div>
        )}
      </section>

      {/* REKOMENDASI */}
      <section className="bg-gradient-to-br from-blue-50 via-blue-100 to-gray-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 p-6 rounded-2xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-wide flex items-center gap-2">

            Rekomendasi Pembelajaran
          </h3>
          <span className="text-xs sm:text-sm bg-blue-200/60 dark:bg-gray-700/50 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300">
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
            {recommendations?.repeatModule && (
              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl hover:bg-white/80 dark:hover:bg-gray-600/50 transition-all shadow-sm" key="repeat-module">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${recommendations.repeatModule.moduleIcon}`}
                    width={256}
                    height={256}
                    className="w-16 h-16 rounded-lg object-contain bg-white/30 dark:bg-gray-700/40 p-1 flex-shrink-0"
                    alt="gambar modul"
                  />
                  <div className="flex-1 sm:flex-none">
                    <p className="font-semibold">
                      Ulangi <b>{recommendations.repeatModule.moduleTitle}</b>
                    </p>
                    <p className="text-sm opacity-80 hidden sm:block">
                      Nilai test akhirmu masih {recommendations.repeatModule.moduleScore}.
                      {recommendations.repeatModule.allTopicsMastered ? (
                        " Semua topik sudah bagus, coba kerjakan ulang test akhir dengan lebih teliti."
                      ) : recommendations.repeatModule.weakestTopic ? (
                        ` Fokus pada topik ${recommendations.repeatModule.weakestTopic}.`
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
                  <p className="text-sm opacity-80 sm:hidden">
                    Nilai test akhirmu masih {recommendations.repeatModule.moduleScore}.
                    {recommendations.repeatModule.allTopicsMastered ? (
                      " Semua topik sudah bagus, coba kerjakan ulang test akhir dengan lebih teliti."
                    ) : recommendations.repeatModule.weakestTopic ? (
                      ` Fokus pada topik ${recommendations.repeatModule.weakestTopic}.`
                    ) : null}
                  </p>
                  <button
                    onClick={() => {
                      const slug = recommendations.repeatModule?.moduleSlug;
                      if (recommendations.repeatModule?.allTopicsMastered) {
                        router.push(`/modul/${slug}/post-test`);
                      } else {
                        const hash = recommendations.repeatModule?.weakestTopicDetails ? '#' + recommendations.repeatModule.weakestTopicDetails._id : '';
                        router.push(`/modul/${slug}${hash}`);
                      }
                    }}
                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 transition text-white shadow-md"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </div>
              </li>
            )}

            {/* DEEPEN TOPIC */}
            {recommendations?.deepenTopic && (
              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl hover:bg-white/80 dark:hover:bg-gray-600/50 transition-all shadow-sm" key="deepen-topic">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Image
                    src="/reading-book.png"
                    width={256}
                    height={256}
                    className="w-16 h-16 rounded-lg object-contain bg-white/30 dark:bg-gray-700/40 p-1 flex-shrink-0"
                    alt="Perdalam Topik"
                  />
                  <div className="flex-1 sm:flex-none">
                    <p className="font-semibold">
                      Perdalam topik <b>{recommendations.deepenTopic.topicTitle || 'Tidak Diketahui'}</b>
                    </p>
                    <p className="text-sm opacity-80 hidden sm:block">
                      Coba latihan tambahan agar lebih memahami topik ini secara mendalam.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
                  <p className="text-sm opacity-80 sm:hidden">
                    Coba latihan tambahan agar lebih memahami topik ini secara mendalam.
                  </p>
                  <button
                    onClick={() =>
                      recommendations.deepenTopic?.modulSlug && recommendations.deepenTopic?.topicSlug && router.push(
                        `/modul/${recommendations.deepenTopic.modulSlug}#${recommendations.deepenTopic.topicId}`
                      )
                    }
                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 transition text-white shadow-md"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </div>
              </li>
            )}

            {/* CONTINUE MODULE */}
            {recommendations?.continueToModule ? (
              <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl hover:bg-white/80 dark:hover:bg-gray-600/50 transition-all shadow-sm" key="continue-module">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${recommendations.continueToModule.moduleIcon}`}
                    width={256}
                    height={256}
                    className="w-16 h-16 rounded-lg object-contain bg-white/30 dark:bg-gray-700/40 p-1 flex-shrink-0"
                    alt="gambar modul"
                  />
                  <div className="flex-1 sm:flex-none">
                    <p className="font-semibold">
                      Lanjutkan ke <b>{recommendations.continueToModule.moduleTitle}</b>
                    </p>
                    <p className="text-sm opacity-80 hidden sm:block">
                      {recommendations.continueToModule.nextTopic
                        ? `Kamu sudah siap untuk materi lanjutan tentang ${recommendations.continueToModule.nextTopic.title}.`
                        : "Lanjutkan progres belajarmu di modul ini."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
                  <p className="text-sm opacity-80 sm:hidden">
                    {recommendations.continueToModule.nextTopic
                      ? `Kamu sudah siap untuk materi lanjutan tentang ${recommendations.continueToModule.nextTopic.title}.`
                      : "Lanjutkan progres belajarmu di modul ini."}
                  </p>
                  <button
                    onClick={() =>
                      router.push(`/modul/${recommendations.continueToModule?.moduleSlug}${recommendations.continueToModule?.nextTopic ? `#${recommendations.continueToModule.nextTopic.id}` : ''}`)
                    }
                    className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 transition text-white shadow-md"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ) : (
              <p className="p-4 text-center text-gray-700 dark:text-gray-300">
                Selamat Semua modul telah kamu selesaikan dengan baik!
              </p>
            )}
          </ul>
        )}
      </section>


    </div>
  )
}
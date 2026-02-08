"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo, Suspense, useRef } from "react";
import { authFetch } from "@/lib/authFetch";
import Avatar from "@/components/Avatar"; // Ganti Image dengan komponen Avatar
import Breadcrumb from "@/components/Breadcrumb";
import { motion } from "framer-motion";
import { Award, Download, Star, Info, Shield, Zap, Trophy, Hexagon, TrendingUp, TrendingDown, Activity, Swords, Target, Sparkles, BookOpen } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useSearchParams } from "next/navigation";
import { Chart, registerables } from "chart.js";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

Chart.register(...registerables);

interface ModuleProgress {
  _id: string;
  title: string;
  progress: number;
  totalTopics: number;
  completedTopics: number;
}

interface ProgressData {
  modules: ModuleProgress[];
  totalTopics: number;
  completedTopics: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string; // Make avatar optional
  hasPassword?: boolean; // Tambahkan properti ini, buat opsional untuk kompatibilitas
  learningLevel?: string;
}

interface CompetencyFeature {
  name: string;
  score: number;
  average: number;
}

interface GroupedCompetencyData {
  [level: string]: CompetencyFeature[];
}

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

const ProfileContent = () => {
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

  const [competencyData, setCompetencyData] = useState<GroupedCompetencyData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("/user-placeholder.png");
  const [certificateName, setCertificateName] = useState(""); // New state for certificate name

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fontSize, setFontSize] = useState<string>('16px'); // Ukuran font default
  const [fontStyle, setFontStyle] = useState<string>('font-poppins');
  const [activeTab, setActiveTab] = useState("info");
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["info", "password", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const userData: User = JSON.parse(userRaw);
      const displayUserName = userData.name || "Pengguna"; // Fallback jika nama kosong
      setUser(userData);
      setName(displayUserName);
      setEmail(userData.email);
      setCertificateName(displayUserName); // Initialize certificateName
      // Logika avatar sekarang ditangani oleh komponen Avatar dan state avatarPreview

      // Load settings
      const storedFontSize = localStorage.getItem('materiFontSize');
      if (storedFontSize) setFontSize(storedFontSize);
      const storedFontStyle = localStorage.getItem('materiFontStyle');
      if (storedFontStyle) setFontStyle(storedFontStyle);
    }
    setLoading(false);

    const fetchProgress = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`);
        if (res.ok) {
          const modules: ModuleProgress[] = await res.json();
          const totalTopics = modules.reduce((sum, mod) => sum + (mod.totalTopics || 0), 0);
          const completedTopics = modules.reduce((sum, mod) => sum + (mod.completedTopics || 0), 0);
          setProgressData({ modules, totalTopics, completedTopics });
        }
      } catch (error) {
        console.error("Gagal memuat progres belajar:", error);
      }
    };

    const fetchCompetencyProfile = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/competency-profile`);
        if (res.ok) {
          const data = await res.json();
          setCompetencyData(data.competencyProfile);
        }
      } catch (error) {
        console.error("Gagal memuat profil kompetensi:", error);
      }
    };

    if (userRaw) {
      fetchProgress();
      fetchCompetencyProfile();
    }
  }, []);

  useEffect(() => {
    if (competencyData && chartRef.current) {
      const allFeatures: CompetencyFeature[] = [];
      // Flatten features for the chart
      Object.values(competencyData).forEach(features => {
        allFeatures.push(...features);
      });

      // If no features, don't draw
      if (allFeatures.length === 0) return;

      // Logika label responsif: Gunakan F1, F2 dst untuk layar sangat kecil (range 320px)
      const isVerySmallScreen = window.innerWidth <= 360;
      let labels;
      if (isVerySmallScreen) {
        labels = allFeatures.map((_, i) => `F${i + 1}`);
      } else {
        const useShortLabels = allFeatures.length > 6;
        labels = useShortLabels
          ? allFeatures.map((_, i) => `K${i + 1}`)
          : allFeatures.map(f => f.name.split(' '));
      }

      const data = allFeatures.map(f => f.score);
      const averageData = allFeatures.map(f => f.average);

      const ctx = chartRef.current.getContext("2d");
      let bgGradient: CanvasGradient | string = 'rgba(99, 102, 241, 0.2)';
      
      if (ctx) {
        bgGradient = ctx.createRadialGradient(
            chartRef.current.width / 2,
            chartRef.current.height / 2,
            0,
            chartRef.current.width / 2,
            chartRef.current.height / 2,
            chartRef.current.width / 2
        );
        bgGradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)'); // Indigo-500 center (lebih kalem)
        bgGradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)'); // Fade out
      }

      const chartInstance = new Chart(chartRef.current, {
        type: 'radar',
        data: {
          labels: labels as unknown as string[],
          datasets: [{
            label: 'Kamu',
            data: data,
            backgroundColor: bgGradient,
            borderColor: 'rgba(99, 102, 241, 1)',
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Rata-rata Kelas',
            data: averageData,
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            borderColor: 'rgba(156, 163, 175, 0.6)',
            pointBackgroundColor: 'rgba(156, 163, 175, 0.6)',
            pointBorderColor: '#fff',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: 10
          },
          scales: {
            r: {
              beginAtZero: true,
              angleLines: {
                color: 'rgba(156, 163, 175, 0.2)' 
              },
              grid: {
                color: 'rgba(156, 163, 175, 0.2)',
                circular: true
              },
              pointLabels: {
                font: {
                  size: 11,
                  family: "'Poppins', sans-serif",
                  weight: 'bold'
                },
                color: '#9ca3af' // gray-400
              },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                display: false, // Hide numbers on axis for cleaner look
                stepSize: 20
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { size: 10, family: "'Poppins', sans-serif" },
                padding: 20
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleFont: { family: "'Poppins', sans-serif", size: 13 },
              bodyFont: { family: "'Poppins', sans-serif", size: 12 },
              padding: 12,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: (tooltipItems) => {
                  return allFeatures[tooltipItems[0].dataIndex].name;
                },
                label: (context) => `${context.dataset.label}: ${context.raw}%`
              }
            }
          }
        }
      });

      return () => {
        chartInstance.destroy();
      };
    }
  }, [competencyData]);

  // --- Tour Guide Effect ---
  useEffect(() => {
    if (!loading && user) {
      const tourKey = `hasSeenProfileTour-${user._id}`;
      const hasSeenTour = localStorage.getItem(tourKey);

      if (!hasSeenTour) {
        const driverObj = driver({
          showProgress: true,
          animate: true,
          steps: [
            {
              element: '#profile-header',
              popover: {
                title: 'Profil Pengguna',
                description: 'Ini adalah kartu identitasmu. Lihat level, avatar, dan progres levelmu di sini.'
              }
            },
            {
              element: '#profile-stats',
              popover: {
                title: 'Statistik Singkat',
                description: 'Ringkasan cepat tentang modul yang diselesaikan dan rata-rata skormu.'
              }
            },
            {
              element: '#certificate-section',
              popover: {
                title: 'Sertifikat',
                description: 'Jika kamu sudah menyelesaikan semua modul, kamu bisa mengunduh sertifikat di sini.'
              }
            },
            {
              element: '#competency-chart',
              popover: {
                title: 'Tingkat Penguasaan',
                description: 'Visualisasi tingkat penguasaan kompetensi materi '
              }
            },
            {
              element: '#profile-settings',
              popover: {
                title: 'Pengaturan Akun',
                description: 'Ubah informasi akun, password, dan preferensi tampilan (font) di sini.'
              }
            }
          ],
          onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("Apakah kamu yakin ingin mengakhiri tur pengenalan ini?")) {
              driverObj.destroy();
              localStorage.setItem(tourKey, 'true');
            }
          },
        });

        setTimeout(() => {
          driverObj.drive();
        }, 1500);
      }
    }
  }, [loading, user]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui profil");

      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);

      // Dispatch event agar komponen lain (seperti Navbar) segera memperbarui data user
      window.dispatchEvent(new Event("user-updated"));

      showAlert({
        title: "Sukses",
        message: "Profil berhasil diperbarui!",
        type: "alert",
      });
    } catch (err) {
      showAlert({
        title: "Gagal",
        message: err instanceof Error ? err.message : "Terjadi kesalahan",
        type: "alert",
      });
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showAlert({ title: "Gagal", message: "Konfirmasi password tidak cocok!", type: "alert" });
      return;
    }
    if (newPassword.length < 6) {
      showAlert({ title: "Gagal", message: "Password baru minimal 6 karakter.", type: "alert" });
      return;
    }

    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah password");

      showAlert({ title: "Sukses", message: "Password berhasil diubah!", type: "alert" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showAlert({
        title: "Gagal",
        message: err instanceof Error ? err.message : "Terjadi kesalahan",
        type: "alert",
      });
    }
  };

  const handleSettingsSave = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('materiFontSize', fontSize);
    localStorage.setItem('materiFontStyle', fontStyle);

    // Dispatch event for immediate update if needed elsewhere
    window.dispatchEvent(new Event('settings-updated'));

    // Trigger storage event manually for components listening to storage changes in the same tab
    window.dispatchEvent(new StorageEvent("storage", {
      key: "materiFontSize",
      newValue: fontSize,
      storageArea: localStorage,
      url: window.location.href,
    }));
    window.dispatchEvent(new StorageEvent("storage", {
      key: "materiFontStyle",
      newValue: fontStyle,
      storageArea: localStorage,
      url: window.location.href,
    }));

    showAlert({
      title: "Sukses",
      message: "Pengaturan berhasil disimpan!",
      type: "alert",
    });
  };

  const handleEditCertificateName = () => {
    showAlert({
      type: "confirm",
      title: "Info Nama Sertifikat",
      message: `Nama yang akan tercetak pada sertifikat adalah <strong>${name}</strong>. Anda dapat mengubahnya pada form 'Informasi Akun'.`,
      confirmText: "Mengerti",
    });
  };

  const handleDownloadCertificate = async () => {
    if (!user) {
      showAlert({ title: "Gagal", message: "Pengguna belum login.", type: "alert" });
      return;
    }
    if (overallProgress < 100) {
      showAlert({ title: "Gagal", message: "Anda belum menyelesaikan semua modul untuk mendapatkan sertifikat.", type: "alert" });
      return;
    }

    try {
      // Encode nama untuk memastikan karakter seperti spasi aman untuk URL
      const encodedName = encodeURIComponent(name);
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/certificate?name=${encodedName}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorText = await res.text(); // Coba baca pesan error dari respons
        throw new Error(`Gagal mengunduh sertifikat: ${errorText || res.statusText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; // Use certificateName for filename
      a.download = `Sertifikat_${name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showAlert({ title: "Sukses", message: "Sertifikat berhasil diunduh!", type: "alert" });

    } catch (err) {
      console.error("Error downloading certificate:", err);
      showAlert({
        title: "Gagal",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat mengunduh sertifikat.",
        type: "alert",
      });
    }
  };

  const overallProgress = useMemo(() => {
    if (!progressData || progressData.totalTopics === 0) return 0;
    return Math.round((progressData.completedTopics / progressData.totalTopics) * 100);
  }, [progressData]);

  const moduleStats = useMemo(() => {
    if (!progressData || !progressData.modules) return { completed: 0, total: 0 };
    const total = progressData.modules.length;
    const completed = progressData.modules.filter(m => m.progress === 100).length;
    return { completed, total };
  }, [progressData]);

  const averageScore = useMemo(() => {
    if (!competencyData) return 0;
    let total = 0;
    let count = 0;
    Object.values(competencyData).forEach(features => {
      features.forEach(f => {
        total += f.score;
        count++;
      });
    });
    return count > 0 ? Math.round(total / count) : 0;
  }, [competencyData]);

  const userLevel = useMemo(() => {
    if (!user?.learningLevel) return "Pemula";

    const level = user.learningLevel.toLowerCase();
    if (level === 'lanjutan' || level === 'lanjut') return "Mahir";
    if (level === 'menengah') return "Menengah";
    
    return "Pemula";
  }, [user]);

  const competencyComparison = useMemo(() => {
    if (!competencyData) return null;
    const allFeatures: CompetencyFeature[] = [];
    Object.values(competencyData).forEach(features => allFeatures.push(...features));
    
    if (allFeatures.length === 0) return null;

    const userTotal = allFeatures.reduce((acc, f) => acc + f.score, 0);
    const classTotal = allFeatures.reduce((acc, f) => acc + f.average, 0);
    const diff = (userTotal - classTotal) / allFeatures.length;

    if (diff > 5) return { text: "Di atas rata-rata", color: "text-green-500" };
    if (diff < -5) return { text: "Di bawah rata-rata", color: "text-yellow-500" };
    return { text: "Setara dengan rata-rata", color: "text-blue-500" };
  }, [competencyData]);

  if (loading) return <div className="p-6 text-center text-gray-500">Memuat...</div>;
  if (!user) return <div className="p-6 text-center text-gray-500">Silakan login untuk melihat profil.</div>;

  return (



















    <div className="w-full font-sans p-2 mt-20">
      <Breadcrumb paths={[{ name: "Dashboard", href: "/dashboard" }, { name: "Profil", href: "#" }]} />
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-6 mb-6">
      </h1>
      <style jsx global>{`
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* === GAME PROFILE HEADER === */}
      <motion.div
        id="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl overflow-hidden mb-8 relative"
      >
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 opacity-90"></div>
        <div className="absolute top-0 right-0 w-full h-32 bg-[url('/pattern.svg')] opacity-10"></div>

        <div className="relative px-6 pb-6 pt-16 md:pt-20 flex flex-col lg:flex-row gap-8 items-center lg:items-start">

          {/* Left: Avatar & Identity */}
          <div className="flex flex-col items-center lg:items-center gap-4 min-w-[240px]">
            <div className="relative group">
              <div className="rounded-full p-1.5 bg-white dark:bg-gray-900 shadow-lg">
                <Avatar user={user} size={140} className="rounded-full object-cover border-4 border-blue-50 dark:border-gray-800 w-28 h-28" />
              </div>
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md border-2 border-white dark:border-gray-900 flex items-center gap-1 whitespace-nowrap">
                <Trophy size={12} className="fill-current" />
                <span>{userLevel}</span>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>

            {/* Level Progress */}
            <div className="w-full max-w-[200px] space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span>Level Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Middle: Stats & Actions */}
          <div className="flex-1 w-full lg:border-l lg:border-r border-gray-100 dark:border-gray-800 lg:px-8 flex flex-col justify-center">
            <div id="profile-stats" className="grid grid-cols-1 min-[350px]:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex justify-between items-center w-full sm:w-auto">
                  <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-300">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white sm:hidden">{moduleStats.completed} / {moduleStats.total}</p>
                </div>
                <div className="w-full">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-0.5 sm:mb-0">Modul Selesai</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">{moduleStats.completed} / {moduleStats.total}</p>
                  {progressData && (
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 leading-tight">
                      {progressData.completedTopics} dari {progressData.totalTopics} topik selesai
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-2xl border border-purple-100 dark:border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex justify-between items-center w-full sm:w-auto">
                  <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-800 rounded-xl text-purple-600 dark:text-purple-300">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white sm:hidden">{averageScore}%</p>
                </div>
                <div className="w-full">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-0.5 sm:mb-0">Rata-rata Skor</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">{averageScore}%</p>
                  {competencyComparison && (
                    <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 leading-tight ${competencyComparison.color}`}>
                      {competencyComparison.text} kelas
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div id="certificate-section" className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Award size={18} className="text-amber-500" />
                  Sertifikat Kelulusan
                </h3>
                <Info onClick={handleEditCertificateName} size={16} className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {overallProgress < 100
                  ? "Selesaikan semua modul pembelajaran untuk membuka sertifikat eksklusif."
                  : "Selamat! Anda telah menyelesaikan semua modul. Sertifikat siap diunduh."}
              </p>
              <button
                onClick={overallProgress === 100 ? handleDownloadCertificate : undefined}
                disabled={overallProgress < 100}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${overallProgress === 100
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  }`}
              >
                {overallProgress === 100 ? <Download size={16} /> : <Shield size={16} />}
                {overallProgress === 100 ? "Unduh Sertifikat Sekarang" : "Sertifikat Terkunci"}
              </button>
            </div>
          </div>

          {/* Right: Radar Chart (Stats) */}
          <div id="competency-chart" className="w-full lg:w-1/3 flex flex-col">
            <div className="h-full bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Decorative background blur */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

              <div className="w-full flex justify-between items-start mb-4 z-10">
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                    Tingkat Penguasaan
                  </h3>
                  {competencyComparison ? (
                    <div className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${competencyComparison.color}`}>
                      {competencyComparison.text.includes("atas") ? <TrendingUp size={14} /> : competencyComparison.text.includes("bawah") ? <TrendingDown size={14} /> : <Activity size={14} />}
                      <span>{competencyComparison.text}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Analisis performa belajar</p>
                  )}
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl ring-1 ring-indigo-100 dark:ring-indigo-800/50 shadow-sm text-indigo-600 dark:text-indigo-400">
                  <Hexagon size={20} />
                </div>
              </div>

            <div className="relative w-full aspect-square z-10 max-h-[260px] mx-auto mt-auto mb-auto">
              {competencyData ? (
                <canvas ref={chartRef} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 m-4">
                  <TrendingUp size={24} className="mb-2 opacity-50" />
                  <span>Belum ada data statistik</span>
                </div>
              )}
            </div>
          </div>

        </div>
        </div>
      </motion.div>


      {/* === PROFILE & PASSWORD CARD WITH TABS === */}
      <motion.div
        id="profile-settings"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-4 sm:p-6 mb-5"
      >
        {/* Tab Headers */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hidden">
          <nav className="-mb-px flex space-x-4 sm:space-x-6 min-w-max" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("info")}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'info'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                }`}
            >
              Informasi Akun
            </button>
            {user.hasPassword && (
              <button
                onClick={() => setActiveTab("password")}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'password'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                  }`}
              >
                Ubah Password
              </button>
            )}
            <button
              onClick={() => setActiveTab("settings")}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                }`}
            >
              Pengaturan
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {/* Informasi Akun Tab */}















          {activeTab === "info" && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="flex flex-col items-center">
                  {avatarPreview.startsWith("blob:") ? (
                    <img
                      src={avatarPreview}
                      alt="Preview Avatar"
                      className="rounded-full object-cover border-4 border-blue-100 dark:border-gray-600 shadow-md w-28 h-28"
                    />
                  ) : (
                    <Avatar user={user} size={256}  className="border-4 border-blue-100 dark:border-gray-600 shadow-md rounded-full w-28 h-28 object-cover" />
                  )}
                  <label htmlFor="avatarInput" className="cursor-pointer mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                    Ubah Foto
                  </label>
                  <input id="avatarInput" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PNG, JPG, maks 2MB.</p>
                </div>
                <div className="flex-1 w-full">
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Nama Lengkap</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
                    <input type="email" value={email} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none" disabled />
                  </div>
                </div>
              </div>
              <div className="text-right pt-3">
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-md shadow transition">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}

































          {/* Ubah Password Tab */}
          {activeTab === "password" && user.hasPassword && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Password Saat Ini</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Password Baru</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Konfirmasi Password Baru</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              <div className="text-right">
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium text-md shadow transition">
                  Ubah Password
                </button>
              </div>
            </form>
          )}

          {/* Pengaturan Tampilan Tab */}
          {activeTab === "settings" && (
            <form onSubmit={handleSettingsSave} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Jenis Font Materi</label>
                  <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  >
                    <option value="font-poppins">Poppins (Default)</option>
                    <option value="!font-['Arial']">Arial</option>
                    <option value="!font-['Times_New_Roman']">Times New Roman</option>

                    <option value="!font-['Calibri']">Calibri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Ukuran Font Materi</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  >
                    <option value="14px">Kecil (14px)</option>
                    <option value="16px">Normal (16px)</option>
                    <option value="18px">Sedang (18px)</option>
                    <option value="20px">Besar (20px)</option>
                    <option value="24px">Sangat Besar (24px)</option>
                  </select>
                </div>
              </div>

              {/* Preview Section */}
              <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview Tampilan:</p>
                <div
                  className={`p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 transition-all duration-300 ${fontStyle}`}
                  style={{ fontSize: fontSize }}
                >
                  <h4 className="font-bold mb-2">Contoh Judul Materi</h4>
                  <p className="leading-relaxed">
                    Ini adalah contoh paragraf untuk melihat bagaimana materi akan ditampilkan dengan pengaturan font yang Anda pilih.
                    Kenyamanan membaca sangat penting untuk proses belajar yang efektif.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium text-md shadow transition">
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ProfilePage = () => {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Memuat...</div>}>
      <ProfileContent />
    </Suspense>
  );
};

export default ProfilePage;

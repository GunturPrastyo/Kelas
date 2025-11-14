"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import Avatar from "@/components/Avatar"; // Ganti Image dengan komponen Avatar
import Breadcrumb from "@/components/Breadcrumb";
import { motion } from "framer-motion";
import { Award, Download, Star } from "lucide-react";

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
  avatar: string;
  hasPassword?: boolean; // Tambahkan properti ini, buat opsional untuk kompatibilitas
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("/user-placeholder.png");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const userData: User = JSON.parse(userRaw);
      const displayUserName = userData.name || "Pengguna"; // Fallback jika nama kosong
      setUser(userData);
      setName(displayUserName);
      setEmail(userData.email);
      // Logika avatar sekarang ditangani oleh komponen Avatar dan state avatarPreview
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

    if (userRaw) {
      fetchProgress();
    }
  }, []);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

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
      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok!" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password baru minimal 6 karakter." });
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

      setMessage({ type: "success", text: "Password berhasil diubah!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    }
  };

  const handleDownloadCertificate = async () => {
    if (!user) {
      setMessage({ type: "error", text: "Pengguna belum login." });
      return;
    }
    if (overallProgress < 100) {
      setMessage({ type: "error", text: "Anda belum menyelesaikan semua modul untuk mendapatkan sertifikat." });
      return;
    }

    try {
      setMessage(null);
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/certificate`, {
        method: "GET",
        // Penting: responseType 'blob' untuk mengunduh file
        headers: {
          'Content-Type': 'application/json', // Tetap kirim header ini jika diperlukan oleh authFetch
        },
      });

      if (!res.ok) {
        const errorText = await res.text(); // Coba baca pesan error dari respons
        throw new Error(`Gagal mengunduh sertifikat: ${errorText || res.statusText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sertifikat_${user.name.replace(/\s+/g, '_')}.pdf`; // Nama file dengan nama pengguna
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Sertifikat berhasil diunduh!" });

    } catch (err) {
      console.error("Error downloading certificate:", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat mengunduh sertifikat.",
      });
    }
  };

  const overallProgress = useMemo(() => {
    if (!progressData || progressData.totalTopics === 0) return 0;
    return Math.round((progressData.completedTopics / progressData.totalTopics) * 100);
  }, [progressData]);

  if (loading) return <div className="p-6 text-center text-gray-500">Memuat...</div>;
  if (!user) return <div className="p-6 text-center text-gray-500">Silakan login untuk melihat profil.</div>;

  return (
    <div className="w-full font-sans p-5">
      <Breadcrumb paths={[{ name: "Dashboard", href: "/dashboard" }, { name: "Edit Profil", href: "#" }]} />
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-6 mb-6">
        Pengaturan Profil
      </h1>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 mb-6 rounded-xl text-center font-medium shadow ${message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
            }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* === KARTU SERTIFIKAT & PROGRES === */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 mb-5"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          {/* === LEFT SIDE === */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/10 rounded-xl">
                <Award className="text-blue-600 dark:text-blue-400" size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Sertifikat Belajar
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Kumpulkan XP dan selesaikan modul untuk membuka sertifikat.
                </p>
              </div>
            </div>

            {/* XP & Percentage */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-600/10 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-sm">{progressData?.completedTopics || 0} XP</span>
              </div>

              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {overallProgress}% Selesai
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>

          {/* === RIGHT SIDE ACTION BUTTON === */}
          <button
            onClick={overallProgress === 100 ? handleDownloadCertificate : undefined}
            disabled={overallProgress < 100}
            className={`
        flex items-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-md transition-all
        ${overallProgress < 100
                ? "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-[1.03]"
              }
      `}
          >
            <Download size={18} />
            {overallProgress < 100 ? "Selesaikan Semua Modul" : "Unduh Sertifikat"}
          </button>

        </div>
      </motion.div>


      {/* === PROFILE CARD === */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 mb-5  "
      >
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b pb-3">
            Informasi Akun
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-8 pt-4">
            <div className="flex flex-col items-center">
              {avatarPreview.startsWith("blob:") ? (
                <img
                  src={avatarPreview}
                  alt="Preview Avatar"
                  className="rounded-full object-cover border-4 border-blue-100 dark:border-gray-600 shadow-md w-28 h-28"
                />
              ) : (
                <Avatar user={user} size={112} className="border-4 border-blue-100 dark:border-gray-600 shadow-md" />
              )}

              <label
                htmlFor="avatarInput"
                className="cursor-pointer mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Ubah Foto
              </label>
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PNG, JPG atau JPEG. Maks 2MB.
              </p>
            </div>

            <div className="flex-1 w-full">
              <div className="mb-4">
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="text-right pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </motion.div>

      {/* === PASSWORD CARD === */}
      {user.hasPassword && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b pb-3">
              Ubah Password
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <button
                type="submit"
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow transition"
              >
                Ubah Password
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;

"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo } from "react";
import { authFetch } from "@/lib/authFetch";
import Avatar from "@/components/Avatar"; // Ganti Image dengan komponen Avatar
import Breadcrumb from "@/components/Breadcrumb";
import { motion } from "framer-motion";
import { Award, Download, Star, Info } from "lucide-react";
import { useAlert } from "@/context/AlertContext";

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
}

const ProfilePage = () => {
  const { showAlert } = useAlert();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

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

  if (loading) return <div className="p-6 text-center text-gray-500">Memuat...</div>;
  if (!user) return <div className="p-6 text-center text-gray-500">Silakan login untuk melihat profil.</div>;

  return (
  
    

    















    <div className="w-full font-sans p-2 mt-20">
      <Breadcrumb paths={[{ name: "Dashboard", href: "/dashboard" }, { name: "Profil", href: "#" }]} />
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-6 mb-6">
    
      </h1>

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
                <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Sertifikat Apresiasi
                </h2>
                 <Info onClick={handleEditCertificateName} size={16} className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"/>
                 </div>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Selesaikan semua modul untuk membuka sertifikat.</p>
              </div>
            </div>

            {/* XP & Percentage */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-600/10 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-sm">{overallProgress} XP</span>
              </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={overallProgress === 100 ? handleDownloadCertificate : undefined}
              disabled={overallProgress < 100}
              className={`
          flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold shadow-md transition-all
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
        </div>
      </motion.div>


      {/* === PROFILE & PASSWORD CARD WITH TABS === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 mb-5"
      >
        {/* Tab Headers */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
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
                    <Avatar user={user} size={256} className="border-4 border-blue-100 dark:border-gray-600 shadow-md rounded-full w-28 h-28" />
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

export default ProfilePage;

"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { authFetch } from "@/lib/authFetch";
import Avatar from "@/components/Avatar"; // Ganti Image dengan komponen Avatar
import Breadcrumb from "@/components/Breadcrumb";
import { motion } from "framer-motion";

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
          className={`p-4 mb-6 rounded-xl text-center font-medium shadow ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* === PROFILE CARD === */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-10 border border-gray-200 dark:border-gray-700"
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
                JPG, PNG, atau GIF. Maks 2MB.
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

"use client";

import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect, Suspense } from "react";
import validator from "validator";

import { Eye, EyeOff } from "lucide-react";

// Define a type for the user data for better type safety
interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
  // Add other user properties as needed
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Cek URL query params untuk email (dari verifikasi email)
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    // Cek sessionStorage untuk kredensial dari halaman registrasi
    const storedCredentials = sessionStorage.getItem('loginCredentials');

    if (storedCredentials) {
      const { email, password } = JSON.parse(storedCredentials);

      setEmail(email || "");
      setPassword(password || "");
      setSuccessMessage("Pembuatan akun berhasil! Silakan masuk.");

      // Hapus kredensial dari sessionStorage setelah digunakan
      sessionStorage.removeItem('loginCredentials');
    }
  }, [searchParams]); // Jalankan saat searchParams berubah

  // Reusable function to handle post-authentication logic
  const handleAuthSuccess = (user: User, token: string) => {
    // Simpan token dan data user
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);

    // Arahkan sesuai role
    if (user.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  };
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.user || !data.token) {
        throw new Error(data.message || "Login Google gagal, token tidak diterima.");
      }

      handleAuthSuccess(data.user, data.token);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Login gagal");
      } else {
        setError("Terjadi kesalahan yang tidak diketahui");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validasi format email di sisi klien
    if (!validator.isEmail(email)) {
      setError("Format email yang Anda masukkan tidak valid.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.user || !data.token) {
        throw new Error(data.message || "Login gagal, token tidak diterima.");
      }

      handleAuthSuccess(data.user, data.token);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Login gagal. Periksa kembali email dan password Anda.");
      } else {
        setError("Terjadi kesalahan yang tidak diketahui saat login.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div className="flex items-center justify-center min-h-screen bg-[#EAF0FF] dark:bg-gray-900 p-4">

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-5xl w-full rounded-3xl shadow-2xl overflow-hidden border border-white/30">

          {/* === MOBILE HEADER DENGAN WAVE === */}
          <div className="md:hidden relative w-full h-auto bg-gradient-to-br from-blue-600 to-indigo-600 z-0">
            <img
              src="/login-illustration.webp"
              alt="Ilustrasi Belajar"
              width={800}
              height={800}
              className="w-full h-auto object-containt rounded-xl"
            />

            {/* WAVE MENYATU KE FORM (BG SAMA PERSIS) */}
          </div>
         

          {/* === FORM LOGIN === */}
          <div className="p-10 md:p-14 bg-[#EAF0FF] dark:bg-gray-900 rounded-4xl z-30 -mt-5 sm:m-0">

            <div className="flex justify-center mb-6">
              <img src="/logo1.webp" alt="Logo" width={256} height={256} className="w-18 h-auto drop-shadow-md" />
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Selamat Datang 
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
              Silakan masuk ke akun kamu
            </p>

            {error && (
              <div className="text-red-700 bg-red-100 p-3 text-center rounded-lg mb-4 text-sm border border-red-300">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-green-800 bg-green-100 p-3 text-center rounded-lg mb-4 text-sm border border-green-300">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-5">

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Masukkan email Anda"
                  className="w-full px-4 py-2 mt-1 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password Anda"
                    className="w-full px-4 py-2 mt-1 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 dark:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline">
                    Lupa Password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 font-semibold text-white rounded-xl bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 shadow-md transition"
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-400/50"></div>
              <span className="mx-2 text-sm text-gray-600 dark:text-gray-300">atau</span>
              <div className="flex-grow border-t border-gray-400/50"></div>
            </div>

            <div
              className="flex justify-center"
              style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}
            >
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => {
                  if (!isLoading) setError("Login Google gagal. Silakan coba lagi.");
                }}
                theme="outline"
                shape="rectangular"
                width="250"
              />
            </div>

            <p className="text-center text-sm text-gray-700 dark:text-gray-300 mt-4">
              Belum punya akun?{" "}
              <a href="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Daftar di sini
              </a>
            </p>

          </div>

          {/* === DESKTOP ILUSTRASI === */}
          <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 p-8">
            <img
              src="/login-illustration.webp"
              alt="Ilustrasi Belajar"
              width={600}
              height={600}
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>

        </div>
      </div>
    </GoogleOAuthProvider>





  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

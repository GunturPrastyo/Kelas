"use client";

import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect, Suspense } from "react";
import validator from "validator";

import { Eye, EyeOff, Mail, Lock } from "lucide-react";

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
  
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenResponse.access_token }),
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
    },
    onError: () => setError("Login Google gagal."),
  });

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
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Masukkan email Anda"
                    className="w-full pl-10 px-4 py-2 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password Anda"
                    className="w-full pl-10 px-4 py-2 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-10"
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
              <button
                type="button"
                onClick={() => googleLogin()}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Masuk dengan Google
              </button>
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
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </GoogleOAuthProvider>
  );
}

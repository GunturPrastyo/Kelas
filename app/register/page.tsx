"use client";

import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, FormEvent } from "react";
import validator from "validator";
import { Eye, EyeOff, Mail, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleGoogleRegister = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.user || !data.token) {
        throw new Error(data.message || "Registrasi Google gagal.");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validator.isEmail(email)) {
      setError("Format email tidak valid.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registrasi gagal.");
      }

      // Tampilkan UI verifikasi email alih-alih redirect langsung
      setVerificationSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat registrasi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div className="flex items-center justify-center min-h-screen bg-[#EAF0FF] dark:bg-gray-900 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-5xl w-full rounded-3xl shadow-2xl overflow-hidden border border-white/30 ">
          
          <div className="p-10 md:p-14 bg-[#EAF0FF] dark:bg-gray-900 order-last md:order-first z-20 rounded-4xl -mt-10 sm:m-0">
            {verificationSent ? (
              <div className="flex flex-col items-center justify-center text-center h-full animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Mail className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  Cek Email Anda
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  Kami telah mengirimkan tautan verifikasi ke <br />
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span>.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Silakan klik tautan di dalam email tersebut untuk mengaktifkan akun Anda agar bisa login.
                </p>
                <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Sudah verifikasi? Masuk di sini
                </Link>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-5">
                  <img src="/logo1.webp" alt="Logo" width={256} height={256} className="w-20 h-auto drop-shadow-md" />
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                  Buat Akun Baru
                </h2>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
                  Daftar untuk mulai belajar
                </p>

                {error && (
                  <div className="text-red-700 bg-red-100 p-3 text-center rounded-lg mb-4 text-sm border border-red-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nama Lengkap</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-4 py-2 mt-1 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Masukkan email Anda"
                      className="w-full px-4 py-2 mt-1 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Minimal 8 karakter"
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
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Konfirmasi Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Ulangi password"
                      className="w-full px-4 py-2 mt-1 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 font-semibold text-white rounded-xl bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 shadow-md transition"
                  >
                    {isLoading ? "Memproses..." : "Daftar"}
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
                    onSuccess={handleGoogleRegister}
                    onError={() => {
                      if (!isLoading) setError("Registrasi Google gagal.");
                    }}
                    theme="outline"
                    shape="rectangular"
                    width="250"
                    text="signup_with"
                  />
                </div>

                <p className="text-center text-sm text-gray-700 dark:text-gray-300 mt-4">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Masuk di sini
                  </Link>
                </p>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 p-8">
            <img
              src="/register-illustration.webp"
              alt="Ilustrasi Daftar"
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
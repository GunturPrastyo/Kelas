"use client";

import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRegister = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validasi format email di sisi klien
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Silakan masukkan format email yang valid.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Registrasi gagal");

      // Cek apakah backend mengirim kredensial, lalu simpan di sessionStorage
      if (data.loginCredentials) {
        sessionStorage.setItem('loginCredentials', JSON.stringify(data.loginCredentials));
      }

      // Arahkan ke halaman login
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat registrasi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-indigo-100 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-5xl w-full bg-white/30 dark:bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">

          {/* FORM REGISTER */}
          <div className="p-10 md:p-14">
            <div className="flex justify-center mb-5">
              <Image src="/logo1.png" alt="Logo" width={256} height={256} className="w-20 h-auto drop-shadow-md" />
            </div>

            <h2 className="text-3xl font-extrabold text-center text-gray-800 dark:text-white mb-6">
              Buat Akun Baru
            </h2>

            {error && (
              <div className="text-red-700 bg-red-100 p-3 text-center rounded-lg mb-4 text-sm border border-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleManualRegister} className="space-y-5">

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Masukkan nama Anda"
                  className="w-full px-4 py-3 mt-1 rounded-xl bg-white/70 dark:bg-gray-900 
                             border border-gray-300 dark:border-gray-700 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

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
                  className="w-full px-4 py-3 mt-1 rounded-xl bg-white/70 dark:bg-gray-900 
                             border border-gray-300 dark:border-gray-700 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    placeholder="Masukkan password"
                    className="w-full px-4 py-3 mt-1 rounded-xl bg-white/70 dark:bg-gray-900 
                               border border-gray-300 dark:border-gray-700 
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 font-semibold text-white rounded-xl 
                           bg-indigo-600 hover:bg-indigo-700 
                           focus:ring-4 focus:ring-indigo-300 
                           disabled:bg-gray-400 shadow-md transition"
              >
                {isLoading ? "Memproses..." : "Daftar"}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-400/50"></div>
              <span className="mx-4 text-sm text-gray-600 dark:text-gray-300">atau</span>
              <div className="flex-grow border-t border-gray-400/50"></div>
            </div>

            {/* GOOGLE REGISTER */}
            <div
              className="flex justify-center"
              style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? "none" : "auto" }}
            >
              <GoogleLogin
                onSuccess={handleGoogleRegister}
                onError={() => setError("Registrasi Google gagal.")}
                theme="outline"
                width="320px"
              />
            </div>

            <p className="text-center text-sm text-gray-700 dark:text-gray-300 mt-6">
              Sudah punya akun?{" "}
              <a
                href="/login"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Masuk di sini
              </a>
            </p>
          </div>

          {/* KANAN ILUSTRASI */}
          <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-8">
            <Image
              src="/register-illustration.png"
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

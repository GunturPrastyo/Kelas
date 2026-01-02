"use client";

import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google";
import Image from "next/image";
import { useRouter } from "next/navigation"; import Link from "next/link";
import { useState, FormEvent } from "react";
import validator from "validator";
import { Eye, EyeOff } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

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

    // Validasi nama tidak boleh kosong
    if (!name.trim()) {
      setError("Nama lengkap harus diisi.");
      setIsLoading(false);
      return;
    }

    // Validasi email tidak boleh kosong
    if (!email.trim()) {
      setError("Email harus diisi.");
      setIsLoading(false);
      return;
    }

    // Validasi format email di sisi klien menggunakan library validator
    if (!validator.isEmail(email)) {
      setError("Silakan masukkan format email yang valid.");
      setIsLoading(false);
      return;
    }

    // Validasi password tidak boleh kosong
    if (!password) {
      setError("Password harus diisi.");
      setIsLoading(false);
      return;
    }

    // Validasi password
    if (password.length < 8) {
      setError("Password minimal harus 8 karakter.");
      setIsLoading(false);
      return;
    }

    // Validasi panjang maksimum password
    if (password.length > 50) {
      setError("Password tidak boleh lebih dari 50 karakter.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      setIsLoading(false);
      return;
    }

    if (!turnstileToken) {
      setError("Mohon selesaikan verifikasi keamanan (CAPTCHA).");
      setIsLoading(false);
      return;
    }


    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword, cfTurnstileToken: turnstileToken }),
      });

      const data = await res.json();

      // If the response is not OK, throw an error with the message from the backend.
      // This will be caught by the catch block and displayed to the user.
      if (!res.ok) {
        throw new Error(data.message || "Registrasi gagal. Silakan coba lagi.");
      }

      // On success, check if the backend sent credentials to pre-fill the login form.
      if (data.loginCredentials) {
        sessionStorage.setItem('loginCredentials', JSON.stringify(data.loginCredentials));
      }

      // Redirect to the login page only after a successful registration.
      router.push("/login");
    } catch (err) {
      // The error message from the backend will now be displayed in the error div.
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
            <div className="flex justify-center mb-5">
              <Image src="/logo1.png" alt="Logo" width={256} height={256} className="w-20 h-auto drop-shadow-md" />
            </div>

            <h2 className="text-xl font-extrabold text-center text-gray-800 dark:text-white mb-6">
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
                  className="w-full px-4 py-2 mt-1 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                  className="w-full px-4 py-2 mt-1 rounded-xl bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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

              {/* Confirm Password */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Ulangi Password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    maxLength={50}
                    placeholder="Ulangi password Anda"
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

              {/* Cloudflare Turnstile Widget */}
              <div className="flex justify-center pt-2">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setError("Gagal memuat verifikasi keamanan.")}
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

            <div className="flex items-center my-4">
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
                width="256px"
              />
            </div>

            <p className="text-center text-sm text-gray-700 dark:text-gray-300 mt-4">
              Sudah punya akun?{" "}
              <Link
                href="/login" legacyBehavior={false}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>

          {/* KANAN ILUSTRASI */}
          <div className="flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 p-5 z-0">
            <Image
              src="/register-illustration.png"
              alt="Ilustrasi Daftar"
              width={800}
              height={800}
              className="mb-10 w-full h-auto drop-shadow-xl"
            />
          </div>

        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

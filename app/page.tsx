"use client";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
        credentials: "include", // Kirim cookie dengan request
      });

      const data = await res.json();

      if (!res.ok || !data.user) throw new Error(data.message || "Data pengguna tidak ditemukan setelah login.");

      // Simpan token dan data user
      localStorage.setItem("user", JSON.stringify(data.user));

      // Arahkan sesuai role
      if (data.user && data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Kirim cookie dengan request
      });

      const data = await res.json();

      if (!res.ok || !data.user) throw new Error(data.message || "Data pengguna tidak ditemukan setelah login.");
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user && data.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login gagal. Periksa kembali email dan password Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center p-4"
        style={{ backgroundImage: "url('')" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          {/* Kolom Kiri: Form Login */}
          <div className="p-8 md:p-12">
            <div className="flex justify-center mb-6">
              <Image src="/logo1.png" alt="Logo" width={60} height={60} />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Selamat Datang
            </h2>

            {error && (
              <div className="text-red-600 bg-red-100 p-3 text-center rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                  placeholder="Masukkan email Anda"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                  placeholder="Masukkan password Anda"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 transition-colors"
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-400"></div>
              <span className="mx-4 text-sm text-gray-600">atau masuk dengan</span>
              <div className="flex-grow border-t border-gray-400"></div>
            </div>

            <div className="flex justify-center" style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => {
                  if (!isLoading) setError("Login Google gagal. Silakan coba lagi.");
                }}
                theme="outline"
                shape="rectangular"
                width="320px"
              />
            </div>
          </div>
          {/* Kolom Kanan: Ilustrasi */}
          <div className="hidden md:flex items-center justify-center bg-blue-600/50 p-8">
            <Image src="/login-illustration.png" alt="Ilustrasi Belajar" width={600} height={600} className="w-full h-auto " />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

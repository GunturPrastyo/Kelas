"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login gagal, silakan coba lagi.");
      }

      // Simpan token dan data user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect ke dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6 border border-gray-200"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Masuk</h2>
          <p className="text-gray-500 mt-1">E-Learning Personalisasi</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="contoh@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded-lg text-white font-semibold transition ${
            loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Memproses..." : "Masuk Sekarang"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Belum punya akun?{" "}
          <a
            href="#"
            className="text-indigo-600 hover:underline font-medium"
          >
            Hubungi admin
          </a>
        </p>
      </form>
    </div>
  );
}

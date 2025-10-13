"use client";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // Simpan token dan data user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Arahkan sesuai role
      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login gagal");
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Masuk dengan Akun Siswa
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Gunakan akun belajar Anda
          </p>

          {error && (
            <div className="text-red-600 bg-red-50 p-2 text-center rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError("Login Google gagal")}
              useOneTap
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

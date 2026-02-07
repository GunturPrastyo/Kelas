"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan.");
      return;
    }

    const verify = async () => {
      try {
        // Panggil endpoint backend untuk memverifikasi token
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        
        let data;
        try {
          data = await res.json();
        } catch (err) {
         
          throw new Error(`Gagal memverifikasi (Status: ${res.status}). Pastikan server berjalan dan route tersedia.`);
        }

        if (!res.ok) {
          throw new Error(data.message || "Verifikasi gagal atau token kadaluarsa.");
        }

        setStatus("success");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat verifikasi.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
      {status === "loading" && (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Memverifikasi Email...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Mohon tunggu sebentar.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center animate-in zoom-in duration-300 py-4">
          <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Email Terverifikasi!</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2 mb-8">
            Akun Anda telah berhasil diaktifkan. Sekarang Anda dapat masuk ke dalam aplikasi.
          </p>
          <Link 
            href="/login" 
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition w-full shadow-lg shadow-blue-500/30"
          >
            Masuk Sekarang
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center animate-in zoom-in duration-300 py-4">
          <XCircle className="w-20 h-20 text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Verifikasi Gagal</h2>
          <p className="text-red-600 dark:text-red-400 mt-4 mb-8 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl w-full border border-red-100 dark:border-red-800">
            {message}
          </p>
          <Link href="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Kembali ke Registrasi
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF0FF] dark:bg-gray-900 p-4">
      <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
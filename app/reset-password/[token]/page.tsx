"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const params = useParams();
  const router = useRouter();
  // Mengambil token dari URL
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Konfirmasi password tidak cocok.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // Mengirim request PUT ke backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/reset-password/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        // Redirect ke login setelah 3 detik
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Gagal mereset password.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Terjadi kesalahan jaringan.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#EAF0FF] dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-[#EAF0FF] dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/30 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sukses!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">{message}</p>
          <div className="animate-pulse text-sm text-blue-600 dark:text-blue-400 font-medium">
            Mengalihkan ke halaman login...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#EAF0FF] dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-[#EAF0FF] dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/30 p-8 sm:p-10 relative">
        
        <div className="flex justify-center mb-6">
          <img src="/logo1.png" alt="Logo" width={150} height={150} className="w-20 h-auto drop-shadow-md" />
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Reset Password
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
          Silakan buat password baru untuk akunmu.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Password Baru</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-4 py-2 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400 pr-10"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Konfirmasi Password</label>
            <div className="relative">
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                className="w-full px-4 py-2 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400 pr-10"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div className="text-red-700 bg-red-100 p-3 text-center rounded-lg text-sm border border-red-300">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 font-semibold text-white rounded-xl bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 shadow-md transition flex justify-center items-center"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : 'Ubah Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
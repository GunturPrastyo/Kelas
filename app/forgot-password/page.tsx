"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                // Cek flag success dari backend (untuk menangani error logis dengan status 200)
                if (data.success === false) {
                    setErrorMessage(data.message || 'Terjadi kesalahan.');
                    setStatus('error');
                } else {
                    setStatus('success');
                }
            } else {
                setErrorMessage(data.message || 'Terjadi kesalahan.');
                setStatus('error');
            }
        } catch (error) {
            setErrorMessage('Terjadi kesalahan jaringan. Silakan coba lagi.');
            setStatus('error');
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cek Email Anda</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                        Jika akun dengan email <strong>{email}</strong> terdaftar, kami telah mengirimkan instruksi untuk mereset password.
                    </p>
                    <Link href="/login" className="inline-block w-full py-3 font-semibold text-white rounded-xl bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-md transition">
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#EAF0FF] dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-[#EAF0FF] dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/30 p-8 sm:p-10 relative">

                <div className="flex justify-center mb-6">
                    <Image src="/logo1.webp" alt="Logo" width={150} height={150} className="w-20 h-auto drop-shadow-md" />
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Lupa Password?
                </h2>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
                    Masukkan email Kamu dan kami akan mengirimkan link untuk mereset password akun Kamu.
                </p>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {status === 'error' && (
                        <div className="text-red-700 bg-red-100 p-3 text-center rounded-lg text-sm border border-red-300">
                            {errorMessage}
                        </div>
                    )}
                    <div>
                        <label htmlFor="email-address" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Email</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full px-4 py-2 rounded-xl bg-white border border-gray-300 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400"
                            placeholder="Masukkan alamat email Anda"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={status === 'loading'}
                        />
                    </div>



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
                                    Mengirim...
                                </>
                            ) : 'Kirim Link Reset'}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline">
                            Kembali ke Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
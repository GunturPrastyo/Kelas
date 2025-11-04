"use client";

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { authFetch } from '../../../lib/authFetch';
import { Trash2, UserPlus, Users, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    avatar?: string;
    createdAt: string;
}

type NotificationType = {
    type: 'success' | 'error';
    message: string;
};

/**
 * Helper function to determine the correct avatar URL.
 * @param user - The user object.
 * @returns A string representing the avatar URL.
 */
const getAvatarUrl = (user: User): string => {
    // 1. If avatar is a full URL (e.g., from Google), use it directly.
    if (user.avatar && user.avatar.startsWith('http')) {
        return user.avatar;
    }
    // 2. If avatar is a filename, construct the URL to the backend.
    if (user.avatar) {
        return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.avatar}`;
    }
    // 3. If no avatar, generate an initials-based avatar from ui-avatars.com.
    const encodedName = encodeURIComponent(user.name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&rounded=true`;
};

export default function ManajemenPenggunaPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<NotificationType | null>(null);

    // State untuk form tambah user
    const [accountType, setAccountType] = useState<'google' | 'manual'>('google');
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
            if (!response.ok) {
                throw new Error('Gagal memuat data pengguna');
            }
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            showNotification('error', error instanceof Error ? error.message : 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => {
            setNotification(null);
        }, 5000); // Notifikasi hilang setelah 5 detik
    };

    const handleAddUser = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Jika akun google, nama diambil dari email. Jika manual, dari input.
        const finalName = accountType === 'google' ? newEmail.split('@')[0] : newName;

        try {
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: finalName, email: newEmail, role: newRole }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Gagal menambahkan pengguna');
            }

            showNotification('success', `Pengguna "${data.user.name}" berhasil ditambahkan.`);
            setIsModalOpen(false);
            fetchUsers(); // Muat ulang daftar pengguna

            // Reset form
            setNewName('');
            setNewEmail('');
            setNewRole('user');
            setAccountType('google');

        } catch (error) {
            console.error(error);
            showNotification('error', error instanceof Error ? error.message : 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}"? Tindakan ini tidak dapat dibatalkan.`)) {
            try {
                const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Gagal menghapus pengguna');
                }

                showNotification('success', data.message);
                fetchUsers(); // Muat ulang daftar pengguna

            } catch (error) {
                console.error(error);
                showNotification('error', error instanceof Error ? error.message : 'Terjadi kesalahan');
            }
        }
    };

    return (
        <div>
            {/* Notifikasi */}
            {notification && (
                <div className={`fixed top-20 right-5 p-4 rounded-lg shadow-lg text-white flex items-center gap-3 z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{notification.message}</span>
                </div>
            )}

            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <Users />
                    Manajemen User
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <UserPlus size={18} />
                    <span>Tambah Pengguna</span>
                </button>
            </header>

            {/* Modal Tambah Pengguna */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Tambah Pengguna Baru</h2>
                        <form onSubmit={handleAddUser}>
                            {/* Pilihan Tipe Akun */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipe Akun</label>
                                <div className="flex gap-2 rounded-lg p-1 bg-gray-100 dark:bg-gray-700">
                                    <button type="button" onClick={() => setAccountType('google')} className={`w-full py-2 text-sm rounded-md transition-colors ${accountType === 'google' ? 'bg-white dark:bg-gray-800 shadow font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                                        Akun Google
                                    </button>
                                    <button type="button" onClick={() => setAccountType('manual')} className={`w-full py-2 text-sm rounded-md transition-colors ${accountType === 'manual' ? 'bg-white dark:bg-gray-800 shadow font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                                        Akun Biasa (Email & Pass)
                                    </button>
                                </div>
                            </div>

                            {/* Input Nama (hanya untuk akun biasa) */}
                            {accountType === 'manual' && (
                                <div className="mb-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            )}

                            {/* Input Email */}
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="pengguna@contoh.com"
                                    required
                                />
                            </div>

                            {/* Input Role */}
                            <div className="mb-6">
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <select
                                    id="role"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    {accountType === 'manual' ? 'Password akan diatur ke default `password123`.' : 'Pengguna akan login menggunakan akun Google-nya.'}
                                </p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Daftar Pengguna */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pengguna</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal Daftar</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500">Memuat data...</td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <Image
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={getAvatarUrl(user)}
                                                        alt={user.name}
                                                        width={40}
                                                        height={40}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteUser(user._id, user.name)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"
                                                title={`Hapus ${user.name}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500">Tidak ada pengguna yang ditemukan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { authFetch } from '../../../lib/authFetch';
import { Trash2, UserPlus, Users, AlertCircle, CheckCircle, Search, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    avatar?: string;
    createdAt: string;
    kelas?: string;
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
    const editModalRef = useRef<HTMLDivElement>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'class_student' | 'general_student' | 'staff'>('class_student');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<NotificationType | null>(null);

    // State untuk form tambah user
    const [accountType, setAccountType] = useState<'google' | 'manual'>('google');
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<'user' | 'admin' | 'super_admin'>('user');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState<'user' | 'admin' | 'super_admin'>('user');
    const [editAngkaKelas, setEditAngkaKelas] = useState('');
    const [editClassNumber, setEditClassNumber] = useState('');
    const [newKelas, setNewKelas] = useState('');
    const [newAngkaKelas, setNewAngkaKelas] = useState('');
    const [newClassNumber, setNewClassNumber] = useState('');    
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

       const finalKelas = newRole === 'user' && newAngkaKelas ? `Kelas ${newAngkaKelas} RPL ${newClassNumber}` : newKelas;

        try {
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: finalName, email: newEmail, role: newRole, kelas: finalKelas }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Gagal memproses respon server (${response.status})`);
            }

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
            setNewKelas('');
            setNewAngkaKelas('');            
            setNewClassNumber('');

        } catch (error) {
            console.error(error);
            showNotification('error', error instanceof Error ? error.message : 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string, userRole: string) => {
        if (userRole === 'super_admin') {
            showNotification('error', 'Anda tidak dapat menghapus Super Admin.');
            return;
        }

        if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}"? Tindakan ini tidak dapat dibatalkan.`)) {
            try {
                const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
                    method: 'DELETE',
                });

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    throw new Error(`Gagal memproses respon server (${response.status})`);
                }

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

    // Function to open the edit modal
    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditRole(user.role);
        
        setEditAngkaKelas('');
        setEditClassNumber('');

        if (user.role === 'user' && user.kelas) {
            const match = user.kelas.match(/Kelas (\d+) RPL (.+)/);
            if (match) {
                setEditAngkaKelas(match[1]);
                setEditClassNumber(match[2]);
            }
        }
        setIsEditModalOpen(true);
    };

    // Function to handle the update of a user
    const handleUpdateUser = async (e: FormEvent) => {
       e.preventDefault();
        setIsSubmitting(true);

        if (!editingUser) {
            showNotification('error', 'Tidak ada pengguna yang dipilih untuk diedit.');
            return;
        }

        const finalKelas = editRole === 'user' && editAngkaKelas ? `Kelas ${editAngkaKelas} RPL ${editClassNumber}` : '';

        try {
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${editingUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, email: editEmail, role: editRole, kelas: finalKelas }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Gagal memproses respon server (${response.status})`);
            }

            if (!response.ok) {
                throw new Error(data.message || 'Gagal memperbarui pengguna');
            }

            showNotification('success', `Pengguna "${data.name}" berhasil diperbarui.`);
            setIsEditModalOpen(false);
            fetchUsers(); // Muat ulang daftar pengguna

            // Reset form
            setEditName('');
            setEditEmail('');
            setEditRole('user');
            setEditAngkaKelas('');
            setEditClassNumber('');
            setEditingUser(null);

        } catch (error) {
            console.error(error);
            showNotification('error', error instanceof Error ? error.message : 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
                setIsEditModalOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editModalRef]);

    // Filter & Pagination Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesTab = true;
        if (activeTab === 'class_student') {
             matchesTab = user.role === 'user' && !!user.kelas;
            // Filter tambahan jika ada kelas yang dipilih via checkbox
            if (matchesTab && selectedClasses.size > 0) {
                matchesTab = user.kelas ? selectedClasses.has(user.kelas) : false;
            }
        } else if (activeTab === 'general_student') {
            matchesTab = user.role === 'user' && !user.kelas;
        } else if (activeTab === 'staff') {
            matchesTab = user.role === 'admin' || user.role === 'super_admin';
        }

        return matchesSearch && matchesTab;
    });

    const handleToggleClass = (className: string) => {
        setSelectedClasses(prev => {
            const newSet = new Set(prev);
            newSet.has(className) ? newSet.delete(className) : newSet.add(className);
            return newSet;
        });
    };
    const indexOfLastUser = currentPage * usersPerPage;
    
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-poppins">
           
                <script src="https://cdn.tailwindcss.com"></script>
            

            {/* Notifikasi */}
            {notification && (
                <div className={`fixed top-24 right-5 p-4 rounded-xl shadow-xl text-white flex items-center gap-3 z-50 animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 mt-16">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        <Users className="text-blue-600 dark:text-blue-400" size={32} />
                        Manajemen Pengguna
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Kelola data siswa, guru, dan administrator dalam satu tempat.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 font-medium"
                >
                    <UserPlus size={18} />
                    <span>Tambah Pengguna</span>
                </button>
            </header>

            {/* Modal Tambah Pengguna */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100">
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
                                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin' | 'super_admin')}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required
                                >
                                    <option value="user">User (Siswa)</option>
                                    <option value="admin">Admin (Guru)</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    {accountType === 'manual' ? 'Password akan diatur ke default `password123`.' : 'Pengguna akan login menggunakan akun Google-nya.'}
                                </p>
                            </div>

                            {/* Input Kelas (Hanya muncul jika role adalah user/siswa) */}
                            {newRole === 'user' && (                                
                                <div className="mb-6">
                                    <label htmlFor="kelas" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kelas</label>
                                    <div className="flex gap-2 mb-2">
                                        <select
                                            id="angkatan"
                                            value={newAngkaKelas}
                                            onChange={(e) => setNewAngkaKelas(e.target.value)}
                                            className="block w-1/3 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Angkatan</option>
                                            <option value="10">10</option>
                                            <option value="11">11</option>
                                            <option value="12">12</option>
                                        </select>
                                        <div className="flex items-center justify-center w-1/3 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-gray-500 dark:text-gray-300 font-medium">
                                            RPL
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="No. (1, 2...)"
                                            value={newClassNumber}
                                            onChange={(e) => setNewClassNumber(e.target.value)}
                                            className="block w-1/3 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Preview: {newAngkaKelas ? `Kelas ${newAngkaKelas} RPL ${newClassNumber}` : '-'}
                                    </p>
                                </div>
                            )}


                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Edit Pengguna */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md" ref={editModalRef}>
                        <h2 className="text-xl font-bold mb-4">Edit Pengguna</h2>
                        <form onSubmit={handleUpdateUser}>
                            {/* Input Nama */}
                            <div className="mb-4">
                                <label htmlFor="editName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                                <input
                                    type="text"
                                    id="editName"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            {/* Input Email */}
                            <div className="mb-4">
                                <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Email</label>
                                <input
                                    type="email"
                                    id="editEmail"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="pengguna@contoh.com"
                                    required
                                />
                            </div>

                            {/* Input Role */}
                            <div className="mb-6">
                                <label htmlFor="editRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <select
                                    id="editRole"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value as 'user' | 'admin' | 'super_admin')}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required
                                >
                                    <option value="user">User (Siswa)</option>
                                    <option value="admin">Admin (Guru)</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>

                            {/* Input Kelas (Edit) */}
                            {editRole === 'user' && (
                                <div className="mb-6">
                                    <label htmlFor="editKelas" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kelas</label>
                                    <div className="flex gap-2 mb-2">
                                        <select
                                            id="editAngkatan"
                                            value={editAngkaKelas}
                                            onChange={(e) => setEditAngkaKelas(e.target.value)}
                                            className="block w-1/3 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Angkatan</option>
                                            <option value="10">10</option>
                                            <option value="11">11</option>
                                            <option value="12">12</option>
                                        </select>
                                        <div className="flex items-center justify-center w-1/3 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-gray-500 dark:text-gray-300 font-medium">
                                            RPL
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="No. (1, 2...)"
                                            value={editClassNumber}
                                            onChange={(e) => setEditClassNumber(e.target.value)}
                                            className="block w-1/3 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Preview: {editAngkaKelas ? `Kelas ${editAngkaKelas} RPL ${editClassNumber}` : '-'}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search and Filter Section */}
            <div className="flex flex-col md:flex-row gap-5 justify-between items-center mb-8">
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:text-white focus:outline-none transition-all shadow-sm"
                    />
                </div>

                {/* Badge Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                    {[
                        { id: 'class_student', label: 'Siswa Kelas' },
                        { id: 'general_student', label: 'Siswa Umum' },
                        { id: 'staff', label: 'Staf / Pengajar' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                            className={`
                                px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border
                                ${activeTab === tab.id 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none' 
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
               {activeTab === 'class_student' && (
                    <div className="mt-4 mb-8 flex flex-wrap gap-2">
                        {Array.from(new Set(users.filter(user => user.kelas).map(user => user.kelas))).map(kelas => (
                            <label key={kelas} className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                    value={kelas}
                                    checked={selectedClasses.has(kelas)}
                                    onChange={() => handleToggleClass(kelas)}
                                />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{kelas}</span>
                            </label>
                        ))}
                    </div>
                )}
             



   
        






            {/* User Grid (Cards) */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Memuat data...</div>
            ) : currentUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentUsers.map((user) => (
                        <div key={user._id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-12 w-12 flex-shrink-0">
                                        <Image
                                            className="rounded-full object-cover border border-gray-100 dark:border-gray-600"
                                            src={getAvatarUrl(user)}
                                            alt={user.name}
                                            fill
                                            sizes="48px"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-base">{user.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{user.email}</p>
                                    </div>
                                </div>
                                <span className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                                    user.role === 'super_admin' 
                                        ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' 
                                        : user.role === 'admin' 
                                            ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                }`}>
                                    {user.role === 'user' ? 'Siswa' : user.role === 'admin' ? 'Guru' : 'Super Admin'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                                {user.kelas ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-xl">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="font-medium">{user.kelas}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-xl">
                                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                        <span className="italic">Tidak ada kelas</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
                                    <span>Bergabung:</span>
                                    <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                {user.role !== 'super_admin' && (
                                    <>
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user._id, user.name, user.role)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Hapus
                                        </button>
                                    </>
                                )}
                                {user.role === 'super_admin' && (
                                    <div className="w-full text-center py-2 text-xs text-gray-400 italic">
                                        Akses Terkunci
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>Tidak ada pengguna yang ditemukan.</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Halaman {currentPage} dari {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors bg-white dark:bg-gray-800"
                        >
                            <ChevronLeft size={16} />
                            Sebelumnya
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors bg-white dark:bg-gray-800"
                        >
                            Selanjutnya
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
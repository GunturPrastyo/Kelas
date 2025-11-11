"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, Award, Star, Rocket } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSocket } from '@/context/SocketContext';
import { authFetch } from '@/lib/authFetch';

interface Notification {
    _id: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

const getNotificationIcon = (message: string) => {
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes('lulus') || lowerCaseMessage.includes('selamat') || lowerCaseMessage.includes('menyelesaikan')) {
        return <Award className="w-5 h-5 text-yellow-500" />;
    }
    if (lowerCaseMessage.includes('skor')) {
        return <Star className="w-5 h-5 text-blue-500" />;
    }
    if (lowerCaseMessage.includes('hebat')) {
        return <Rocket className="w-5 h-5 text-green-500" />;
    }
    // Default icon
    return <Bell className="w-5 h-5 text-gray-500" />;
};

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const socket = useSocket();

    const fetchNotifications = async () => {
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`);
            if (res.ok) {
                const data: Notification[] = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error("Gagal mengambil notifikasi:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []); // Hanya fetch sekali saat komponen dimuat

    // Dengarkan event notifikasi baru dari socket
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (newNotification: Notification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        socket.on('new_notification', handleNewNotification);

        return () => { socket.off('new_notification', handleNewNotification); };
    }, [socket]);

    const handleBellClick = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Tandai sudah dibaca di backend
            try {
                await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read`, {
                    method: 'PUT',
                });
                // Update state secara optimis
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (error) {
                console.error("Gagal menandai notifikasi sebagai dibaca:", error);
            }
        }
    };

    const dismissNotification = async (e: React.MouseEvent, notificationId: string) => {
        e.preventDefault();
        e.stopPropagation();

        // Hapus notifikasi dari state secara optimis
        setNotifications(prev => prev.filter(n => n._id !== notificationId));

        // Kirim permintaan hapus ke backend
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error("Gagal menghapus notifikasi:", error);
            // Jika gagal, idealnya kita bisa mengembalikan notifikasi ke state
            // atau menampilkan pesan error, tapi untuk sekarang kita biarkan.
        }
    };

    // Menutup dropdown jika klik di luar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleBellClick} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 sm:right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20">
                    <div className="p-3 font-semibold text-base border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">Notifikasi</div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif._id} className="group relative">
                                    <Link
                                        href={notif.link}
                                        onClick={() => setIsOpen(false)}
                                        className={`block p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notif.message)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm leading-snug text-gray-700 dark:text-gray-200">
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {formatDistanceToNow(new Date(notif.createdAt), {
                                                        addSuffix: true,
                                                        locale: id,
                                                    }).replace('sekitar ', '')}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={(e) => dismissNotification(e, notif._id)}
                                        className="absolute top-2 right-2 p-1 rounded-full text-gray-400 dark:text-gray-500 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Hapus notifikasi"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="font-semibold text-gray-700 dark:text-gray-300">Tidak ada notifikasi baru</p>
                                <p className="text-xs mt-1">Semua sudah terbaca!</p>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
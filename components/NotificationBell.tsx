"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useSocket } from "@/context/SocketContext";
import { authFetch } from "@/lib/authFetch";

interface Notification {
  _id: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

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
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif: Notification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      try {
        await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read`, {
          method: "PUT",
        });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (error) {
        console.error("Gagal menandai notifikasi:", error);
      }
    }
  };

  const dismissNotification = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Gagal menghapus notifikasi:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 text-white text-[10px] items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-pink-500" /> Notifikasi
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto scroll-smooth">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`relative group border-l-4 ${
                      notif.isRead
                        ? "border-transparent"
                        : "border-blue-500 dark:border-blue-400"
                    }`}
                  >
                    <Link
                      href={notif.link}
                      onClick={() => setIsOpen(false)}
                      className={`block p-3.5 text-sm transition-all ${
                        notif.isRead
                          ? "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          : "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100/60"
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <p className="text-gray-800 dark:text-gray-100 leading-snug text-[13.5px] sm:text-sm">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </p>
                      </div>
                    </Link>

                    <button
                      onClick={(e) => dismissNotification(e, notif._id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100/70 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center justify-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-400 mb-2" />
                  <p>Semua notifikasi sudah kamu baca 🎉</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Santai aja, nanti kalau ada yang baru aku kabari 😉
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;

"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, ArrowUp, Star, Sparkles, Crown } from 'lucide-react';

interface LevelUpAlertProps {
    isOpen: boolean;
    onClose: () => void;
    newLevel: string;
    oldLevel?: string;
}

export default function LevelUpAlert({ isOpen, onClose, newLevel, oldLevel }: LevelUpAlertProps) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            // Otomatis matikan confetti setelah beberapa detik
            const timer = setTimeout(() => setShowConfetti(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'dasar': return 'from-yellow-400 to-orange-500';
            case 'menengah': return 'from-blue-400 to-indigo-500';
            case 'lanjutan': return 'from-purple-400 to-pink-500';
            default: return 'from-green-400 to-emerald-500';
        }
    };

    const getLevelBadgeColor = (level: string) => {
         switch (level.toLowerCase()) {
            case 'dasar': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'menengah': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'lanjutan': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-green-100 text-green-700 border-green-200';
        }
    }

    const bgGradient = getLevelColor(newLevel);
    const badgeStyle = getLevelBadgeColor(newLevel);

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.7, bounce: 0.5 }}
                className="relative bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-gray-700"
            >
                {/* Dynamic Background Glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-gradient-to-b ${bgGradient} opacity-20 blur-3xl`}></div>

                {/* Confetti Animation (Simple CSS/Framer implementation) */}
                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32', '#FF4500'][i % 5],
                                    top: '50%',
                                    left: '50%',
                                }}
                                initial={{ x: 0, y: 0, scale: 0 }}
                                animate={{
                                    x: (Math.random() - 0.5) * 600,
                                    y: (Math.random() - 0.5) * 600,
                                    scale: [0, 1.5, 0],
                                    opacity: [1, 1, 0],
                                    rotate: Math.random() * 720
                                }}
                                transition={{ duration: 2.5, ease: "easeOut", delay: Math.random() * 0.2 }}
                            />
                        ))}
                    </div>
                )}

                <div className="relative z-10 p-8 flex flex-col items-center text-center">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-20"
                    >
                        <X size={20} />
                    </button>

                    {/* Icon Animation */}
                    <div className="mb-6 relative">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className={`w-28 h-28 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center shadow-xl shadow-orange-500/20 ring-4 ring-white dark:ring-gray-800`}
                        >
                            <Crown className="w-14 h-14 text-white drop-shadow-md" />
                        </motion.div>
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring" }}
                            className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-2.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-700"
                        >
                            <ArrowUp className="w-6 h-6 text-green-500 stroke-[3px]" />
                        </motion.div>
                         <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.7, type: "spring" }}
                            className="absolute -top-2 -left-2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700"
                        >
                            <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h2 className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${bgGradient} mb-3 tracking-tight`}>
                            LEVEL UP!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-8 leading-relaxed">
                            Selamat! Kamu telah naik ke level <br/>
                            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full border ${badgeStyle} text-sm font-bold uppercase tracking-wider`}>
                                {newLevel}
                            </span>
                        </p>
                    </motion.div>

                    {/* Level Transition Badge */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8 w-full"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 font-semibold uppercase">Sebelumnya</span>
                            <span className="text-gray-500 font-bold line-through decoration-gray-400/50">{oldLevel || 'Dasar'}</span>
                        </div>
                        
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600 relative">
                             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-600">
                                <ArrowUp className="w-4 h-4 text-green-500" />
                             </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 font-semibold uppercase">Sekarang</span>
                            <span className={`font-bold bg-gradient-to-r ${bgGradient} bg-clip-text text-transparent`}>{newLevel}</span>
                        </div>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-lg bg-gradient-to-r ${bgGradient} hover:shadow-xl transition-all text-lg tracking-wide`}
                    >
                        Lanjut Belajar
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, X, CheckCircle2, Star } from "lucide-react";

interface CompetencyUpdate {
    featureName: string;
    oldScore: number;
    newScore: number;
    diff: number;
    percentIncrease: number;
}

interface CompetencyUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    updates: CompetencyUpdate[];
}

export default function CompetencyUpdateModal({ isOpen, onClose, updates }: CompetencyUpdateModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center relative overflow-hidden">
                            {/* Decorative Pattern */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[length:20px_20px]"></div>
                            
                            <div className="relative z-10">
                                <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-white/30 shadow-inner">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">Kompetensi Meningkat!</h2>
                                <p className="text-blue-100 text-sm">Kerja bagus! Kemampuanmu berkembang.</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-3">
                                {updates.map((update, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 + 0.2 }}
                                        className="bg-slate-50 dark:bg-gray-700/50 p-4 rounded-xl border border-slate-100 dark:border-gray-600 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate" title={update.featureName}>
                                                    {update.featureName}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                    {Math.round(update.oldScore)}%
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-500">→</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                                    {Math.round(update.newScore)}%
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end">
                                            <span className="text-green-600 dark:text-green-400 font-bold text-lg leading-none">
                                                +{Math.round(update.diff)}
                                            </span>
                                            <span className="text-[10px] font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded-full mt-1">
                                                +{update.percentIncrease}%
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-center">
                            <button
                                onClick={onClose}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} />
                                Lanjutkan Belajar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

"use client";

import { useAlert } from '@/context/AlertContext';
import { CheckCircle, Info, AlertTriangle, X, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function AlertDialog() {
  const { alertOptions, hideAlert } = useAlert();
  const [animatedCount, setAnimatedCount] = useState(0);

  const title = alertOptions?.title || '';
  const message = alertOptions?.message || '';
  const type = alertOptions?.type;
  const confirmText = alertOptions?.confirmText;
  const cancelText = alertOptions?.cancelText;

  const lowerTitle = title.toLowerCase();
  const isImprovement = lowerTitle.includes('peningkatan nilai');
  const isSuccess = lowerTitle.includes('sukses') || lowerTitle.includes('selamat') || lowerTitle.includes('progress tersimpan');
  const isWarning = lowerTitle.includes('konfirmasi') || lowerTitle.includes('kirim') || lowerTitle.includes('hapus') || lowerTitle.includes('peringatan') || lowerTitle.includes('waktu habis');

  // Extract improvement value if available
  const improvementMatch = message.match(/naik <strong>(\d+) poin<\/strong>/i);
  const improvementValue = improvementMatch ? parseInt(improvementMatch[1]) : 0;

  // Extract percentage if available
  const percentMatch = message.match(/\(<strong>(\d+)%<\/strong>\)/);
  const percentValue = percentMatch ? parseInt(percentMatch[1]) : 0;

  // Logic to inject icon and style into the message string for the percentage part
  let displayMessage = message;
  if (isImprovement && percentValue > 0) {
    const trendingUpIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up inline-block mr-1"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
    
    // Replace (<strong>X%</strong>) with the styled span inside the text
    displayMessage = message.replace(
      /\(<strong>(\d+)%<\/strong>\)/, 
      `<span class="inline-flex items-center font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs mx-1">${trendingUpIcon}$1%</span>`
    );
  }

  useEffect(() => {
    if (isImprovement && improvementValue > 0) {
      setAnimatedCount(0);
      const duration = 2000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out expo
        const ease = 1 - Math.pow(2, -10 * progress);
        
        setAnimatedCount(Math.round(improvementValue * ease));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isImprovement, improvementValue]);

  if (!alertOptions) return null;

  const handleConfirm = () => {
    if (alertOptions.onConfirm) alertOptions.onConfirm();
    hideAlert();
  };

  const handleCancel = () => {
    if (alertOptions.onCancel) alertOptions.onCancel();
    hideAlert();
  };

  const getIcon = () => {
    if (isImprovement) {
      return <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />;
    }
    if (isSuccess) {
      return <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />;
    }
    if (isWarning) {
      return <AlertTriangle className="w-10 h-10 text-amber-500" />;
    }
    return <Info className="w-10 h-10 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2147483647] flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all animate-in zoom-in-95 duration-300 relative overflow-hidden ${isImprovement ? 'border-4 border-blue-100 dark:border-blue-900/50' : ''}`}>
        
        {/* Background decoration for improvement */}
        {isImprovement && (
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                
                {/* Confetti Particles */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#60A5FA', '#34D399', '#F472B6', '#FBBF24'][i % 4],
                      top: '50%',
                      left: '50%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{ 
                      scale: [0, 1, 0], 
                      x: (Math.random() - 0.5) * 400, 
                      y: (Math.random() - 0.5) * 400,
                      rotate: Math.random() * 360
                    }}
                    transition={{ duration: 2, ease: "easeOut", delay: 0.1 }}
                  />
                ))}
            </div>
        )}

        <motion.div 
          initial={isImprovement ? { scale: 0, rotate: -180 } : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={`mx-auto flex items-center justify-center h-24 w-24 rounded-full mb-6 relative z-10 ${
            isImprovement 
            ? 'bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/10' 
            : isWarning
                ? 'bg-amber-50 dark:bg-amber-900/20' 
                : isSuccess
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-gray-50 dark:bg-gray-700/50'
        }`}
        >
          {getIcon()}
        </motion.div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white relative z-10 mb-2">{title}</h3>
        
        {/* Animated Score Increase */}
        {isImprovement && improvementValue > 0 && (
          <div className="mb-4 relative z-10 flex flex-col items-center justify-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              +{animatedCount} Poin
            </motion.div>
          </div>
        )}
        
        <div className="mt-3 relative z-10">
          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: displayMessage }} />
        </div>

        <div className={`mt-8 flex gap-3 ${type === 'confirm' ? 'justify-center' : 'justify-center'} relative z-10`}>
          {type === 'confirm' && (
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors"
            >
              {cancelText || 'Batal'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl focus:outline-none shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              type === 'confirm' && title.toLowerCase().includes('hapus')
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : isImprovement 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText || 'OK'}
          </button>
        </div>

        <button 
            onClick={hideAlert} 
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreTestModal({ isOpen, onClose }: PreTestModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleStartPreTest = () => {
    onClose();
    router.push("/pre-test");
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Header Background */}
        <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 relative flex items-center justify-center">
            {/* Pattern overlay (optional) */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-md"
                title="Tutup"
            >
                <X size={20} />
            </button>
        </div>

        {/* Icon Container - Overlapping header and content */}
        <div className="relative -mt-12 mb-3 flex justify-center">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-gray-700 p-4">
                 <img 
                    src="/test-pre-test.png" 
                    alt="Pre-test Icon" 
                    width={128} 
                    height={128} 
                    className="w-full h-full object-contain"
                />
            </div>
        </div>

        {/* Content */}
        <div className="pb-8 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Yuk, Cek Kemampuanmu!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm">
            Sebelum mulai belajar, kerjakan <strong>Pre-Test</strong> dulu ya. 
            Hasilnya akan membantu kami merekomendasikan materi yang paling pas buat kamu.
          </p>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleStartPreTest} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-base shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] rounded-xl"
            >
              Mulai Pre-Test Sekarang
            </Button>
            <button 
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors py-2"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

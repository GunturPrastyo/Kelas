"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { Route, CheckCircle2, Activity, Rocket, Lock, Users, Clock } from "lucide-react";

interface Module {
  _id: string;
  title: string;
  slug: string;
  status: "Selesai" | "Berjalan" | "Terkunci" | "Belum Mulai";
  progress: number;
  order: number;
  category: string; // Menambahkan category
  icon: string;
  userCount?: number;
  totalDuration?: number;
  completedTopics: number;
  totalTopics: number;
  isLocked?: boolean;
}

interface ModuleListProps {
  title: string;
  allModules: Module[];
  filter: (module: Module) => boolean;
}

const getStatusBadge = (status: Module["status"], progress: number | undefined, completedTopics?: number, totalTopics?: number) => {
  const base = "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shadow-sm transition-all";
  switch (status) {
    case "Selesai":
      return (
        <span className={`${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300`}>
          <CheckCircle2 size={14} /> Selesai
        </span>
      );
    case "Berjalan":
      return (
        <span className={`${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300`}>
         {completedTopics ?? 0} dari {totalTopics ?? 0} topik
        </span>
      );
    case "Belum Mulai":
      return (
        <span className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300`}>
          <Rocket size={14} /> Mulai
        </span>
      );
    default:
      return (
        <span className={`${base} bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400`}>
          <Lock size={14} /> Terkunci
        </span>
      );
  }
};

const getCategoryBadge = (category: string) => {
  const base = "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shadow-sm";
  switch (category.toLowerCase()) {
    case "mudah":
    case "dasar":
      return <span className={`${base} bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300`}>Dasar</span>;
    case "sedang":
    case "menengah":
      return <span className={`${base} bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300`}>Menengah</span>;
    case "sulit":
    case "lanjut":
    case "lanjutan":
      return <span className={`${base} bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300`}>Lanjut</span>;
    default: return null;
  }
};

export default function ModuleList({ title, allModules, filter }: ModuleListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const modules = useMemo(
    () =>
      allModules
        .filter(filter)
        .sort((a, b) => (a.order || 0) - (b.order || 0)), // <-- Urutkan berdasarkan order
    [allModules, filter]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = scrollRef.current;
    if (!slider) return;

    let isDown = true;
    let startX = e.pageX - slider.offsetLeft;
    let scrollLeft = slider.scrollLeft;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.2;
      slider.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUpOrLeave = () => {
      isDown = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUpOrLeave);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUpOrLeave);
  };

  if (modules.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-indigo-200 via-blue-200 to-sky-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pl-7 pr-4 pt-7 p-3   rounded-2xl shadow-xl border border-white/20 dark:border-gray-800 backdrop-blur-xl transition-all">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Route className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
          {title}
        </h2>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className="grid grid-flow-col auto-cols-[260px] sm:auto-cols-[300px] gap-6 overflow-x-auto scroll-smooth pb-8 scrollbar-hidden snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none px-1"
      >
        {modules.map((modul) => {
          const isLocked = modul.isLocked ?? (modul.status === 'Terkunci');
          const effectiveStatus = isLocked ? 'Terkunci' : modul.status;

          return (
            <Link
              key={modul._id}
              href={effectiveStatus !== "Terkunci" ? `/modul/${modul.slug}` : "#"}
              onClick={(e) => effectiveStatus === "Terkunci" && e.preventDefault()}
              className={`
              group relative flex flex-col justify-between
              w-full h-[240px]
              rounded-2xl overflow-hidden 
              bg-slate-50 dark:bg-gray-800
              border border-slate-200 dark:border-gray-700
              border-l-8 ${effectiveStatus === 'Terkunci' ? 'border-l-gray-300 dark:border-l-gray-600' : 'border-l-blue-400'}
              shadow-sm hover:shadow-xl hover:-translate-y-1
              transition-all duration-300 snap-start
              ${effectiveStatus === "Terkunci" ? "grayscale opacity-70 cursor-not-allowed" : ""}
            `}
            >
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/80 to-transparent dark:from-blue-800/20 rounded-bl-[80px] -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />

            <div className="relative p-5 flex flex-col h-full z-10">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-white/50 dark:border-gray-600
                        bg-blue-100/50 dark:bg-blue-900/30
                        backdrop-blur-sm
                    `}>
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`}
                    alt={modul.title}
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div className="transform translate-x-2 -translate-y-2 scale-90">
                  {getCategoryBadge(modul.category)}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {modul.title}
              </h3>

              {/* Info Row */}
              <div className="flex items-center gap-4 text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-auto">
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-indigo-500" />
                  <span>{modul.userCount ?? 0} Bergabung</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-500" />
                  <span>{modul.totalDuration ? `${modul.totalDuration} Menit` : "-"}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {effectiveStatus === 'Selesai' ? 'Selesai' : effectiveStatus === 'Terkunci' ? 'Terkunci' : `${modul.progress}% Selesai`}
                  </span>
                  <div className="scale-90 origin-right">
                    {getStatusBadge(effectiveStatus, modul.progress, modul.completedTopics, modul.totalTopics)}
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${effectiveStatus === 'Terkunci' ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-600'}`}
                    style={{ width: `${modul.progress}%` }}
                  />
                </div>
              </div>
            </div>
            </Link>
          );
        })}
      </div>

      {/* Hidden Scrollbar */}
      <style jsx>{`
    .scrollbar-hidden::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hidden {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
    </section>

  );
}

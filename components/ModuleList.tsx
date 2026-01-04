"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { Route, CheckCircle2, Activity, Rocket, Lock } from "lucide-react";

interface Module {
  _id: string;
  title: string;
  slug: string;
  status: "Selesai" | "Berjalan" | "Terkunci" | "Belum Mulai";
  progress: number;
  order: number;
  category: string; // Menambahkan category
  icon: string;
}

interface ModuleListProps {
  title: string;
  allModules: Module[];
  filter: (module: Module) => boolean;
}

const getStatusBadge = (status: Module["status"], progress: number | undefined) => {
  const base = "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shadow-sm transition-all";
  switch (status) {
    case "Selesai":
      return (
        <span className={`${base} bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300`}>
          <CheckCircle2 size={14} /> Selesai
        </span>
      );
    case "Berjalan":
      return (
        <span className={`${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300`}>
          <Activity size={14} /> {progress}%
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
  switch (category) {
    case "mudah":
      return <span className={`${base} bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300`}>Dasar</span>;
    case "sedang":
      return <span className={`${base} bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300`}>Menengah</span>;
    case "sulit":
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
    <section className="bg-gradient-to-br from-indigo-100 via-blue-100 to-sky-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-7 rounded-2xl shadow-xl border border-white/20 dark:border-gray-800 backdrop-blur-xl transition-all">
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
        className="grid grid-flow-col auto-cols-[240px] sm:auto-cols-[260px] gap-7 overflow-x-auto scroll-smooth pb-4 scrollbar-hidden snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none px-1"
      >
        {modules.map((modul) => (
          <Link
            key={modul._id}
            href={modul.status !== "Terkunci" ? `/modul/${modul.slug}` : "#"}
            onClick={(e) => modul.status === "Terkunci" && e.preventDefault()}
            className={`
          relative p-6 rounded-3xl flex flex-col items-start 
          bg-white/80 dark:bg-gray-900/60 
          border border-gray-200/50 dark:border-gray-700/60 
          backdrop-blur-lg shadow-md 
          transition-all duration-300 snap-start flex-shrink-0
          ${modul.status === "Terkunci"
                ? "opacity-50 cursor-not-allowed"
                : "hover:-translate-y-2 hover:shadow-2xl"
              }
        `}
          >
            {/* Icon */}
            <div
              className={`
            w-16 h-16 mb-4 rounded-2xl flex items-center justify-center transition-all shadow-sm ring-1 
            ${modul.progress === 100
                  ? "bg-green-50 dark:bg-green-900/40 ring-green-200/60"
                  : "bg-blue-50 dark:bg-blue-900/40 ring-blue-200/60"
                }
          `}
            >
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`}
                alt={`${modul.title} icon`}
                className="object-contain w-10 h-10"
              />
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {modul.title}
            </h3>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200/70 dark:bg-gray-700/70 rounded-full h-2 mb-4">
              <div
                className={`
              h-2 rounded-full transition-all duration-500 ease-out
              ${modul.progress === 100 ? "bg-green-500" : "bg-indigo-500"}
            `}
                style={{ width: `${modul.progress}%` }}
              ></div>
            </div>

            {/* Badge */}
            <div className="flex items-center gap-2 mt-auto">
              {getStatusBadge(modul.status, modul.progress)}
              {getCategoryBadge(modul.category)}
            </div>

            {/* Glow Hover */}
            {modul.status !== "Terkunci" && (
              <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-br from-indigo-400/0 via-blue-300/0 to-blue-400/10 opacity-0 group-hover:opacity-100 transition duration-300 blur-xl"></div>
            )}
          </Link>
        ))}
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

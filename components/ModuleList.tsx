"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
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
      return (
        <span className={`${base} bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300`}>Dasar</span>
      );
    case "sedang":
      return (
        <span className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300`}>Menengah</span>
      );
    case "sulit":
      return (
        <span className={`${base} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300`}>Lanjut</span>
      );
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
    <section className="bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-3xl shadow-xl border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Route className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
          {title}
        </h2>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hidden snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
      >
        {modules.map((modul) => (
          <Link
            href={modul.status !== "Terkunci" ? `/modul/${modul.slug}` : "#"}
            key={modul._id}
            className={`group relative min-w-[240px] sm:min-w-[260px] p-6 rounded-2xl flex flex-col items-start bg-white/80 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 backdrop-blur-md transition-all duration-300 hover:shadow-2xl snap-start flex-shrink-0
              ${
                modul.status === "Terkunci"
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:-translate-y-2"
              }`}
            onClick={(e) => modul.status === "Terkunci" && e.preventDefault()}
          >
            {/* Icon */}
            <div
              className={`w-14 h-14 mb-4 rounded-xl flex items-center justify-center shadow-inner transition-all
                ${
                  modul.progress === 100
                    ? "bg-green-100 dark:bg-green-900/40"
                    : "bg-blue-100 dark:bg-blue-900/40"
                }`}
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`}
                alt={`${modul.title} icon`}
                width={36}
                height={36}
                className="object-contain"
              />
            </div>

            {/* Judul */}
            <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {modul.title}
            </h3>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  modul.progress === 100 ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${modul.progress}%` }}
              ></div>
            </div>

            {/* Group Badge */}
            <div className="flex items-center gap-2">
              {getStatusBadge(modul.status, modul.progress)}
              {getCategoryBadge(modul.category)}
            </div>

            {/* Glow efek ketika hover */}
            {modul.status !== "Terkunci" && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/0 via-blue-400/0 to-blue-400/10 opacity-0 group-hover:opacity-100 transition duration-300 blur-lg"></div>
            )}
          </Link>
        ))}
      </div>

      {/* Hilangkan scrollbar bawaan */}
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

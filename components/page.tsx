"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Module {
  _id: string;
  title: string;
  slug: string;
  status: "Selesai" | "Berjalan" | "Terkunci" | "Belum Mulai";
  progress: number;
  icon: string;
}

interface ModuleListProps {
  title: string;
  allModules: Module[];
  filter: (module: Module) => boolean;
}

const getStatusBadge = (status: Module["status"], progress: number | undefined) => {
  if (status === "Selesai")
    return (
      <span className="inline-block text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full shadow-sm">
        Selesai
      </span>
    );
  if (status === "Berjalan")
    return (
      <span className="inline-block text-xs font-medium px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full shadow-sm">
        {progress}%
      </span>
    );
  if (status === "Belum Mulai")
    return (
      <span className="inline-block text-xs font-medium px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full shadow-sm">
        Mulai
      </span>
    );
  return (
    <span className="text-xs px-3 py-1 bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full flex items-center gap-1">
      Terkunci
    </span>
  );
};

export default function ModuleList({ title, allModules, filter }: ModuleListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const modules = useMemo(() => allModules.filter(filter), [allModules, filter]);

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
      const walk = (x - startX) * 1.2; // kecepatan drag
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

  if (modules.length === 0) {
    // Tampilkan pesan jika tidak ada modul yang cocok, kecuali untuk "Rekomendasi"
    if (title.toLowerCase().includes("rekomendasi")) {
      return null;
    }
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md text-center text-gray-500">
        <p>Tidak ada modul untuk ditampilkan di kategori "{title}".</p>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {title}
        </h2>
      </div>

      {/* Kontainer scroll horizontal + drag-scroll */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hidden snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
      >
        {modules.map((modul) => (
          <Link href={`/modul/${modul.slug}`} key={modul._id} className="min-w-[240px] sm:min-w-[260px] p-5 rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 flex-shrink-0 snap-start backdrop-blur-md shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 mb-3 rounded-lg flex items-center justify-center ${modul.progress === 100 ? "bg-green-100 dark:bg-green-900/50" : "bg-blue-100 dark:bg-blue-900/50"}`}>
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`}
                  alt={`${modul.title} icon`}
                  width={32}
                  height={32}
                />
              </div>
              <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100">
                {modul.title}
              </h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${modul.progress === 100 ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${modul.progress}%` }}
                ></div>
              </div>
              {getStatusBadge(modul.status, modul.progress)}
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

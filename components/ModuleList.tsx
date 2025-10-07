"use client";

import { useRef } from "react";
import Image from "next/image";

interface Module {
  id: number;
  title: string;
  status: "Selesai" | "Berjalan" | "Terkunci";
  progress: number;
  icon: string;
}

const modules: Module[] = [
  { id: 1, title: "JavaScript Dasar", status: "Selesai", progress: 100, icon: "https://img.icons8.com/color/48/javascript.png" },
  { id: 2, title: "JavaScript Lanjutan", status: "Berjalan", progress: 60, icon: "https://img.icons8.com/fluency/48/source-code.png" },
  { id: 3, title: "DOM Manipulation", status: "Terkunci", progress: 0, icon: "https://img.icons8.com/ios-filled/50/lock--v1.png" },
  { id: 4, title: "Event Handling", status: "Terkunci", progress: 0, icon: "https://img.icons8.com/ios-filled/50/lock--v1.png" },
  { id: 5, title: "Asynchronous JS", status: "Terkunci", progress: 0, icon: "https://img.icons8.com/ios-filled/50/lock--v1.png" },
  { id: 6, title: "React Dasar", status: "Terkunci", progress: 0, icon: "https://img.icons8.com/ios-filled/50/lock--v1.png" },
];

const getStatusBadge = (status: Module["status"], progress: number) => {
  if (status === "Selesai")
    return (
      <span className="inline-block text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full shadow-sm">
        ✅ Selesai
      </span>
    );
  if (status === "Berjalan")
    return (
      <span className="inline-block text-xs font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full shadow-sm">
        ⏳ Sedang Berjalan ({progress}%)
      </span>
    );
  return (
    <span className="text-xs px-3 py-1 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full flex items-center gap-1">
      🔒 <span className="hidden sm:inline">Terkunci</span>
    </span>
  );
};

export default function ModuleList() {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <section className="bg-gradient-to-br from-blue-50 via-indigo-100 to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Modul Pembelajaran
        </h2>
      </div>

      {/* Kontainer scroll horizontal + drag-scroll */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2 scrollbar-hidden snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
      >
        {modules.map((modul) => (
          <div
            key={modul.id}
            className={`min-w-[240px] sm:min-w-[260px] p-5 rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 flex-shrink-0 snap-start backdrop-blur-md shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${modul.status === "Terkunci"
                ? "opacity-70 cursor-not-allowed"
                : ""
              }`}
          >
            <div
              className={`w-12 h-12 mb-3 rounded-full flex items-center justify-center ${modul.status === "Selesai" ? "bg-green-100" : "bg-blue-100"
                }`}
            >
              <Image
                src={modul.icon}
                alt={`${modul.title} icon`}
                width={32}
                height={32}
                className={
                  modul.status === "Terkunci" ? "opacity-70" : ""
                }
              />
            </div>
            <h3
              className={`font-semibold text-lg mb-3 ${modul.status === "Terkunci"
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-gray-800 dark:text-gray-100"
                }`}
            >
              {modul.title}
            </h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className={`h-2 rounded-full ${modul.status === "Selesai"
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : "bg-gradient-to-r from-blue-400 to-blue-600"
                  }`}
                style={{ width: `${modul.progress}%` }}
              ></div>
            </div>
            {getStatusBadge(modul.status, modul.progress)}
          </div>
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


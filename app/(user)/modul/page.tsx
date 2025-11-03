"use client";

import { useState, useEffect, useMemo } from "react";
import { useUI } from "@/context/UIContext";
import { authFetch } from "@/lib/authFetch";
import ModuleList from "@/components/ModuleList";
import Breadcrumb from "@/components/Breadcrumb";

type ModuleStatus = 'Selesai' | 'Berjalan' | 'Terkunci' | 'Belum Mulai';

interface Module {
  _id: string;
  title: string;
  slug: string;
  status: ModuleStatus;
  progress: number;
  icon: string;
  category: 'mudah' | 'sedang' | 'sulit';
  isHighlighted?: boolean;
  totalTopics?: number;
  completedTopics?: number;
}

export default function AllModulesPage() {
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery } = useUI();

  useEffect(() => {
    const fetchAllModules = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`);

        if (!res.ok) {
          throw new Error(`Gagal memuat modul: ${res.statusText}`);
        }

        const data: Module[] = await res.json();

        // Menentukan status setiap modul di sisi client
        const modulesWithStatus = data.map(modul => {
          let status: ModuleStatus;
          if (modul.progress === 100) {
            status = 'Selesai';
          } else if (modul.progress > 0) {
            status = 'Berjalan';
          } else {
            status = 'Belum Mulai';
          }
          return { ...modul, status };
        });

        setAllModules(modulesWithStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllModules();
  }, []);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return allModules;
    return allModules.filter(m =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allModules, searchQuery]);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Memuat semua modul...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full font-sans p-5">
      <Breadcrumb paths={[{ name: "Dashboard", href: "/dashboard" }, { name: "Semua Modul", href: "/modul" }]} />
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-6 mb-6">
        Semua Modul Pembelajaran
      </h1>

      {filteredModules.length > 0 ? (
        <ModuleList title="Daftar Modul" allModules={filteredModules} filter={() => true} />
      ) : (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-300">Tidak ada modul yang cocok dengan pencarian Anda.</p>
        </div>
      )}
    </div>
  );
}
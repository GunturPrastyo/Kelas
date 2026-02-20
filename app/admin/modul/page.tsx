"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModulCard from "@/components/ModulCard"; 
import { Button } from "@/components/ui/button"; 
import { Edit, PlusCircle, List, LayoutGrid, Info, Shield, Zap, Trophy, CheckCircle2 } from "lucide-react"; 
import { authFetch } from "@/lib/authFetch";
import ModulOrder from "@/components/ModulOrder"; 
import FeatureManager from "@/components/FeatureManager";
import { Feature } from "@/components/featureModal";

interface Modul {
  _id: string;
  title: string;
  icon?: string;
  category: string;
  overview: string;
  slug: string;
  order: number;
}

export default function ModulPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State untuk menyimpan pesan error
  const [hasPreTest, setHasPreTest] = useState<boolean | null>(null);
  const [view, setView] = useState<"grid" | "order">("grid");
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul`)
      .then(async (res) => {
        if (!res.ok) {
          // Coba baca pesan error dari body response
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || 'Gagal memuat modul dari server.');
        }
        return res.json();
      })
      .then((data) => {
        setModules(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message); // Simpan pesan error ke state
      })
      .finally(() => setLoading(false));

    // Cek apakah pre-test global sudah ada
    const checkPreTest = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/pre-test`);
        const data = await res.json();
        // Asumsikan endpoint mengembalikan { exists: boolean } atau array soal
        setHasPreTest(data.questions && data.questions.length > 0);
      } catch (err) {
        console.error("Error checking pre-test:", err);
        setHasPreTest(false); // Anggap tidak ada jika error
      }
    };
    checkPreTest();
  }, []);

  // Efek untuk memuat fitur yang tersedia saat komponen dimuat
  useEffect(() => {
    const fetchAvailableFeatures = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/features`);
        if (res.ok) {
          const data = await res.json();
          setAvailableFeatures(data);
        }
      } catch (error) {
        console.error("Gagal memuat fitur yang tersedia:", error);
      }
    };
    fetchAvailableFeatures();
  }, []);

  const handleDeleteModul = async (modulId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus modul ini? Semua topik, materi, dan soal di dalamnya akan ikut terhapus secara permanen.")) {
      try {
        const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${modulId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setModules(prevModules => prevModules.filter(m => m._id !== modulId));
          alert("Modul berhasil dihapus.");
        } else {
          const errorData = await response.json();
          alert(`Gagal menghapus modul: ${errorData.message}`);
        }
      } catch (error) {
        console.error("Error saat menghapus modul:", error);
        alert("Terjadi kesalahan pada jaringan.");
      }
    }
  };

  if (loading) return <div className="text-center p-10">Memuat data modul...</div>;

  if (error) {
    return <div className="text-center p-10 text-red-500">
      Terjadi kesalahan: {error}
    </div>;
  }

  return (
    <div className="mt-22">
      <div className="block sm:flex justify-between items-center mb-6">
        <h1 className="mb-5 sm:m-0 text-2xl font-bold">Manajemen Modul dan Tes</h1>
        <div className="flex items-center gap-4">
            <FeatureManager onFeaturesUpdate={setAvailableFeatures} />
          {/* Tombol Ganti Tampilan */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-md transition-colors ${
                view === "grid"
                  ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setView("order")}
              className={`p-2 rounded-md transition-colors ${
                view === "order"
                  ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <List size={20} />
            </button>
          </div>
          <Link
            href="/admin/modul/tambah-modul"
            className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 flex items-center gap-2"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Tambah Modul</span>
          </Link>
        </div>
      </div>

      {/* Tampilan Pengelompokan Fitur */}
      {availableFeatures.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Peta Indikator Kompetensi</h3>
            <div className="group relative">
              <Info size={18} className="text-gray-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden w-64 p-2 text-xs text-white bg-gray-800 rounded shadow-lg group-hover:block z-10">
                Indikator ini digunakan untuk menentukan level pengguna (Dasar, Menengah, Lanjutan) berdasarkan hasil Tes.
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['Dasar', 'Menengah', 'Lanjutan'] as const).map(group => {
              const featuresInGroup = availableFeatures.filter(f => f.group === group);
              
              let groupStyles = {
                icon: Shield,
                color: "text-green-600 dark:text-green-400",
                iconBg: "bg-green-50 dark:bg-green-900/20",
                borderColor: "border-green-200 dark:border-green-800",
                badgeBg: "bg-green-100 dark:bg-green-900/30",
                badgeText: "text-green-700 dark:text-green-300",
              };

              if (group === 'Menengah') {
                groupStyles = {
                  icon: Zap,
                  color: "text-yellow-600 dark:text-yellow-400",
                  iconBg: "bg-yellow-50 dark:bg-yellow-900/20",
                  borderColor: "border-yellow-200 dark:border-yellow-800",
                  badgeBg: "bg-yellow-100 dark:bg-yellow-900/30",
                  badgeText: "text-yellow-700 dark:text-yellow-300",
                };
              } else if (group === 'Lanjutan') {
                groupStyles = {
                  icon: Trophy,
                  color: "text-red-600 dark:text-red-400",
                  iconBg: "bg-red-50 dark:bg-red-900/20",
                  borderColor: "border-red-200 dark:border-red-800",
                  badgeBg: "bg-red-100 dark:bg-red-900/30",
                  badgeText: "text-red-700 dark:text-red-300",
                };
              }

              const Icon = groupStyles.icon;

              return (
                <div key={group} className={`relative flex flex-col p-5 rounded-xl border transition-all hover:shadow-md bg-white dark:bg-gray-800 ${groupStyles.borderColor}`}>
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${groupStyles.iconBg} ${groupStyles.color}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-white">{group}</h4>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${groupStyles.badgeBg} ${groupStyles.badgeText}`}>
                          {featuresInGroup.length} Indikator
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-grow bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                    {featuresInGroup.length > 0 ? (
                      <ul className="space-y-2">
                        {featuresInGroup.map(f => (
                          <li key={f._id} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <CheckCircle2 size={16} className={`mt-0.5 flex-shrink-0 ${groupStyles.color}`} />
                            <span className="leading-tight">{f.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-4 text-gray-400">
                        <span className="text-xs text-center">Belum ada indikator</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 grid-auto-rows-fr">
          {/* Card Khusus untuk Pre-Test Global */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg border border-blue-300 dark:border-blue-700 transition-all flex flex-col p-5">
            <div className="flex items-start space-x-4 flex-grow">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  Pre-Test Global
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3 min-h-[60px]">
                  Tes awal yang dikerjakan pengguna sebelum memulai modul
                  pembelajaran untuk menentukan level awal.
                </p>
              </div>
            </div>
            <div className="mt-auto pt-4">
              {hasPreTest === null ? (
                <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ) : hasPreTest ? (
                <Link href={`/admin/modul/edit-pre-test`}>
                  <Button className="w-full flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Edit size={16} /> Edit Pre-Test
                  </Button>
                </Link>
              ) : (
                <Link href={`/admin/modul/tambah-pre-test`}>
                  <Button className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle size={16} /> Tambah Pre-Test
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {[...modules]
            .sort((a, b) => a.order - b.order)
            .map((modul) => (
            <ModulCard
              key={modul._id}
              modul={modul}
              onDelete={handleDeleteModul}
            />
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Tarik dan lepas modul untuk mengubah urutan tampilannya. Perubahan akan disimpan secara otomatis.
          </p>
          <ModulOrder />
        </div>
      )}
    </div>
  );
}

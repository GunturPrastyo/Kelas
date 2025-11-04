"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModulCard from "@/components/ModulCard"; // Card untuk setiap modul
import { Button } from "@/components/ui/button"; // Import Button
import { Edit, PlusCircle, List, LayoutGrid } from "lucide-react"; // Import ikon
import { authFetch } from "@/lib/authFetch";
import ModulOrder from "@/components/Admin/ModulOrder";

interface Modul {
  _id: string;
  title: string;
  icon?: string;
  category: string;
  overview: string;
  slug: string;
}

export default function ModulPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPreTest, setHasPreTest] = useState<boolean | null>(null);
  const [view, setView] = useState<"grid" | "order">("grid");

  useEffect(() => {
    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Gagal memuat modul')))
      .then((data) => {
        setModules(data);
        setLoading(false);
      })
      .catch(console.error);

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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Modul dan Tes</h1>
        <div className="flex items-center gap-4">
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

      {view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card Khusus untuk Pre-Test Global */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg border border-blue-300 dark:border-blue-700 transition-all flex flex-col h-full p-5">
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

          {modules.map((modul) => (
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

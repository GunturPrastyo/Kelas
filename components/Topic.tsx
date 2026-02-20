"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pencil, Trash2, PlusCircle, FileEdit, FileText, X, Save, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { Button } from "@/components/ui/button";

interface Props {
  topik: { _id: string; title: string; slug: string };
  modulId: string;
    modulSlug: string;
  onDelete: (id: string) => void;
}

export default function TopicCard({ topik, modulId, modulSlug, onDelete }: Props) {
  const [hasPostTest, setHasPostTest] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [title, setTitle] = useState(topik.title);
  const [newTitle, setNewTitle] = useState(topik.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  // Cek apakah topik ini sudah punya post test berdasarkan modulId & topikId
  useEffect(() => {
    const checkPostTest = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/check/${modulId}/${topik._id}`);

        if (!res.ok) {
          console.error("Gagal memeriksa post test:", res.status);
          return;
        }

        const data = await res.json();
        setHasPostTest(data.exists);
      } catch (error) {
        console.error("Gagal memeriksa post test modul & topik:", error);
      }
    };

    if (modulId && topik?._id) {
      checkPostTest();
    }
  }, [modulId, topik?._id]);

  // Sinkronisasi state title jika prop berubah
  useEffect(() => {
    setTitle(topik.title);
    setNewTitle(topik.title);
  }, [topik.title]);

  const handleCardClick = () => {
    router.push(`/admin/modul/${modulSlug}/${topik.slug}`);
  };

  const handleUpdateTitle = async () => {
    if (!newTitle.trim() || newTitle === title) {
      setIsEditModalOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/${topik._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        const data = await res.json();
        setTitle(data.title); // Update tampilan lokal
        setIsEditModalOpen(false);
        router.refresh(); // Refresh data server component jika perlu
      } else {
        alert("Gagal memperbarui nama topik.");
      }
    } catch (error) {
      console.error("Error updating topic:", error);
      alert("Terjadi kesalahan saat memperbarui topik.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
    <div
      onClick={handleCardClick}
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg border border-slate-200 dark:border-slate-700 transition-all flex flex-col h-full cursor-pointer"
    >
        {/* Tombol aksi kanan atas */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            title="Edit Nama Topik"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
          >
            <Pencil size={16} />
          </button>
          <button
            title="Hapus Topik"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(topik._id); }}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-700/40 text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Judul Topik */}
        <h3 className="text-lg font-semibold dark:text-white pr-16 mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {title}
        </h3>

        {/* Tombol Tambah/Edit Post Test */}
        <div className="mt-auto space-y-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/modul/${modulSlug}/${topik.slug}`}
            className="block"
          >
            <Button variant="outline" className="w-full flex items-center gap-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
              <FileText size={16} />
              Kelola Materi
            </Button>
          </Link>
          {hasPostTest ? (
            <Link
              href={`/admin/modul/${modulSlug}/${topik.slug}/edit-post-test?modulId=${modulId}&topikId=${topik._id}`}
            >
              <Button className="w-full flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white">
                <FileEdit size={16} />
                Edit Post Test
              </Button>
            </Link>
          ) : (
            <Link
              href={`/admin/modul/${modulSlug}/${topik.slug}/tambah-post-test?modulId=${modulId}&topikId=${topik._id}`}
            >
              <Button className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle size={16} />
                Tambah Post Test
              </Button>
            </Link>
          )}
        </div>
    </div>

    {/* Modal Edit Nama Topik */}
    {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(false); }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Nama Topik</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Nama Topik</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Masukkan nama topik..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                <Button onClick={handleUpdateTitle} disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isUpdating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

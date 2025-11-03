"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pencil, Trash2, PlusCircle, FileEdit } from "lucide-react";
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
  const router = useRouter();

  // ✅ Cek apakah topik ini sudah punya post test berdasarkan modulId & topikId
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

  const handleCardClick = () => {
    router.push(`/admin/modul/${modulSlug}/${topik.slug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all flex flex-col h-full cursor-pointer"
    >
        {/* Tombol aksi kanan atas */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <Link
            href={`/admin/modul/${modulSlug}/${topik.slug}`}
            title="Tambah/Edit Materi"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil size={16} />
          </Link>
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
          {topik.title}
        </h3>

        {/* Tombol Tambah/Edit Post Test */}
        <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
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
  );
}

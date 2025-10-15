"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  topik: { title: string; slug: string };
  modulSlug: string;
}

export default function TopicCard({ topik, modulSlug }: Props) {
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all">
      {/* Tombol aksi */}
      <div className="absolute top-3 right-3 flex space-x-2">
        <Link href={`/admin/modul/${modulSlug}/${topik.slug}`}>
          <button title="Tambah/Edit Materi" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Pencil size={16} />
          </button>
        </Link>
        <button title="Hapus Topik" className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-700/40 text-red-500">
          <Trash2 size={16} />
        </button>
      </div>
      <h3 className="text-lg font-semibold dark:text-white">{topik.title}</h3>
    </div>
  );
}

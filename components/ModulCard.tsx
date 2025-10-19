"use client";

import Link from "next/link";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";

interface Props {
  modul: {
    _id: string;
    slug: string;
    title: string;
    overview: string;
    category: string;
    icon?: string;
  };
  onDelete: (id: string) => void;
}

export default function ModulCard({ modul, onDelete }: Props) {
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all flex flex-col h-full">
      <div className="absolute top-3 right-3 flex items-center space-x-1">
        <Link href={`/admin/modul/edit-modul?slug=${modul.slug}`} title="Edit Modul" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={(e) => e.stopPropagation()}>
          <Pencil size={16} />
        </Link>
        <Link href={`/admin/modul/${modul.slug}/tambah-topik?modulId=${modul._id}`} title="Tambah Topik" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={(e) => e.stopPropagation()}>
          <PlusCircle size={16} />
        </Link>
        <button
          title="Hapus Modul"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(modul._id);
          }}
          className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-start space-x-4 flex-grow">
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg overflow-hidden">
          {modul.icon ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`}
              alt={modul.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {modul.title.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="pr-16">
          <h3 className="text-lg font-semibold dark:text-white">{modul.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${modul.category === "mudah"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : modul.category === "sedang"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }`}>
            {modul.category}
          </span>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3 min-h-[60px]">{modul.overview}</p>
        </div>
      </div>
    </div>
  );
}

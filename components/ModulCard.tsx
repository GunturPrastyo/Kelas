"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, PlusCircle, Trash2, Edit3, Target, List } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { Button } from "@/components/ui/button";
import ModuleFeatureModal from "./ModuleFeatureModal"; // Impor modal baru

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
  onEdit: (modul: any) => void; // Add onEdit prop
}

export default function ModulCard({ modul, onDelete, onEdit }: Props) {
  const [hasPostTest, setHasPostTest] = useState<boolean | null>(null);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const router = useRouter(); // Keep router for internal navigation (e.g., to topics)

  useEffect(() => {
    const checkPostTest = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/check/${modul._id}`);
        const data = await res.json();
        setHasPostTest(data.exists);
      } catch (err) {
        console.error("Error checking post test:", err);
      }
    };
    checkPostTest();
  }, [modul._id]);

  // No longer need handleCardClick to navigate to edit page,
  // as edit will be handled by modal.
  // Card click will now navigate to the module's topic list.
  const handleCardClick = () => router.push(`/admin/modul/${modul.slug}`);

  return (
    <Fragment>
      <ModuleFeatureModal
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
        modulId={modul._id}
        modulTitle={modul.title}
      />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg border border-slate-200 dark:border-slate-700 transition-all flex flex-col cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Tombol Aksi di Kanan Atas */}
        <div className="absolute top-3 right-3 flex items-center space-x-1">
          <button
            title="Atur Bobot Kompetensi"
            onClick={(e) => { e.stopPropagation(); setIsFeatureModalOpen(true); }}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Target size={16} />
          </button>
          <Link
            href="#" // Change to # as edit is now modal-based
            title="Edit Modul"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); onEdit(modul); }} // Trigger onEdit prop
          >
            <Pencil size={16} />
          </Link>
      
          {onDelete && (
            <button
              title="Hapus Modul"
              onClick={(e) => { e.stopPropagation(); onDelete(modul._id); }}
              className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Konten utama yang bisa diklik */}
        <div className="flex flex-col flex-grow p-5 pt-12 flex-1">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg overflow-hidden">
              {modul.icon ? (
                <img
                  src={modul.icon?.startsWith('http') ? modul.icon : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`}
                  alt={modul.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {modul.title.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold dark:text-white">
                {modul.title}
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${modul.category === "mudah"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : modul.category === "sedang"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  }`}
              >
                {modul.category}
              </span>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3 min-h-[60px]">
                {modul.overview}
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Post Test */}
        <div
          className="px-5 pb-5 mt-auto grid grid-cols-2 gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/admin/modul/${modul.slug}`}>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <List size={16} />
              Topik
            </Button>
          </Link>

          {hasPostTest === null ? (
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ) : hasPostTest ? (
            <Link
              href={`/admin/modul/${modul.slug}/edit-post-test?modulId=${modul._id}`}
            >
              <Button className="w-full flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white">
                <Edit3 size={16} />
                Post Test
              </Button>
            </Link>
          ) : (
            <Link
              href={`/admin/modul/${modul.slug}/tambah-post-test?modulId=${modul._id}`}
            >
              <Button className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle size={16} />
                Post Test
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Fragment>
  );
}

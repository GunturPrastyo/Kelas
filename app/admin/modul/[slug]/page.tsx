"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Pastikan path ini benar
import { PlusCircle, FileEdit, Home } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { authFetch } from "@/lib/authFetch";
import TopicCard from "@/components/Topic";

interface Modul {
  _id: string;
  title: string;
  slug: string;
}

interface Topik {
  _id: string;
  title: string;
  slug: string;
}

interface ModulDetailProps {
  params: Promise<{ slug: string }>;
}

export default function ModulDetail({ params }: ModulDetailProps) {
  // Unwrap the params promise with React.use()
  const { slug } = use(params);
  const [modul, setModul] = useState<Modul | null>(null);
  const [allTopics, setAllTopics] = useState<Topik[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topik[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasModulPostTest, setHasModulPostTest] = useState<boolean | null>(null);
  const { searchQuery } = useUI();

  useEffect(() => {
    const fetchModulAndTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        const modulRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`);
        if (!modulRes.ok) {
          const errorData = await modulRes.json().catch(() => ({ message: "Gagal memuat data modul." }));
          throw new Error(errorData.message || "Gagal memuat data modul.");
        }
        const modulData = await modulRes.json();
        setModul(modulData);

        const topikRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul/${modulData._id}`);
        if (!topikRes.ok) {
          const errorData = await topikRes.json().catch(() => ({ message: "Gagal memuat data topik." }));
          throw new Error(errorData.message || "Gagal memuat data topik.");
        }
        const topikData = await topikRes.json();
        setAllTopics(topikData);
        setFilteredTopics(topikData);

        // Cek apakah modul ini punya post-test
        if (modulData._id) {
          try {
            const postTestRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/check/${modulData._id}`);
            if (postTestRes.ok) {
              const postTestData = await postTestRes.json();
              setHasModulPostTest(postTestData.exists);
            }
          } catch (err) {
            console.error("Gagal memeriksa post-test modul:", err);
          }
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.");
      } finally {
        setLoading(false);
      }
    };

    fetchModulAndTopics();
  }, [slug]);

  // Efek untuk memfilter topik di sisi client saat searchQuery berubah
  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = allTopics.filter(topik =>
        topik.title.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredTopics(filtered);
    } else {
      setFilteredTopics(allTopics); // Jika search kosong, tampilkan semua
    }
  }, [searchQuery, allTopics]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus topik ini?")) {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Gagal menghapus topik");
        setAllTopics(allTopics.filter((t) => t._id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <p className="p-6 text-center">Memuat data...</p>;
  if (error) return <p className="p-6 text-center text-red-500">Error: {error}</p>;
  if (!modul) return <p className="p-6 text-center text-red-500">Modul tidak ditemukan.</p>;

  return (
    <div className="p-5">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
          <li className="inline-flex items-center">
            <Link href="/admin/dashboard" className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
              <Home className="w-4 h-4 me-2.5" />
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>
              <Link href="/admin/modul" className="ms-1 text-sm font-medium hover:text-blue-600 md:ms-2 dark:hover:text-blue-400">Modul</Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>
              <span className="ms-1 text-sm font-medium text-gray-800 dark:text-gray-200 md:ms-2">{modul.title}</span>
            </div>
          </li>
        </ol>
      </nav>
      <div className="flex justify-between items-center mt-4 mb-6">
        <h1 className="text-2xl font-bold">Topik di Modul: {modul.title}</h1>

        <div className="flex items-center gap-2">
          {hasModulPostTest === null ? (
            <Button disabled className="animate-pulse">Memeriksa Tes...</Button>
          ) : hasModulPostTest ? (
            <Link href={`/admin/modul/${slug}/edit-post-test?modulId=${modul._id}`}>
              <Button variant="outline" className="flex items-center gap-2 text-yellow-600 border-yellow-500 hover:bg-yellow-50 hover:text-yellow-700">
                <FileEdit size={16} /> Edit Post Test Modul
              </Button>
            </Link>
          ) : (
            <Link href={`/admin/modul/${slug}/tambah-post-test?modulId=${modul._id}`}>
              <Button variant="outline" className="flex items-center gap-2 text-blue-600 border-blue-500 hover:bg-blue-50 hover:text-blue-700">
                <PlusCircle size={16} /> Tambah Post Test Modul
              </Button>
            </Link>
          )}

          <Link href={`/admin/modul/${slug}/tambah-topik?modulId=${modul._id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle size={16} className="mr-2" /> Tambah Topik
            </Button>
          </Link>
        </div>
      </div>

      {filteredTopics.length === 0 && !loading ? (
        <div className="text-center text-gray-500 py-10 col-span-full">
          <p>{searchQuery ? `Tidak ada topik yang cocok dengan "${searchQuery}".` : "Belum ada topik pada modul ini."}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topik) => (
            <TopicCard key={topik._id} topik={topik} modulId={modul._id} modulSlug={slug} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

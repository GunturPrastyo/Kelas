"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useUI } from "@/context/UIContext";
import TopicCard from "@/components/Topic";
import Breadcrumb from "@/components/Breadcrumb";

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
  const { searchQuery } = useUI();

  useEffect(() => {
    const fetchModulAndTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        const modulRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`);
        if (!modulRes.ok) throw new Error("Gagal memuat data modul");
        if (!modulRes.ok) {
          const errorData = await modulRes.json().catch(() => ({ message: "Gagal memuat data modul." }));
          throw new Error(errorData.message || "Gagal memuat data modul.");
        }

        const modulData = await modulRes.json();
        setModul(modulData);

        const topikRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul/${modulData._id}`);
        if (!topikRes.ok) throw new Error("Gagal memuat data topik");
        if (!topikRes.ok) {
          const errorData = await topikRes.json().catch(() => ({ message: "Gagal memuat data topik." }));
          throw new Error(errorData.message || "Gagal memuat data topik.");
        }

        const topikData = await topikRes.json();
        setAllTopics(topikData);
        setFilteredTopics(topikData);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/${id}`, { method: "DELETE" });
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
    <div className="p-6">
      <Breadcrumb
        paths={[
          { name: "Modul", href: "/admin/modul" },
          { name: modul.title, href: `/admin/modul/${slug}` },
        ]}
      />

      <div className="flex justify-between items-center mt-4 mb-6">
        <h1 className="text-2xl font-bold">Topik di Modul: {modul.title}</h1>

        <Link href={`/admin/modul/${slug}/tambah-topik?modulId=${modul._id}`}>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Tambah Topik
          </button>
        </Link>
      </div>

      {filteredTopics.length === 0 && !loading ? (
        <div className="text-center text-gray-500 py-10 col-span-full">
          <p>{searchQuery ? `Tidak ada topik yang cocok dengan "${searchQuery}".` : "Belum ada topik pada modul ini."}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topik) => (
            <TopicCard key={topik._id} topik={topik} modulSlug={slug} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

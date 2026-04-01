"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  FileEdit,
  Home,
  LayoutGrid,
  List,
} from "lucide-react";
import { useUI } from "@/context/UIContext";
import { authFetch } from "@/lib/authFetch";
import TopicCard from "@/components/Topic";
import TopikOrder from "@/components/TopikOrder";
import TopicFormModal from "@/components/TopicFormModal";

interface Modul {
  _id: string;
  title: string;
  slug: string;
  order: number;
}

interface Topik {
  _id: string;
  title: string;
  slug: string;
  order: number;
}

interface ModulDetailProps {
  params: Promise<{ slug: string }>;
}

export default function ModulDetail({ params }: ModulDetailProps) {
  const { slug } = use(params);

  const [modul, setModul] = useState<Modul | null>(null);
  const [allTopics, setAllTopics] = useState<Topik[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topik[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasModulPostTest, setHasModulPostTest] = useState<boolean | null>(null);
  const { searchQuery } = useUI();
  const [view, setView] = useState<"grid" | "order">("grid");

  // 🔥 modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchModulAndTopics = async () => {
      try {
        setLoading(true);
        setError(null);

        const modulRes = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`
        );

        if (!modulRes.ok) {
          const err = await modulRes.json().catch(() => ({
            message: "Gagal memuat modul",
          }));
          throw new Error(err.message);
        }

        const modulData = await modulRes.json();
        setModul(modulData);

        const topikRes = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul/${modulData._id}`
        );

        if (!topikRes.ok) throw new Error("Gagal memuat topik");

        const topikData = await topikRes.json();
        setAllTopics(topikData);
        setFilteredTopics(topikData);

        // cek post test
        const postTestRes = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/questions/check/${modulData._id}`
        );

        if (postTestRes.ok) {
          const data = await postTestRes.json();
          setHasModulPostTest(data.exists);
        } else {
          setHasModulPostTest(false);
        }
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchModulAndTopics();
  }, [slug]);

  // ================= FILTER =================
  useEffect(() => {
    if (searchQuery) {
      const filtered = allTopics.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTopics(filtered);
    } else {
      setFilteredTopics(allTopics);
    }
  }, [searchQuery, allTopics]);

  // ================= DELETE =================
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus topik?")) return;

    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/topik/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Gagal hapus");

      setAllTopics((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ================= STATE =================
  if (loading)
    return <p className="p-6 text-center">Memuat data...</p>;
  if (error)
    return (
      <p className="p-6 text-center text-red-500">
        Error: {error}
      </p>
    );
  if (!modul)
    return (
      <p className="p-6 text-center text-red-500">
        Modul tidak ditemukan
      </p>
    );

  return (
    <div className="p-5 mt-22">
      {/* ================= BREADCRUMB ================= */}
      <nav className="flex mb-4">
        <ol className="inline-flex items-center space-x-2 text-sm">
          <li>
            <Link href="/admin/dashboard" className="flex items-center gap-1 hover:text-blue-600">
              <Home size={16} /> Dashboard
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/admin/modul" className="hover:text-blue-600">
              Modul
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-gray-700 dark:text-gray-200">
            {modul.title}
          </li>
        </ol>
      </nav>

      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold">
          Topik: {modul.title}
        </h1>

        <div className="flex items-center gap-2 flex-wrap">

          {/* VIEW SWITCH */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded ${
                view === "grid" ? "bg-white shadow text-blue-600" : ""
              }`}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => setView("order")}
              className={`p-2 rounded ${
                view === "order" ? "bg-white shadow text-blue-600" : ""
              }`}
            >
              <List size={18} />
            </button>
          </div>

          {/* POST TEST */}
          {hasModulPostTest === null ? (
            <Button disabled>Loading...</Button>
          ) : hasModulPostTest ? (
            <Link href={`/admin/modul/${slug}/edit-post-test?modulId=${modul._id}`}>
              <Button variant="outline">
                <FileEdit size={14} /> Edit Post Test
              </Button>
            </Link>
          ) : (
            <Link href={`/admin/modul/${slug}/tambah-post-test?modulId=${modul._id}`}>
              <Button variant="outline">
                <PlusCircle size={14} /> Tambah Post Test
              </Button>
            </Link>
          )}

          {/* 🔥 MODAL BUTTON */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle size={14} className="mr-1" />
            Tambah Topik
          </Button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      {view === "grid" ? (
        filteredTopics.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            {searchQuery
              ? `Tidak ada hasil untuk "${searchQuery}"`
              : "Belum ada topik"}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics
              .sort((a, b) => a.order - b.order)
              .map((topik) => (
                <TopicCard
                  key={topik._id}
                  topik={topik}
                  modulId={modul._id}
                  modulSlug={slug}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        )
      ) : (
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-gray-500 mb-4">
            Drag untuk mengurutkan topik
          </p>
          <TopikOrder modulId={modul._id} />
        </div>
      )}

      {/* ================= MODAL ================= */}
      <TopicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modulId={modul._id}
        onSuccess={(newTopik) => {
          setAllTopics((prev) => [...prev, newTopik]);
        }}
      />
    </div>
  );
}
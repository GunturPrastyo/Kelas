"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TestForm from "@/components/TestForm";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

interface Question {
  _id?: string;
  questionText: string;
  options: string[];
  answer: string;
}

interface Topik {
  _id: string;
  title: string;
  modulId: string;
}

export default function EditPostTestTopikPage() {
  const params = useParams();
  const { slug, topikSlug } = params;

  const [topik, setTopik] = useState<Topik | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !topikSlug) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Ambil data topik dulu untuk mendapatkan ID-nya (disamakan dengan halaman tambah-post-test)
        const topikRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul-slug/${slug}/topik-slug/${topikSlug}`);
        if (!topikRes.ok) throw new Error("Gagal memuat data topik.");
        const topikResponse = await topikRes.json();
        const topikData = topikResponse.data || topikResponse; // Menangani jika data ada di dalam properti 'data'
        setTopik(topikData);

        // 2. Ambil data soal menggunakan ID dari topik
        const questionsRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-topik/${topikData.modulId}/${topikData._id}`);
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          setQuestions(questionsData.questions || []);
        } else if (questionsRes.status !== 404) { // 404 berarti belum ada soal, itu bukan error
          throw new Error("Gagal memuat data soal.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, topikSlug]);

  if (loading) {
    return <div className="p-6 text-center">Memuat data post-test...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  if (!topik) {
    return <div className="p-6 text-center text-red-500">Topik tidak ditemukan.</div>;
  }

  return (
    <div className="p-5">
      <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
        <ChevronRight size={16} className="mx-1" />
        <Link href="/admin/modul" className="hover:underline">Modul</Link>
        <ChevronRight size={16} className="mx-1" />
        <Link href={`/admin/modul/${slug}`} className="hover:underline">Detail Modul</Link>
        <ChevronRight size={16} className="mx-1" />
        <span className="font-medium text-gray-700 dark:text-gray-200">Edit Post Test</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Post Test: {topik.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">Ubah soal dan jawaban untuk post test topik ini.</p>
      </div>

      <TestForm
        testType="post-test-topik"
        modulId={topik.modulId}
        topikId={topik._id}
        modulSlug={slug as string}
        topikSlug={topikSlug as string}
        isEditing={questions.length > 0}
        initialQuestions={questions}
      />
    </div>
  );
}
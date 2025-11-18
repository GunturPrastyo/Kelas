"use client";

import { useState, useEffect, use } from "react";
import { useParams, useSearchParams } from "next/navigation";
import TestForm from "@/components/TestForm";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch";

interface Modul {
  _id: string;
  title: string;
  slug: string;
}

interface Topik {
  _id: string;
  title: string;
}

interface SubMateri {
  _id: string;
  title: string;
  content: string;
}

export default function TambahPostTestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const slug = params.slug as string;
  const topikSlug = params.topikSlug as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [modul, setModul] = useState<Modul | null>(null);
  const [topik, setTopik] = useState<Topik | null>(null);
  const [subMateris, setSubMateris] = useState<SubMateri[]>([]);

  useEffect(() => {
    if (!slug || !topikSlug) return;

    const fetchData = async () => {
      setPageLoading(true);
      try {
        // Ambil data topik dulu untuk mendapatkan ID-nya
        const topikRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul-slug/${slug}/topik-slug/${topikSlug}`);
        if (!topikRes.ok) throw new Error("Gagal memuat data topik.");
        const topikResponse = await topikRes.json();
        const topikData = topikResponse.data || topikResponse;
        setTopik(topikData);
        setModul({ _id: topikData.modulId, title: "", slug: slug }); // Set modul minimal
        
        // Ambil data materi untuk mendapatkan sub-topik
        const materiRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materi/modul/${slug}/topik/${topikSlug}`);
        if (materiRes.ok) {
          const materiData = await materiRes.json();
          setSubMateris(materiData.subMateris || []);
        }
      } catch (error) {
        console.error("Gagal memuat data modul/topik:", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [slug, topikSlug]);

  if (pageLoading) {
    return <div className="p-6 text-center">Memuat data...</div>;
  }

  return (
    <div className="p-5">
      <nav className="mt-22 flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/modul" className="hover:underline">Modul</Link>
        <span className="mx-2">/</span>
        <Link href={`/admin/modul/${slug}`} className="hover:underline">Detail Modul</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-700 dark:text-gray-200">Tambah Post Test</span>
      </nav>

        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          Tambah Post Test untuk {topik?.title || "..."}
        </h1>

        {topik?._id && modul?._id ? (
          <TestForm
            modulId={modul._id}
            topikId={topik._id}
            modulSlug={slug}
            topikSlug={topikSlug}
            isEditing={false}
            testType="post-test-topik"
            subMateris={subMateris}
          />
        ) : (
          <div className="text-center text-gray-500">
            Parameter modulId/topikId tidak ditemukan
          </div>
        )}
      </div>
  );
}

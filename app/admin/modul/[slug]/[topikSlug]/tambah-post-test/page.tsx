"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import TestForm from "@/components/TestForm";

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

export default function TambahPostTestPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const modulId = searchParams.get("modulId");
  const topikId = searchParams.get("topikId");
  const slug = params.slug as string;
  const topikSlug = params.topikSlug as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [modul, setModul] = useState<Modul | null>(null);
  const [topik, setTopik] = useState<Topik | null>(null);

  useEffect(() => {
    if (!slug || !topikSlug) return;

    let ignore = false;
    setPageLoading(true);
    setModul(null);
    setTopik(null);

    const fetchData = async () => {
      try {
        const [modulRes, topikRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul/${slug}/topik/${topikSlug}`),
        ]);

        if (!ignore) {
          if (modulRes.ok) {
            const modulData = await modulRes.json();
            setModul(modulData.data || modulData);
          }

          if (topikRes.ok) {
            const topikData = await topikRes.json();
            setTopik(topikData.data || topikData);
          }
        }
      } catch (error) {
        console.error("Gagal memuat data modul/topik:", error);
      } finally {
        if (!ignore) setPageLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [slug, topikSlug]);


  if (pageLoading) {
    return <div className="p-6 text-center">Memuat data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-screen p-5 mx-auto">
        <div className="py-4">
          <Breadcrumb
            paths={[
              { name: "Manajemen Modul", href: "/admin/modul" },
              { name: modul?.title || "...", href: `/admin/modul/${slug}` },
              { name: "Tambah Post Test", href: "#" },
            ]}
          />
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          Tambah Post Test untuk {topik?.title || "..."}
        </h1>

        {modulId && topikId ? (
          <TestForm
            modulId={modulId}
            topikId={topikId}
            modulSlug={slug}
            topikSlug={topikSlug}
            isEditing={false}
            testType="post-test-topik"
          />
        ) : (
          <div className="text-center text-gray-500">
            Parameter modulId/topikId tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}

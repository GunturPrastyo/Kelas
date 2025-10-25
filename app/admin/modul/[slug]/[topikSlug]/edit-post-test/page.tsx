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

export default function EditPostTestTopikPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const slug = params.slug as string; // modul slug
    const topikSlug = params.topikSlug as string; // topik slug

    const modulId = searchParams.get("modulId");
    const topikId = searchParams.get("topikId");

    const [modul, setModul] = useState<Modul | null>(null);
    const [topik, setTopik] = useState<Topik | null>(null);
    const [questions, setQuestions] = useState<
        { _id?: string; questionText: string; options: string[]; answer: string }[]
    >([]);

    const [loading, setLoading] = useState(true);

    // Fetch data modul dan topik untuk breadcrumb
    useEffect(() => {
        const fetchNames = async () => {
            if (!slug || !topikSlug) return;
            try {
                const [modulRes, topikRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul/${slug}/topik/${topikSlug}`), // Asumsi endpoint ini ada
                ]);
                if (modulRes.ok) setModul(await modulRes.json());
            } catch (error) { console.error("Gagal memuat nama untuk breadcrumb:", error); }
        };
        fetchNames();
    }, [slug, topikSlug]);
    useEffect(() => {
        if (!modulId || !topikId) return;

        const fetchData = async () => {
            try {
                // ✅ Ambil semua soal post test berdasarkan modul dan topik
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-topik/${modulId}/${topikId}`
                );
                const data = await res.json();

                if (res.ok) {
                    setQuestions(data.questions || []);
                } else {
                    alert("Gagal memuat data soal: " + data.message);
                }


    
            } catch (err) {
                console.error(err);
                alert("Terjadi kesalahan jaringan saat memuat data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [modulId, topikId, slug, topikSlug]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600">Memuat data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-screen p-5 mx-auto">
                <div className="py-4">
                    <Breadcrumb
                        paths={[
                            { name: "Manajemen Modul", href: "/admin/modul" },
                            { name: modul?.title || "...", href: `/admin/modul/${slug}` },
                            { name: "Edit Post Test Topik", href: "#" },
                        ]}
                    />
                </div>

                

                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                    Edit Post Test Topik
                </h1>

                {modulId && topikId && (
                    <TestForm
                        modulId={modulId}
                        topikId={topikId}
                        isEditing={true}
                        modulSlug={slug}
                        topikSlug={topikSlug}
                        initialQuestions={questions}
                        testType="post-test-topik"

                    />
                )}
            </div>
        </div>
    );
}

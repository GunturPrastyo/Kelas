"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
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
    order: number;
  }

export default function TambahPostTestPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const slug = params.slug as string;
    const modulId = searchParams.get("modulId");

    const [pageLoading, setPageLoading] = useState(true);
    const [modul, setModul] = useState<Modul | null>(null);
    const [topics, setTopics] = useState<Topik[]>([]);

    useEffect(() => {
        if (!slug || !modulId) return;
        const fetchData = async () => {
            try {
                // Fetch modul and topics in parallel
                const [modulRes, topicsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul/${modulId}`)
                ]);

                if (modulRes.ok) {
                    const modulData = await modulRes.json();
                    setModul(modulData);
                }
                if (topicsRes.ok) {
                    const topicsData = await topicsRes.json();
                    setTopics(topicsData);
                }
            } catch (error) {
                console.error("Gagal memuat data:", error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, [slug, modulId]);

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
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Tambah Post Test Modul</h1>
                {modulId && <TestForm 
                    modulId={modulId} 
                    modulSlug={slug} 
                    isEditing={false} 
                    topics={topics}
                    testType="post-test-modul"
                />}
            </div>
        </div>
    );
}

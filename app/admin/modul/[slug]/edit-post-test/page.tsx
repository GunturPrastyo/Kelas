"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { authFetch } from "@/lib/authFetch";
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

export default function EditPostTestPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const slug = params.slug as string;
    const modulId = searchParams.get("modulId");

    const [questions, setQuestions] = useState<
        { _id?: string; questionText: string; options: string[]; answer: string }[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [modul, setModul] = useState<Modul | null>(null);
    const [topics, setTopics] = useState<Topik[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!modulId) return;

        const fetchQuestions = async () => {
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-modul/${modulId}`);
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
                setFetching(false);
            }
        };

        fetchQuestions();

        const fetchModul = async () => {
            if (!slug) return;
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`);
                const data = await res.json();
                if (res.ok) setModul(data);
            } catch (error) {
                console.error("Gagal memuat data modul:", error);
            }
        };

        fetchModul();

        const fetchTopics = async () => {
            if (!modulId) return;
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul/${modulId}`);
                const data = await res.json();
                if (res.ok) setTopics(data);
            } catch (error) {
                console.error("Gagal memuat data topik:", error);
            }
        };
        fetchTopics();
    }, [modulId, slug]);

    if (fetching)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600">Memuat data...</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-screen p-5 mx-auto">
                <div className="py-4">
                    <Breadcrumb
                        paths={[
                            { name: "Manajemen Modul", href: "/admin/modul" },
                            // { name: modul?.title || "...", href: `/admin/modul/${slug}` },
                            { name: "Edit Post Test", href: "#" },
                        ]}
                    />
                </div>
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                    Edit Post Test Modul
                </h1>
                {modulId && <TestForm 
                    modulId={modulId} 
                    modulSlug={slug} 
                    isEditing={true} 
                    initialQuestions={questions} 
                    topics={topics}
                    testType="post-test-modul"
                />}
            </div>
        </div>
    );
}

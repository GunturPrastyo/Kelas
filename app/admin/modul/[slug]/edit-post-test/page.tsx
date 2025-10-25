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
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!modulId) return;

        const fetchQuestions = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/questions/post-test-modul/${modulId}`,
                    { credentials: 'include' } // Tambahkan ini untuk otentikasi
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
                setFetching(false);
            }
        };

        fetchQuestions();

        const fetchModul = async () => {
            if (!slug) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`, {
                    credentials: 'include' // Sebaiknya ditambahkan juga di sini
                });
                const data = await res.json();
                if (res.ok) setModul(data);
            } catch (error) {
                console.error("Gagal memuat data modul:", error);
            }
        };

        fetchModul();
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
                    testType="post-test-modul"
                />}
            </div>
        </div>
    );
}

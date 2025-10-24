"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import TestForm from "@/components/TestForm";

export default function EditPreTestPage() {
    const [questions, setQuestions] = useState<
        { _id?: string; questionText: string; options: string[]; answer: string }[]
    >([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPreTestQuestions = async () => {
            try {
                setFetching(true);
                setError(null);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/pre-test`);
                if (!res.ok) {
                    throw new Error("Gagal memuat soal pre-test.");
                }
                const data = await res.json();
                // API mengembalikan { questions: [...] }, jadi kita ambil array-nya
                setQuestions(data.questions || []);
            } catch (error) {
                console.error("Gagal memuat data pre-test:", error);
                setError(error instanceof Error ? error.message : "Terjadi kesalahan.");
            } finally {
                setFetching(false);
            }
        };
        fetchPreTestQuestions();
    }, []);

    if (fetching)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600">Memuat data...</p>
            </div>
        );

    if (error) {
        return <div className="p-6 text-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-screen p-5 mx-auto">
                <div className="py-4">
                    <Breadcrumb
                        paths={[
                            { name: "Manajemen Modul", href: "/admin/modul" },
                            { name: "Edit Pre-Test", href: "#" },
                        ]}
                    />
                </div>
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                    Edit Soal Pre-Test Global
                </h1>
                <TestForm testType="pre-test-global" isEditing={true} initialQuestions={questions} />
            </div>
        </div>
    );
}
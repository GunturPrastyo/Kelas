"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import TestForm from "@/components/TestForm";
import Breadcrumb from "@/components/Breadcrumb";

interface Question {
  _id?: string;
  questionText: string;
  options: string[];
  answer: string;
}

export default function TambahPreTestPage() {
  const [initialQuestions, setInitialQuestions] = useState<Question[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreTestQuestions = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/pre-test`);

        if (!res.ok) {
          throw new Error("Gagal memuat soal pre-test.");
        }

        const data = await res.json();
        if (data && data.questions && data.questions.length > 0) {
          setInitialQuestions(data.questions);
          setIsEditing(true);
        }
      } catch (err: any) {
        console.error("Gagal memuat data pre-test:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreTestQuestions();
  }, []);

  const breadcrumbPaths = [
    { name: "Modul dan Tes", href: "/admin/modul" },
    { name: isEditing ? "Edit Pre-Test Global" : "Tambah Pre-Test Global", href: "/admin/modul/tambah-pre-test" },
  ];

  if (loading) return <div>Memuat...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-5">
      <div className="mb-6">
        <Breadcrumb paths={breadcrumbPaths} />
        <h1 className="text-2xl font-bold mt-2">{isEditing ? "Edit Pre-Test Global" : "Tambah Pre-Test Global"}</h1>
        <p className="text-gray-500">Gunakan form di bawah ini untuk mengelola soal pre-test global.</p>
      </div>
      <TestForm
        testType="pre-test-global"
        isEditing={isEditing}
        initialQuestions={initialQuestions}
        modulSlug="pre-test" // Slug generik untuk navigasi kembali
      />
    </div>
  );
}
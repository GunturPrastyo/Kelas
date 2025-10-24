"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
    _id: string;
    questionText: string;
    options: string[];
}

interface PostTestTopikProps {
    questions: Question[];
    modulId: string;
    topikId: string;
    onTestComplete: (isSuccess: boolean) => void;
}

export default function PostTestTopik({ questions, modulId, topikId, onTestComplete }: PostTestTopikProps) {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const handleAnswerChange = (questionId: string, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.keys(answers).length !== questions.length) {
            alert("Harap jawab semua pertanyaan.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results/submit-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    testType: 'post-test-topik',
                    modulId,
                    topikId,
                    answers,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Gagal mengirimkan jawaban.");
            }

            const score = result.data.score;
            const isSuccess = score >= 80;

            alert(`Tes Selesai!\nSkor Anda: ${score}.\n\n${isSuccess ? "Selamat! Anda berhasil dan materi berikutnya terbuka." : "Anda belum mencapai skor minimal (80). Silakan pelajari kembali materi ini."}`);
            onTestComplete(isSuccess);

        } catch (error: any) {
            alert(`Terjadi kesalahan: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (questions.length === 0) {
        return <p className="text-sm text-center text-gray-500 dark:text-gray-400">Post-test untuk topik ini belum tersedia.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">🎯 Post Test Topik</h4>
            <div className="space-y-6">
                {questions.map((q, index) => (
                    <div key={q._id}>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: `${index + 1}. ${q.questionText}` }} />
                        <div className="space-y-2">
                            {q.options.map((option, oIndex) => (
                                <label key={oIndex} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={q._id}
                                        value={option}
                                        checked={answers[q._id] === option}
                                        onChange={() => handleAnswerChange(q._id, option)}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                    />
                                    <div className="text-sm text-gray-700 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: option }} />
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 dark:disabled:bg-gray-600 transition"
            >
                {submitting ? 'Mengirim...' : 'Selesaikan Tes'}
            </button>
        </form>
    );
}
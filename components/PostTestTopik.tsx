"use client";

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
    _id: string;
    questionText: string;
    options: string[];
}

interface ReviewQuestion extends Question {
    correctAnswer: string;
    userAnswer: string;
}

interface TestResult {
    score: number;
    correct: number;
    total: number;
}

interface PostTestTopikProps {
    questions: Question[];
    modulId: string;
    topikId: string;
    onTestComplete: (isSuccess: boolean) => void;
}

type TestMode = 'testing' | 'reviewing';

export default function PostTestTopik({ questions, modulId, topikId, onTestComplete }: PostTestTopikProps) {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState(false);
    const [mode, setMode] = useState<TestMode>('testing');
    const [reviewData, setReviewData] = useState<{ questions: ReviewQuestion[], result: TestResult } | null>(null);
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

            setReviewData({
                questions: result.data.review.questions,
                result: result.data.result,
            });
            setMode('reviewing');
            // onTestComplete akan dipanggil setelah user menekan tombol "Selesai" di halaman review

        } catch (error: any) {
            alert(`Terjadi kesalahan: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (questions.length === 0) {
        return <p className="text-sm text-center text-gray-500 dark:text-gray-400">Post-test untuk topik ini belum tersedia.</p>;
    }

    if (mode === 'reviewing' && reviewData) {
        const isSuccess = reviewData.result.score >= 80;
        return (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Hasil Post Test</h4>
                <div className={`p-4 rounded-lg mb-4 ${isSuccess ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                    <p className={`font-bold text-lg ${isSuccess ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                        Skor Anda: {reviewData.result.score}
                    </p>
                    <p className={`text-sm ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                        {isSuccess ? "Selamat! Anda berhasil dan materi berikutnya terbuka." : "Anda belum mencapai skor minimal (80). Silakan pelajari kembali materi ini."}
                    </p>
                </div>

                <div className="space-y-6">
                    {reviewData.questions.map((q, index) => {
                        const isUserCorrect = q.userAnswer === q.correctAnswer;
                        return (
                            <div key={q._id}>
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: `${index + 1}. ${q.questionText}` }} />
                                <div className="space-y-2">
                                    {q.options.map((option, oIndex) => {
                                        const isCorrectAnswer = option === q.correctAnswer;
                                        const isUserSelection = option === q.userAnswer;
                                        let optionClasses = "flex items-center gap-3 p-2 rounded-md text-sm ";

                                        if (isCorrectAnswer) {
                                            optionClasses += "bg-green-100 dark:bg-green-900/60 border border-green-400 text-green-800 dark:text-green-200";
                                        } else if (isUserSelection && !isUserCorrect) {
                                            optionClasses += "bg-red-100 dark:bg-red-900/60 border border-red-400 text-red-800 dark:text-red-300";
                                        } else {
                                            optionClasses += "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
                                        }

                                        return (
                                            <div key={oIndex} className={optionClasses}>
                                                {isCorrectAnswer ? '✅' : (isUserSelection ? '❌' : '⚪')}
                                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: option }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button
                    onClick={() => onTestComplete(isSuccess)}
                    className="mt-6 w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                    {isSuccess ? 'Lanjut ke Topik Berikutnya' : 'Tutup & Pelajari Lagi'}
                </button>
            </div>
        );
    }

    return (
        <Fragment>
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
        </Fragment>
    );
}
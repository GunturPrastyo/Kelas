"use client";

import Image from "next/image";

// Definisi tipe data untuk topik
interface Topik {
    _id: string;
    title: string;
    slug: string;
    materi?: {
        _id: string;
        content: string;
        youtube?: string;
    } | null;
    questions: any[]; // Bisa diganti nanti kalau sudah tahu struktur soalnya
    isCompleted: boolean;
}

interface TopicContentProps {
    topik: Topik;
    onStartTest: (topik: Topik, retake?: boolean) => Promise<void> | void;
    onViewScore: (topik: Topik) => void;
}

// Fungsi bantu untuk mengubah URL YouTube menjadi URL embed
const getYouTubeEmbedUrl = (url?: string) => {
    if (!url || typeof url !== "string") return null;
    let videoId = "";

    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === "youtu.be") {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes("youtube.com")) {
            videoId =
                urlObj.searchParams.get("v") ||
                urlObj.pathname.split("/embed/")[1] ||
                "";
        }
    } catch {
        // Regex fallback kalau URL tidak valid
        const match = url.match(
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        videoId = match ? match[1] : "";
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

export default function TopicContent({ topik, onStartTest, onViewScore }: TopicContentProps) {
    const embedUrl = getYouTubeEmbedUrl(topik?.materi?.youtube);
    const materiHTML = topik?.materi?.content || "<p>Materi belum tersedia.</p>";

    return (
        <div className="px-5 pb-5 pt-4 border-t border-gray-200 dark:border-gray-700 max-h-[70vh] overflow-y-auto">
            {/* Video YouTube */}
            {embedUrl && (
                <div className="aspect-video mb-4">
                    <iframe
                        src={embedUrl}
                        title={`Video untuk ${topik.title}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-lg"
                    ></iframe>
                </div>
            )}

            {/* Konten Materi */}
            <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: materiHTML }}
            />

            {/* Kartu Post-Test */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-5 flex flex-col md:flex-row items-center gap-5 flex-wrap">
                    <Image
                        src="/post-test-topik.png"
                        alt="Post Test"
                        width={100}
                        height={100}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                    />
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            Waktunya Uji Pemahaman!
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
                            Setelah mempelajari materi, uji pemahamanmu dengan mengerjakan post-test singkat ini.
                        </p>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <button
                                onClick={() => onStartTest(topik, topik.isCompleted)}
                                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded-xl shadow-md transition transform hover:scale-105"
                            >
                                🚀 {topik.isCompleted ? "Ulangi Post-Test" : "Mulai Post-Test"}
                            </button>
                            {topik.isCompleted && (
                                <button
                                    onClick={() => onViewScore(topik)} // Fungsi ini akan menampilkan skor yang sudah ada
                                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md transition transform hover:scale-105"
                                >
                                    Lihat Skor
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

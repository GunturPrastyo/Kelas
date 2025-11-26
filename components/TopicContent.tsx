"use client";

import Image from 'next/image';

interface Materi {
    _id: string;
    subMateris: {
        _id: string;
        title: string;
        content: string;
    }[];
    youtube?: string;
}

interface Topik {
    _id: string;
    title: string;
    slug: string;
    materi?: Materi | null;
    isCompleted: boolean;
    questions: any[]; // Tipe bisa disesuaikan
}

interface TopicContentProps {
    topik: Topik;
    onStartTest: (topik: Topik, retake: boolean) => void;
    onViewScore: (topik: Topik) => void;
    hasAttempted: boolean;
}

// Fungsi bantu untuk mengubah URL YouTube menjadi URL embed
const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url || typeof url !== "string") return null;

    let videoId = "";
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === "youtu.be") {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes("youtube.com")) {
            videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/embed/")[1] || "";
        }
    } catch (e) {
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        videoId = match ? match[1] : "";
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

export default function TopicContent({ topik, onStartTest, onViewScore, hasAttempted }: TopicContentProps) {
    const embedUrl = getYouTubeEmbedUrl(topik?.materi?.youtube);
    const subMateris = topik?.materi?.subMateris || [];

    return (
        <div className="px-2 pb-5 pt-4 border-t border-gray-200 dark:border-gray-700 max-h-[70vh] overflow-y-auto">
            {embedUrl && (
                <div className="aspect-video mb-6 rounded-lg overflow-hidden">
                    <iframe src={embedUrl} title={`Video untuk ${topik.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                </div>
            )}

            <div className="prose dark:prose-invert max-w-full space-y-4">
                {subMateris.length > 0 ? (
                    subMateris.map((sub, index) => (
                        <div
                        key={sub._id || index}
                        id={sub._id} // ID unik untuk target scroll
                        className="max-w-full w-full scroll-mt-24 bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-200 dark:border-gray-700/60 shadow-sm border-l-4 border-l-blue-500"
                        >
                            <h4 className="font-bold text-lg !mb-2 text-gray-800 dark:text-gray-100">{sub.title}</h4>
                            <div dangerouslySetInnerHTML={{ __html: sub.content }} />
                        </div>
                    ))
                ) : (
                    <p>Materi untuk topik ini belum tersedia.</p>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">

                    {/* Gambar + Deskripsi sejajar */}
                    <div className="flex flex-row items-center gap-4">
                        <Image
                            src="/post-test-topik.png"
                            alt="Post Test"
                            width={256}
                            height={256}
                            className="w-24 h-24 sm:w-28 sm:h-28 object-contain flex-shrink-0"
                        />
                        <div className="text-left flex-1">
                            <h4 className="text-base sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                                Waktunya Uji Pemahaman!
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                Setelah mempelajari materi, uji pemahamanmu dengan mengerjakan post-test singkat ini.
                            </p>
                        </div>
                    </div>

                    {/* Tombol sejajar */}
                    <div className="flex flex-row justify-start gap-3 w-full flex-wrap">
                        <button
                            onClick={() => onStartTest(topik, hasAttempted)}
                            className="text-sm px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded-xl shadow-md transition transform hover:scale-105 active:scale-95 focus:ring-2 focus:ring-yellow-200 sm:px-5 sm:py-2"
                        >
                            {hasAttempted ? "Ulangi Post-Test" : "Mulai Post-Test"}
                        </button>

                        {hasAttempted && (
                            <button
                                onClick={() => onViewScore(topik)}
                                className="text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md transition transform hover:scale-105 active:scale-95 focus:ring-2 focus:ring-blue-300 sm:px-5 sm:py-2"
                            >
                                Lihat Skor
                            </button>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
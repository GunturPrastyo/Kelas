"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, use, useEffect, useCallback } from "react";
import { Modal } from "flowbite-react";

const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), {
  ssr: false,
});

interface MateriEditorPageProps {
  params: Promise<{ slug: string; topikSlug: string }>;
}

// Helper function to convert YouTube watch URL to embed URL
const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  // Check if it's already an embed URL
  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  // Regex to extract video ID from various YouTube URLs
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
  const match = url.match(regExp);

  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  return null; // Invalid YouTube URL
};

export default function MateriEditorPage({ params }: MateriEditorPageProps) {
  const { slug, topikSlug } = use(params);

  const [content, setContent] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [materiId, setMateriId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMateri = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/materi/modul/${slug}/topik/${topikSlug}`
        );

        if (!res.ok) {
          // Jika 404, berarti materi belum ada. Biarkan state default.
          if (res.status !== 404) throw new Error("Gagal memuat materi");
          return;
        }

        const data = await res.json();
        if (data) {
          setContent(data.content || "");
          // When loading existing data, set both input and embed URL
          setYoutubeInput(data.youtube || "");
          setYoutubeEmbedUrl(data.youtube ? getEmbedUrl(data.youtube) : null); // Validate on load
          setMateriId(data._id);
        }
      } catch (err) {
        console.error("❌ Error saat memuat materi:", err);
      } finally {
        // No specific loading state for fetchMateri, so nothing here
      }
    };

    fetchMateri();
  }, [slug, topikSlug]);

  // Effect to validate YouTube input whenever it changes
  useEffect(() => {
    if (youtubeInput) {
      const embedUrl = getEmbedUrl(youtubeInput);
      setYoutubeEmbedUrl(embedUrl);
      setYoutubeError(embedUrl ? null : "URL YouTube tidak valid. Harap masukkan URL video YouTube yang benar.");
    } else {
      setYoutubeEmbedUrl(null);
      setYoutubeError(null);
    }
  }, [youtubeInput]);

  const handleSave = async () => {
    setLoading(true);
    setYoutubeError(null); // Clear previous errors

    // Validate YouTube URL before saving
    const finalYoutubeUrl = getEmbedUrl(youtubeInput);
    if (youtubeInput && !finalYoutubeUrl) {
      setYoutubeError("URL YouTube tidak valid. Harap masukkan URL video YouTube yang benar.");
      setLoading(false);
      return;
    }

    try {
      const isUpdate = !!materiId;
      const url = isUpdate
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/materi/${materiId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/materi`;
      const method = isUpdate ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          youtube: youtubeInput, // Simpan URL asli yang diinput pengguna
          ...(!isUpdate && { modulId: slug, topikId: topikSlug }),
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan materi");
      const data = await res.json();

      // Update state setelah berhasil menyimpan
      setSaved(true);
      // Pastikan kita mendapatkan _id dari data yang dikembalikan
      setMateriId(data.data?._id || data._id);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("❌ Error saat menyimpan materi:", err);
      alert("Terjadi kesalahan saat menyimpan materi. Periksa log console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-gray-600 dark:text-gray-300">
        <Link href="/admin/modul" className="hover:underline text-blue-600">
          Modul
        </Link>{" "}
        /{" "}
        <Link href={`/admin/modul/${slug}`} className="hover:underline text-blue-600">
          {slug.replace(/-/g, " ")}
        </Link>{" "}
        /{" "}
        <span className="font-medium text-gray-900 dark:text-white">
          {topikSlug.replace(/-/g, " ")}
        </span>
      </nav>

      {/* Input YouTube */}
      <div className="mb-5 flex items-center space-x-2">
        <label htmlFor="youtube" className="block text-sm font-medium text-gray-900 dark:text-white">
          Embed Video YouTube (opsional)
        </label>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
        >
          ?
        </button>
      </div>

      <input
        type="text"
        id="youtube"
        placeholder="https://www.youtube.com/embed/VIDEO_ID"
        value={youtubeInput} // Menggunakan youtubeInput yang sudah dideklarasikan
        onChange={(e) => setYoutubeInput(e.target.value)} // Menggunakan setYoutubeInput
        className={`block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 focus:ring-2 focus:outline-none p-2 mb-2 ${youtubeError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
      />
      {youtubeError && (
        <p className="text-red-500 text-xs mt-1 mb-2">{youtubeError}</p>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-300 mb-5">
        Masukkan URL video YouTube (bukan link embed). Kami akan mengkonversinya secara otomatis.
      </p>

      {/* Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border p-5 mb-5">
        <TiptapEditor 
          key={materiId}
          content={content}
          onChange={setContent}
          placeholder="Mulai menulis materi di sini..." />
      </div>

      {/* Tombol simpan */}
      <button
        onClick={handleSave}
        disabled={loading || !!youtubeError} // Disable if there's a YouTube error
        className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Menyimpan..." : saved ? "✅ Tersimpan!" : "💾 Simpan Materi"}
      </button>

      {/* Preview Video */}
      {youtubeEmbedUrl && ( // Use youtubeEmbedUrl for preview
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Preview Video
          </h2>
          <div className="aspect-video">
            <iframe 
              src={youtubeEmbedUrl}
              title="Video YouTube"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Modal panduan embed video */}
      {showModal && (
        <Modal show={showModal} size="lg" popup onClose={() => setShowModal(false)}>
          <div className="p-6 text-center">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Panduan URL Video YouTube
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Cukup salin URL video YouTube dari browser Anda (misal: <code>https://www.youtube.com/watch?v=VIDEO_ID</code> atau <code>https://youtu.be/VIDEO_ID</code>). Kami akan mengkonversinya secara otomatis ke format embed.
            </p>
            <img
              src="/youtube-embed-example.png"
              alt="Contoh embed YouTube"
              className="mx-auto rounded-lg mb-4"
            />
            <button
              onClick={() => setShowModal(false)}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
            >
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

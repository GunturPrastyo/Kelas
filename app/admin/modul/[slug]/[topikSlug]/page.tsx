"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, use } from "react"; // tambahkan use()
import { Modal, Button } from "flowbite-react";

// Dynamic import untuk Tiptap karena client-side only
const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), {
  ssr: false,
});

interface MateriEditorPageProps {
  params: Promise<{ slug: string; topikSlug: string }>; // params sekarang Promise
}

export default function MateriEditorPage({ params }: MateriEditorPageProps) {
  // unwrap Promise dengan use()
  const { slug, topikSlug } = use(params);

  const [content, setContent] = useState("<p>Mulai menulis materi...</p>");
  const [youtube, setYoutube] = useState("");
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      window.location.href = `/admin/modul/${slug}`;
    }, 800);
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-gray-600 dark:text-gray-300">
        <Link href="/admin/modul" className="hover:underline text-blue-600">
          Modul
        </Link>{" "}
        /{" "}
        <Link
          href={`/admin/modul/${slug}`}
          className="hover:underline text-blue-600"
        >
          {slug.replace(/-/g, " ")}
        </Link>{" "}
        /{" "}
        <span className="font-medium text-gray-900 dark:text-white">
          {topikSlug.replace(/-/g, " ")}
        </span>
      </nav>

      {/* Input YouTube */}
      <div className="mb-5 flex items-center space-x-2">
        <label
          htmlFor="youtube"
          className="block text-sm font-medium text-gray-900 dark:text-white"
        >
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
        value={youtube}
        onChange={(e) => setYoutube(e.target.value)}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none p-2 mb-2"
      />
      <p className="text-sm text-gray-500 dark:text-gray-300 mb-5">
        Masukkan URL embed YouTube, misal: https://www.youtube.com/embed/VIDEO_ID
      </p>

      {/* Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border p-5 mb-5">
        <TiptapEditor content={content} onChange={setContent} />
      </div>

      {/* Tombol simpan */}
      <button
        onClick={handleSave}
        className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800"
      >
        Simpan Materi
      </button>

      {/* Preview Video */}
      {youtube && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Preview Video
          </h2>
          <div className="aspect-video">
            <iframe
              src={youtube}
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
              Cara Embed Video YouTube
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Salin link embed dari YouTube dan masukkan ke field di atas.
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

"use client";

import dynamic from "next/dynamic";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Link from "next/link";
import { useState, use, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { authFetch } from "@/lib/authFetch";
import { Modal } from "flowbite-react";
import { PlusCircle, Save, X, BookOpen, Code } from "lucide-react";
import SubMateriItem from "@/components/SubMateriItem";

const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), {
  ssr: false,
});

interface Practice {
  _id?: string;
  type: 'html' | 'javascript';
  title: string;
  description: string;
  initialCode: string;
  hint: string;
  expectedOutputRegex: string[];
}

interface SubMateri {
  _id?: string; 
  title: string;
  content: string;
}

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

  const [subMateris, setSubMateris] = useState<SubMateri[]>([]);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [topikId, setTopikId] = useState<string | null>(null); // State untuk menyimpan ID topik
  const [activeTab, setActiveTab] = useState<'materi' | 'praktik'>('materi');

  useEffect(() => {
    const fetchMateri = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materi/modul/${slug}/topik/${topikSlug}`);

        if (!res.ok) {
          if (res.status === 404) {
            // Materi belum ada, tapi backend mengirimkan topikId
            const errorData = await res.json();
            setTopikId(errorData.topikId); // Set topikId untuk pembuatan materi baru
          } else {
            throw new Error("Gagal memuat materi");
          }
        } else {
          const data = await res.json();
          setSubMateris(data.subMateris || []);
          setYoutubeInput(data.youtube || "");
          setYoutubeEmbedUrl(data.youtube ? getEmbedUrl(data.youtube) : null);
          setTopikId(data.topikId);
          setPractices(data.practices || []);
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

  const handleAddSubMateri = () => {
    setSubMateris([...subMateris, { title: "", content: "" }]);
  };

  const handleRemoveSubMateri = (index: number) => {
    const newSubMateris = [...subMateris];
    newSubMateris.splice(index, 1);
    setSubMateris(newSubMateris);
  };

  const handleSubMateriChange = (index: number, field: 'title' | 'content', value: string) => {
    const newSubMateris = [...subMateris];
    newSubMateris[index] = { ...newSubMateris[index], [field]: value };
    setSubMateris(newSubMateris);
  };

  const moveSubMateri = useCallback((dragIndex: number, hoverIndex: number) => {
    const draggedItem = subMateris[dragIndex];
    setSubMateris(current => {
      const updated = [...current];
      updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, draggedItem);
      return updated;
    });
  }, [subMateris]);

  // --- Handler untuk Praktik (Coding) ---
  const handleAddPractice = () => {
    setPractices([...practices, { 
      type: 'javascript', 
      title: "", 
      description: "", 
      initialCode: "", 
      hint: "", 
      expectedOutputRegex: [] 
    }]);
  };

  const handleRemovePractice = (index: number) => {
    const newPractices = [...practices];
    newPractices.splice(index, 1);
    setPractices(newPractices);
  };

  const handlePracticeChange = (index: number, field: keyof Practice, value: any) => {
    const newPractices = [...practices];
    newPractices[index] = { ...newPractices[index], [field]: value };
    setPractices(newPractices);
  };

  const handleAddRegex = (practiceIndex: number) => {
    const newPractices = [...practices];
    newPractices[practiceIndex].expectedOutputRegex.push("");
    setPractices(newPractices);
  };

  const handleRemoveRegex = (practiceIndex: number, regexIndex: number) => {
    const newPractices = [...practices];
    newPractices[practiceIndex].expectedOutputRegex.splice(regexIndex, 1);
    setPractices(newPractices);
  };

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
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/materi/save`;
      const res = await authFetch(url, {
        method: "POST", // Selalu POST untuk operasi upsert
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topikId: topikId, // Kirim topikId untuk identifikasi di backend
          subMateris,
          youtube: youtubeInput, // Simpan URL asli yang diinput pengguna
          practices, // Simpan daftar praktik
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan materi");
      
      toast.success("Materi berhasil disimpan!");

    } catch (err) {
      console.error("❌ Error saat menyimpan materi:", err);
      toast.error("Terjadi kesalahan saat menyimpan materi. Periksa log console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
      <Toaster position="top-center" reverseOrder={false} />
      {/* Breadcrumb */}
      <nav className="mt-22 text-sm mb-6 text-gray-600 dark:text-gray-300">
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editor Materi</h1>
        <button
          onClick={handleSave}
          disabled={loading || !!youtubeError}
          className="bg-blue-700 text-white px-5 py-2.5 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save size={18} />
          {loading ? "Menyimpan..." : "Simpan Materi"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('materi')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'materi'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
        >
          <BookOpen size={18} /> Mode Bacaan
        </button>
        <button
          onClick={() => setActiveTab('praktik')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'praktik'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
        >
          <Code size={18} /> Mode Praktik
        </button>
      </div>

      {activeTab === 'materi' && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
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
          </div>
      
          {/* Sub-Materi Editor */}
          <div className="space-y-6">
            {subMateris.map((sub, index) => (
              <SubMateriItem
                key={sub._id || index} // Gunakan ID jika ada, atau index sebagai fallback
                index={index}
                subMateri={sub}
                onMove={moveSubMateri}
                onChange={handleSubMateriChange}
                onRemove={handleRemoveSubMateri}
              />
            ))}
          </div>
      
          {/* Tombol Tambah Sub Materi */}
          <div className="mt-6">
            <button
              onClick={handleAddSubMateri}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <PlusCircle size={18} /> Tambah Bagian Materi
            </button>
          </div>

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
        </div>
      )}

      {activeTab === 'praktik' && (
        <div className="animate-in fade-in duration-300">
          <div className="mb-6 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editor Praktik (Coding)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tambahkan soal latihan interaktif untuk materi ini.</p>
            </div>
          </div>
    
          <div className="space-y-6">
            {practices.map((practice, pIndex) => (
              <div key={practice._id || pIndex} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-lg text-gray-800 dark:text-white">Soal Praktik #{pIndex + 1}</h3>
                   <button onClick={() => handleRemovePractice(pIndex)} className="text-red-500 hover:text-red-700 text-sm font-medium">Hapus Soal</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Judul Latihan</label>
                        <input type="text" value={practice.title} onChange={(e) => handlePracticeChange(pIndex, 'title', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm" placeholder="Contoh: Latihan 1: Variabel" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tipe Bahasa</label>
                        <select value={practice.type} onChange={(e) => handlePracticeChange(pIndex, 'type', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm">
                            <option value="html">HTML</option>
                            <option value="javascript">JavaScript</option>
                        </select>
                    </div>
                </div>
    
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Deskripsi Soal</label>
                    <TiptapEditor 
                      content={practice.description} 
                      onChange={(val) => handlePracticeChange(pIndex, 'description', val)} 
                      placeholder="Jelaskan apa yang harus dilakukan siswa..." 
                    />
                </div>
    
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Initial Code (Kode Awal)</label>
                    <textarea value={practice.initialCode} onChange={(e) => handlePracticeChange(pIndex, 'initialCode', e.target.value)} rows={4} className="w-full p-3 font-mono text-sm border rounded-lg bg-gray-900 text-gray-100 border-gray-700" placeholder="// Tulis kode awal di sini..."></textarea>
                </div>
    
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Hint (Petunjuk)</label>
                    <TiptapEditor 
                      content={practice.hint} 
                      onChange={(val) => handlePracticeChange(pIndex, 'hint', val)} 
                      placeholder="Berikan petunjuk jika siswa kesulitan..." 
                    />
                </div>
    
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Kata Kunci Kode / Output Console (Expected Output)</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Tambahkan potongan kode atau teks output console. Siswa dianggap benar jika kodenya atau output console-nya mengandung SEMUA teks di bawah ini (Spasi akan diabaikan).</p>
                    {practice.expectedOutputRegex.map((regex, rIndex) => (
                        <div key={rIndex} className="flex items-center gap-2 mb-2">
                            <input type="text" value={regex} onChange={(e) => {
                                const newPractices = [...practices];
                                newPractices[pIndex].expectedOutputRegex[rIndex] = e.target.value;
                                setPractices(newPractices);
                            }} className="flex-1 p-2 font-mono text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" placeholder="Contoh: console.log(nama) atau Halo Dunia" />
                            <button onClick={() => handleRemoveRegex(pIndex, rIndex)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><X size={18}/></button>
                        </div>
                    ))}
                    <button onClick={() => handleAddRegex(pIndex)} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium flex items-center gap-1 mt-1">+ Tambah Kata Kunci</button>
                </div>
              </div>
            ))}
          </div>
    
          <div className="mt-6 mb-8">
            <button
              onClick={handleAddPractice}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 dark:border-blue-600/50 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition"
            >
              <PlusCircle size={18} /> Tambah Soal Praktik Baru
            </button>
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
    </DndProvider>
  );
}

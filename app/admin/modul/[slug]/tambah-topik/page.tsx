"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Asumsi Anda memiliki SidebarContext untuk state isSidebarCollapsed
// import { SidebarContext } from "@/context/SidebarContext";
 
export default function TambahTopikPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { modulId?: string };
}) {
  const router = useRouter();
  const { slug: modulSlug } = params;
  const modulId = searchParams?.modulId;

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk membuat slug otomatis dari judul
  const generateSlug = (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!modulId) {
      setError("ID Modul tidak ditemukan. Kembali dan coba lagi.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug: generateSlug(title), modulId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menyimpan topik. Pastikan slug unik.");
      }

      // Kembali ke halaman detail modul setelah berhasil
      router.replace(`/admin/modul/${modulSlug}`); // Menggunakan replace lebih baik setelah submit form
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Terjadi kesalahan");
      } else {
        setError("Terjadi kesalahan yang tidak diketahui");
      }
      setLoading(false);
    }
  };

  return (
    // Anda perlu mendapatkan isSidebarCollapsed dari context di sini
    <div className={`p-6 mx-auto transition-all duration-300 max-w-7xl`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Tambah Topik Baru</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Judul Topik</label>
            <input type="text" id="title" className="block w-full p-3 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700" placeholder="Contoh: Variabel dan Tipe Data" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Slug akan dibuat secara otomatis dari judul.</p>
          </div>
          <div className="flex justify-between items-center">
            <Link href={`/admin/modul/${modulSlug}`} className="text-sm text-blue-600 hover:underline">
              &larr; Kembali ke Modul
            </Link>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? "Menyimpan..." : "Simpan Topik"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

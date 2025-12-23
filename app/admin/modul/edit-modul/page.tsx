"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { authFetch } from "@/lib/authFetch";
import Link from "next/link";

function EditModulForm({ isSidebarCollapsed }: { isSidebarCollapsed?: boolean }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [category, setCategory] = useState("mudah");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [modulId, setModulId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(slug);

  useEffect(() => {
    const fetchModul = async () => {
      try {
        if (!slug) {
          throw new Error("Slug modul tidak ditemukan di URL.");
        }
        setLoading(true);
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${slug}`);
        if (!res.ok) {
          throw new Error("Gagal memuat data modul.");
        }
        const data = await res.json();
        setTitle(data.title);
        setOverview(data.overview);
        setCategory(data.category);
        setModulId(data._id);
        if (data.icon) {
          setIconPreview(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${data.icon}`);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchModul();
  }, [slug]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      // Buat URL sementara untuk pratinjau
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const generateSlug = (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("overview", overview);
      formData.append("category", category);
      formData.append("slug", generateSlug(title));
      if (iconFile) formData.append("icon", iconFile);

      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${modulId}`, {
        method: "PUT",
        body: formData, // Menggunakan FormData, hapus header Content-Type
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal memperbarui modul.");
      }

      const updatedModul = await res.json();

      // Redirect ke halaman detail modul dengan slug baru jika berubah
      router.push(`/admin/modul/${updatedModul.data.slug}`);
      router.refresh(); // Penting untuk memuat ulang data di halaman detail
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-center">Memuat data modul...</p>;

  return (
    <div className={`mt-20 p-6 mx-auto transition-all duration-300 ${isSidebarCollapsed ? 'max-w-full' : 'max-w-7xl'}`}>
      <div className="mb-6">
        <Breadcrumb
          paths={[
            { name: "Manajemen Modul", href: "/admin/modul" },
            { name: "Edit Modul", href: `/admin/modul/edit-modul?slug=${slug}` },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Modul</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Judul Modul</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700" required />
          </div>
          <div>
            <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Kategori Modul</label>
            <select id="category" className="block w-full p-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
            </select>
          </div>
          <div>
            <label htmlFor="file_input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Ganti Icon Modul (Opsional)</label>
            <input className="p-2 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="file_input" type="file" accept="image/*" onChange={handleFileChange} />
            {iconPreview && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  {iconFile ? "Pratinjau Icon Baru:" : "Icon Saat Ini:"}
                </p>
                <img src={iconPreview} alt="Preview Icon" className="w-24 h-24 object-contain rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-1" />
              </div>
            )}
            
          </div>
          <div>
            <label htmlFor="overview" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Deskripsi / Overview</label>
            <textarea id="overview" value={overview} onChange={(e) => setOverview(e.target.value)} rows={4} className="block w-full p-3 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700" required></textarea>
          </div>
          <div className="flex justify-between items-center">
            <Link href={'/admin/modul'} className="text-sm text-blue-600 hover:underline">
              &larr; Batal
            </Link>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditModulPage({ isSidebarCollapsed }: { isSidebarCollapsed?: boolean }) {
  return (
    <Suspense fallback={<p className="p-6 text-center">Memuat halaman...</p>}>
      <EditModulForm isSidebarCollapsed={isSidebarCollapsed} />
    </Suspense>
  );
}
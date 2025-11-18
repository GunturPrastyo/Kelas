"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";

export default function TambahModulPage({ isSidebarCollapsed }: { isSidebarCollapsed?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("mudah");
  const [overview, setOverview] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("overview", overview);
      formData.append("slug", generateSlug(title));
      if (iconFile) formData.append("icon", iconFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal menyimpan modul");

      router.push("/admin/modul");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan");
      setLoading(false);
    }
  };

  return (
    <div className={`mt-22 p-6 mx-auto transition-all duration-300 ${isSidebarCollapsed ? 'max-w-full' : 'max-w-7xl'}`}>
      <div className="mb-6">
        <Breadcrumb
          paths={[
            { name: "Manajemen Modul", href: "/admin/modul" },
            { name: "Tambah Modul", href: "/admin/modul/tambah-modul" },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-10 space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Tambah Modul Baru</h1>
        {error && <p className="text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Judul Modul</label>
            <input type="text" id="title" className="block w-full p-2 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700" placeholder="Masukkan judul modul" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="file_input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Upload Icon Modul</label>
            <input className="p-2 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="file_input" type="file" accept="image/*" onChange={handleFileChange} />
            {iconPreview && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Preview Icon:</p>
                <img src={iconPreview} alt="Preview Icon" className="w-32 h-32 object-contain rounded-lg border border-gray-300 dark:border-gray-600" />
              </div>
            )}
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
            <label htmlFor="overview" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Deskripsi / Overview Modul</label>
            <textarea id="overview" rows={5} className="block w-full p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Masukkan deskripsi modul..." value={overview} onChange={(e) => setOverview(e.target.value)} required />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? "Menyimpan..." : "Simpan Modul"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

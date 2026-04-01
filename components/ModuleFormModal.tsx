"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";

interface Module {
  _id?: string;
  title: string;
  slug?: string;
  category: string;
  overview: string;
  icon?: string;
  order?: number;
}

interface ModuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Module | null;
  onSubmit: (
    data: FormData,
    isEditing: boolean,
    moduleId?: string
  ) => Promise<void>;
}

export default function ModuleFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}: ModuleFormModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("mudah");
  const [overview, setOverview] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [existingIcon, setExistingIcon] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Reset + isi data saat buka modal
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setSlug(initialData?.slug || "");
      setCategory(initialData?.category || "mudah");
      setOverview(initialData?.overview || "");
      setExistingIcon(initialData?.icon || "");
      setIconFile(null);
    }
  }, [isOpen, initialData]);

  // 🔥 AUTO GENERATE SLUG
  useEffect(() => {
    // kalau edit & slug sudah ada → jangan overwrite
    if (initialData?._id) return;

    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    setSlug(generatedSlug);
  }, [title, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIconFile(e.target.files[0]);
      setExistingIcon("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug); // 🔥 FIX UTAMA
    formData.append("category", category);
    formData.append("overview", overview);

    if (iconFile) {
      formData.append("icon", iconFile);
    } else if (existingIcon) {
      formData.append("iconUrl", existingIcon);
    }

    try {
      await onSubmit(
        formData,
        !!initialData?._id,
        initialData?._id
      );
      onClose();
    } catch (error) {
      console.error("Failed to submit module form:", error);
      alert("Gagal menyimpan modul. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {initialData?._id ? "Edit Modul" : "Tambah Modul"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">

          {/* TITLE */}
          <div>
            <label className="text-sm">Judul Modul</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* SLUG */}
          <div>
            <label className="text-sm">Slug</label>
            <Input value={slug} readOnly />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-sm">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 rounded border dark:bg-gray-700"
            >
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
            </select>
          </div>

          {/* OVERVIEW */}
          <div>
            <label className="text-sm">Overview</label>
            <Textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              required
            />
          </div>

          {/* ICON */}
          <div>
            <label className="text-sm">Ikon</label>
            <Input type="file" accept="image/*" onChange={handleFileChange} />

            {/* Preview lama */}
            {existingIcon && !iconFile && (
              <img
                src={
                  existingIcon.startsWith("http")
                    ? existingIcon
                    : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${existingIcon}`
                }
                className="w-16 mt-2"
              />
            )}

            {/* Preview baru */}
            {iconFile && (
              <img
                src={URL.createObjectURL(iconFile)}
                className="w-16 mt-2"
              />
            )}
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Simpan
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
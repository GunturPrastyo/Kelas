"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, X } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modulId: string;
  onSuccess: (data: any) => void;
}

export default function TopicFormModal({
  isOpen,
  onClose,
  modulId,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form saat buka modal
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setSlug("");
    }
  }, [isOpen]);

  // 🔥 Auto generate slug
  useEffect(() => {
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    setSlug(generatedSlug);
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/topik`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug, modulId }),
        }
      );

      if (!res.ok) throw new Error("Gagal menambahkan topik");

      const data = await res.json();

      onSuccess(data);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Gagal menambahkan topik");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">

        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Tambah Topik</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="text-sm">Judul Topik</label>
            <Input className="mt-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm mb-4">Slug</label>
            <Input className="mt-2" value={slug} readOnly />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
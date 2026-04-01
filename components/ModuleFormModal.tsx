"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X, UploadCloud } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

interface Module {
    _id?: string; // Optional for new modules
    title: string;
    category: string;
    overview: string;
    icon?: string; // URL of the icon
    order?: number;
}

interface ModuleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Module | null; // Data for editing existing module
    onSubmit: (data: FormData, isEditing: boolean, moduleId?: string) => Promise<void>;
}

export default function ModuleFormModal({ isOpen, onClose, initialData, onSubmit }: ModuleFormModalProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [category, setCategory] = useState(initialData?.category || "mudah");
    const [overview, setOverview] = useState(initialData?.overview || "");
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [existingIcon, setExistingIcon] = useState(initialData?.icon || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialData?.title || "");
            setCategory(initialData?.category || "mudah");
            setOverview(initialData?.overview || "");
            setExistingIcon(initialData?.icon || "");
            setIconFile(null); // Reset file input
        }
    }, [isOpen, initialData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIconFile(e.target.files[0]);
            setExistingIcon(""); // Clear existing icon if new file is selected
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("category", category);
        formData.append("overview", overview);
        if (iconFile) {
            formData.append("icon", iconFile);
        } else if (existingIcon) {
            // If no new file but there was an existing icon, keep it
            formData.append("iconUrl", existingIcon);
        }

        try {
            await onSubmit(formData, !!initialData?._id, initialData?._id);
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
        <div className="fixed inset-0 bg-transparent bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {initialData?._id ? "Edit Modul" : "Tambah Modul Baru"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Modul</label>
                        <Input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Judul Modul"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            required
                        >
                            <option value="mudah">Mudah</option>
                            <option value="sedang">Sedang</option>
                            <option value="sulit">Sulit</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="overview" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Overview</label>
                        <Textarea
                            id="overview"
                            value={overview}
                            onChange={(e) => setOverview(e.target.value)}
                            placeholder="Ringkasan singkat modul"
                            rows={3}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ikon Modul</label>
                        <Input
                            id="icon"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                        />
                        {existingIcon && !iconFile && (
                            <div className="mt-2 flex items-center gap-2">
                                <img src={existingIcon.startsWith('http') ? existingIcon : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${existingIcon}`} alt="Current Icon" className="w-16 h-16 object-contain rounded-md border dark:border-gray-700 p-1" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">Ikon saat ini</span>
                            </div>
                        )}
                        {iconFile && (
                            <div className="mt-2 flex items-center gap-2">
                                <img src={URL.createObjectURL(iconFile)} alt="New Icon Preview" className="w-16 h-16 object-contain rounded-md border dark:border-gray-700 p-1" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">Pratinjau ikon baru</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                            {initialData?._id ? "Simpan Perubahan" : "Tambah Modul"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
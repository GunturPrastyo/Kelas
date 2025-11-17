"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Trash2, X, Edit3, PlusCircle } from "lucide-react";

export interface Feature {
    _id: string;
    name: string;
}

interface FeatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    features: Feature[];
    loading: boolean;
    onAdd: (name: string) => Promise<void>;
    onUpdate: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function FeatureModal({ isOpen, onClose, features, loading, onAdd, onUpdate, onDelete }: FeatureModalProps) {
    const [newFeatureName, setNewFeatureName] = useState("");
    const [editingFeature, setEditingFeature] = useState<{ id: string; name: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (!newFeatureName.trim()) return;
        setIsSubmitting(true);
        await onAdd(newFeatureName);
        setNewFeatureName("");
        setIsSubmitting(false);
    };

    const handleUpdate = async () => {
        if (!editingFeature || !editingFeature.name.trim()) return;
        setIsSubmitting(true);
        await onUpdate(editingFeature.id, editingFeature.name);
        setEditingFeature(null);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Kelola Indikator/Fitur</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Form Tambah Fitur */}
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Nama Indikator Baru..."
                            value={newFeatureName}
                            onChange={(e) => setNewFeatureName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd} disabled={isSubmitting || !newFeatureName.trim()}>
                            {isSubmitting && newFeatureName ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
                        </Button>
                    </div>

                    {/* Daftar Fitur */}
                    <div className="space-y-2">
                        {loading ? (
                            <div className="text-center text-gray-500">Memuat fitur...</div>
                        ) : features.length > 0 ? (
                            features.map((feature) => (
                                <div key={feature._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    {editingFeature?.id === feature._id ? (
                                        <Input
                                            type="text"
                                            value={editingFeature.name}
                                            onChange={(e) => setEditingFeature({ ...editingFeature, name: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                            autoFocus
                                            className="flex-grow"
                                        />
                                    ) : (
                                        <span className="flex-grow">{feature.name}</span>
                                    )}
                                    <div className="flex gap-1 ml-2">
                                        {editingFeature?.id === feature._id ? (
                                            <Button size="sm" variant="ghost" onClick={handleUpdate} disabled={isSubmitting} className="h-8 w-8 p-0">
                                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="text-green-600" />}
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => setEditingFeature({ id: feature._id, name: feature.name })} className="h-8 w-8 p-0">
                                                <Edit3 size={18} className="text-blue-600" />
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={async () => {
                                            if (confirm(`Yakin ingin menghapus fitur "${feature.name}"?`)) {
                                                setIsSubmitting(true);
                                                await onDelete(feature._id);
                                                setIsSubmitting(false);
                                            }
                                        }} disabled={isSubmitting}>
                                            <Trash2 size={18} className="text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">Belum ada fitur yang ditambahkan.</div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t dark:border-gray-700 text-right">
                    <Button variant="outline" onClick={onClose}>Tutup</Button>
                </div>
            </div>
        </div>
    );
}
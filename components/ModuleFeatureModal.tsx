"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { Feature } from "./featureModal"; // Impor tipe Feature

interface ModuleFeatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    modulId: string;
    modulTitle: string;
}

export default function ModuleFeatureModal({ isOpen, onClose, modulId, modulTitle }: ModuleFeatureModalProps) {
    const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!modulId) return;
        setLoading(true);
        try {
            const [allFeaturesRes, moduleFeaturesRes] = await Promise.all([
                authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/features`),
                authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${modulId}/features`),
            ]);

            if (allFeaturesRes.ok) {
                const allFeaturesData = await allFeaturesRes.json();
                setAvailableFeatures(allFeaturesData);
            }

            if (moduleFeaturesRes.ok) {
                const moduleFeaturesData: string[] = await moduleFeaturesRes.json();
                setSelectedFeatures(new Set(moduleFeaturesData));
            }
        } catch (error) {
            console.error("Gagal memuat data fitur:", error);
        } finally {
            setLoading(false);
        }
    }, [modulId]);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, fetchData]);

    const handleToggleFeature = (featureId: string) => {
        const newSelection = new Set(selectedFeatures);
        if (newSelection.has(featureId)) {
            newSelection.delete(featureId);
        } else {
            newSelection.add(featureId);
        }
        setSelectedFeatures(newSelection);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${modulId}/features`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureIds: Array.from(selectedFeatures) }),
            });
            onClose();
        } catch (error) {
            console.error("Gagal menyimpan fitur modul:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold truncate">Atur Kompetensi untuk: {modulTitle}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-3">
                    {loading ? <div className="text-center"><Loader2 className="animate-spin inline-block" /></div> :
                        availableFeatures.map(feature => (
                            <label key={feature._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                                <input
                                    type="checkbox"
                                    checked={selectedFeatures.has(feature._id)}
                                    onChange={() => handleToggleFeature(feature._id)}
                                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span>{feature.name} <span className={`text-xs px-2 py-0.5 rounded-full ${feature.group === 'Dasar' ? 'bg-green-200 text-green-800' : feature.group === 'Menengah' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>{feature.group}</span></span>
                            </label>
                        ))
                    }
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Simpan</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
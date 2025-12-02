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

interface FeatureWeight {
    featureId: string;
    weight: number;
}

export default function ModuleFeatureModal({ isOpen, onClose, modulId, modulTitle }: ModuleFeatureModalProps) {
    const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
    const [featureWeights, setFeatureWeights] = useState<FeatureWeight[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!modulId) return;
        setLoading(true);
        try {
            const [allFeaturesRes, moduleFeaturesRes] = await Promise.all([
                authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/features`), // Mengambil semua fitur global
                authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${modulId}/feature-weights`), // Mengambil bobot fitur untuk modul ini
            ]);

            let allFeaturesData: Feature[] = [];
            if (allFeaturesRes.ok) {
                allFeaturesData = await allFeaturesRes.json();
                setAvailableFeatures(allFeaturesData);
            }

            let moduleWeightsMap = new Map<string, number>();
            if (moduleFeaturesRes.ok) {
                const moduleWeightsData: FeatureWeight[] = await moduleFeaturesRes.json();
                moduleWeightsMap = new Map(moduleWeightsData.map(fw => [fw.featureId, fw.weight]));
            }

            // Sinkronkan: buat daftar bobot berdasarkan semua fitur yang tersedia
            const syncedWeights = allFeaturesData.map(feature => ({
                featureId: feature._id,
                weight: moduleWeightsMap.get(feature._id) ?? 0, // Gunakan bobot yang ada atau default 0
            }));
            setFeatureWeights(syncedWeights);
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

    const handleWeightChange = (featureId: string, weight: number) => {
        setFeatureWeights(currentWeights =>
            currentWeights.map(fw =>
                fw.featureId === featureId ? { ...fw, weight: isNaN(weight) ? 0 : weight } : fw
            )
        );
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/${modulId}/feature-weights`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weights: featureWeights }),
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
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-lg font-semibold truncate">Atur Bobot Kompetensi: {modulTitle}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-3">
                    {loading ? <div className="text-center"><Loader2 className="animate-spin inline-block" /></div> :
                        featureWeights.map(fw => {
                            const feature = availableFeatures.find(f => f._id === fw.featureId);
                            if (!feature) return null;
                            return (
                                <div key={feature._id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <label htmlFor={`weight-${feature._id}`} className="flex-grow text-sm font-normal">
                                        {feature.name} <span className={`text-xs px-2 py-0.5 rounded-full ${feature.group === 'Dasar' ? 'bg-green-200 text-green-800' : feature.group === 'Menengah' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>{feature.group}</span>
                                    </label>
                                    <select
                                        id={`weight-${feature._id}`}
                                        value={fw.weight}
                                        onChange={(e) => handleWeightChange(feature._id, parseFloat(e.target.value))}
                                        className="w-24 h-8 text-xs text-center bg-white border border-gray-300 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500 block dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                    >
                                        {[...Array(11)].map((_, i) => <option key={i} value={i / 10}>{(i / 10).toFixed(1)}</option>)}
                                    </select>
                                </div>
                            );
                        })
                    }
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Simpan</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
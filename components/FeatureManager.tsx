"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import FeatureModal, { Feature } from "@/components/featureModal";
import { authFetch } from "@/lib/authFetch";
import { Settings } from "lucide-react";

interface FeatureManagerProps {
    onFeaturesUpdate: (features: Feature[]) => void;
}

export default function FeatureManager({ onFeaturesUpdate }: FeatureManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFeatures = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/features`);
            if (res.ok) {
                const data = await res.json();
                setFeatures(data);
                onFeaturesUpdate(data);
            }
        } catch (error) {
            console.error("Gagal memuat fitur:", error);
        } finally {
            setLoading(false);
        }
    }, [onFeaturesUpdate]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        fetchFeatures();
    };

    const handleAddFeature = async (name: string, group: Feature['group']) => {
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/features`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, group }),
            });
            await fetchFeatures(); // Re-fetch
        } catch (error) {
            console.error("Gagal menambah fitur:", error);
        }
    };

    const handleUpdateFeature = async (id: string, name: string, group: Feature['group']) => {
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/features/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, group }),
            });
            await fetchFeatures(); // Re-fetch
        } catch (error) {
            console.error("Gagal memperbarui fitur:", error);
        }
    };

    const handleDeleteFeature = async (id: string) => {
        try {
            await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/features/${id}`, {
                method: 'DELETE',
            });
            await fetchFeatures(); // Re-fetch
        } catch (error) {
            console.error("Gagal menghapus fitur:", error);
        }
    };

    return (
        <>
            <Button variant="outline" onClick={handleOpenModal} className="flex items-center gap-2">
                <Settings size={16} />
                Kelola Indikator
            </Button>
            <FeatureModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                features={features}
                loading={loading}
                onAdd={handleAddFeature}
                onUpdate={handleUpdateFeature}
                onDelete={handleDeleteFeature}
            />
        </>
    );
}
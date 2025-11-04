"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { authFetch } from '@/lib/authFetch';

interface Topik {
    _id: string;
    title: string;
    order: number;
}

interface TopikOrderProps {
    modulId: string;
}

const TopikOrder = ({ modulId }: TopikOrderProps) => {
    const [topiks, setTopiks] = useState<Topik[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!modulId) return;

        const fetchTopiks = async () => {
            setLoading(true);
            try {
                const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/modul/${modulId}`);
                if (response.ok) {
                    const data = await response.json();
                    setTopiks(data);
                } else {
                    console.error("Gagal mengambil data topik:", response.status);
                }
            } catch (error) {
                console.error("Terjadi kesalahan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopiks();
    }, [modulId]);

    const handleOnDragEnd = async (result: any) => {
        if (!result.destination) return;

        const items = Array.from(topiks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistic update
        setTopiks(items);

        // Prepare the ordered IDs to send to the backend
        const orderedIds = items.map((topik) => topik._id);

        try {
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topik/update-order`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderedIds }),
            });

            if (!response.ok) {
                console.error("Gagal memperbarui urutan topik:", response.status);
                // Revert optimistic update on error (optional)
                // You might want to refetch the moduls here to ensure data consistency
            }
        } catch (error) {
            console.error("Terjadi kesalahan saat memperbarui urutan:", error);
            // Revert optimistic update on error (optional)
            // You might want to refetch the moduls here to ensure data consistency
        }
    };

    if (loading) {
        return <div>Memuat data...</div>;
    }

    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="topiks">
                {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {topiks.map((topik, index) => (
                            <Draggable key={topik._id} draggableId={topik._id} index={index}>
                                {(provided) => (
                                    <li
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-white p-4 rounded-md shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 cursor-move"
                                    >
                                        {topik.title}
                                    </li>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default TopikOrder;
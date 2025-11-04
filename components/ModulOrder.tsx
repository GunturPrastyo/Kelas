"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { authFetch } from '@/lib/authFetch';

interface Modul {
    _id: string;
    title: string;
    order: number;
}

const ModulOrder = () => {
    const [moduls, setModuls] = useState<Modul[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModuls = async () => {
            setLoading(true);
            try {
                const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul`);
                if (response.ok) {
                    const data = await response.json();
                    setModuls(data);
                } else {
                    console.error("Gagal mengambil data modul:", response.status);
                }
            } catch (error) {
                console.error("Terjadi kesalahan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchModuls();
    }, []);

    const handleOnDragEnd = async (result: any) => {
        if (!result.destination) return;

        const items = Array.from(moduls);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistic update
        setModuls(items);

        // Prepare the ordered IDs to send to the backend
        const orderedIds = items.map((modul) => modul._id);

        try {
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/update-order`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderedIds }),
            });

            if (!response.ok) {
                console.error("Gagal memperbarui urutan modul:", response.status);
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
            <Droppable droppableId="moduls">
                {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {moduls.map((modul, index) => (
                            <Draggable key={modul._id} draggableId={modul._id} index={index}>
                                {(provided) => (
                                    <li
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-white p-4 rounded-md shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 cursor-move"
                                    >
                                        {modul.title}
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

export default ModulOrder;
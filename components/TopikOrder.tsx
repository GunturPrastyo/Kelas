"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
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
        return (
            <div className="space-y-3 w-full">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-14 animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (topiks.length === 0) {
        return (
            <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg w-full">
                <p className="text-gray-500 dark:text-gray-400">Belum ada topik di modul ini.</p>
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="topiks">
                {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 w-full max-w-full">
                        {topiks.map((topik, index) => (
                            <Draggable key={topik._id} draggableId={topik._id} index={index}>
                                {(provided, snapshot) => (
                                    <li
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`
                                            flex items-center p-3 rounded-lg transition-all duration-200 border
                                            ${snapshot.isDragging 
                                                ? 'bg-blue-100 dark:bg-blue-900/50 shadow-lg ring-2 ring-blue-500 border-transparent' 
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }
                                        `}
                                    >
                                        <span className="text-gray-400 dark:text-gray-500 font-mono text-sm w-6 text-center">{index + 1}.</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200 flex-grow ml-2">{topik.title}</span>
                                        <div className="text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing">
                                            <GripVertical size={20} />
                                        </div>
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
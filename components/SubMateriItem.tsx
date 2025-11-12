"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { GripVertical, Trash2 } from "lucide-react";

const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), {
  ssr: false,
});

interface SubMateri {
  _id?: string;
  title: string;
  content: string;
}

interface SubMateriItemProps {
  index: number;
  subMateri: SubMateri;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onChange: (index: number, field: "title" | "content", value: string) => void;
  onRemove: (index: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const ItemType = "SUB_MATERI"; // Tipe item untuk drag and drop

const SubMateriItem: React.FC<SubMateriItemProps> = ({
  index,
  subMateri,
  onMove,
  onChange,
  onRemove,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem>({
    accept: ItemType,
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType,
    item: () => ({ id: subMateri._id || index, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  preview(drop(ref)); // Gabungkan ref untuk drag, drop, dan preview

  return (
    <div ref={ref} style={{ opacity }} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border p-5 relative">
      <div ref={drag} className="absolute top-5 left-2 cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Geser untuk mengurutkan">
        <GripVertical size={20} />
      </div>
      <button
        onClick={() => onRemove(index)}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
        title="Hapus bagian ini"
      >
        <Trash2 size={18} />
      </button>

      <div className="pl-8">
        <input
          type="text"
          placeholder="Judul Bagian Materi"
          value={subMateri.title}
          onChange={(e) => onChange(index, "title", e.target.value)}
          className="w-full text-lg font-bold bg-transparent border-none focus:ring-0 p-0 mb-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <TiptapEditor
          content={subMateri.content}
          onChange={(newContent) => onChange(index, "content", newContent)}
          placeholder="Mulai menulis materi di sini..."
        />
      </div>
    </div>
  );
};

export default SubMateriItem;
"use client";

import { Editor } from "@tiptap/react";
import { useCallback, useRef } from "react";
import {
    Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, List, ListOrdered, Quote,
    Code, SquareCode, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Highlighter,
    Subscript as SubIcon, Superscript as SuperIcon, Minus, Plus,
} from "lucide-react";

const ToolButton = ({
    onClick,
    isActive,
    icon: Icon,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    icon: any;
    title: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded-md transition-colors ${isActive
            ? "bg-blue-100 text-gray-900 dark:bg-gray-700 dark:text-white"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
    >
        <Icon size={16} />
    </button>
);

export const TiptapMenuBar = ({ editor }: { editor: Editor | null }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setLink = useCallback(() => {
        if (!editor) return;
        const url = window.prompt("Masukkan URL:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
    }, [editor]);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!editor) return;
            const file = e.target.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("image", file);

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`, {
                    method: "POST",
                    // Tidak perlu header Authorization, cookie akan dikirim otomatis
                    credentials: 'include', // Penting: untuk mengirim cookie ke backend
                    body: formData
                });

                if (!res.ok) throw new Error("Gagal mengunggah gambar.");

                const data = await res.json();
                // Backend mengirimkan { imageUrl: '...' }, jadi kita ambil dari sana
                const fullImageUrl = `${process.env.NEXT_PUBLIC_API_URL}${data.imageUrl}`;
                editor.chain().focus().setImage({ src: fullImageUrl }).run();
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Gagal mengunggah gambar. Periksa konsol untuk detail.");
            }
        },
        [editor]
    );

    if (!editor) return (
        <div className="flex items-center flex-wrap gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm min-h-[40px] opacity-50">
            <span className="text-sm text-gray-400">Pilih area teks untuk mengedit...</span>
        </div>
    );

    return (
        <div className="flex items-center flex-wrap gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <select
                className="bg-transparent text-sm px-2 py-1 border-none outline-none rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                onChange={(e) => editor.chain().focus().toggleHeading({ level: Number(e.target.value) as any }).run()}
                value={editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : '0'}
            >
                <option value="0">P</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
            </select>

            <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} icon={Bold} title="Bold" />
            <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} icon={Italic} title="Italic" />
            <ToolButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} icon={Highlighter} title="Highlight" />
            <ToolButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive("subscript")} icon={SubIcon} title="Subscript" />
            <ToolButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive("superscript")} icon={SuperIcon} title="Superscript" />
            <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} icon={Quote} title="Blockquote" />

            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

            <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} icon={List} title="Bullet List" />
            <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} icon={ListOrdered} title="Ordered List" />

            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

            <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} icon={Code} title="Inline Code" />
            <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} icon={SquareCode} title="Code Block" />

            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

            <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} icon={AlignLeft} title="Align Left" />
            <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} icon={AlignCenter} title="Align Center" />
            <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} icon={AlignRight} title="Align Right" />

            <div className="flex-1" />

            <ToolButton onClick={setLink} icon={LinkIcon} title="Add Link" />
            <ToolButton onClick={() => fileInputRef.current?.click()} icon={ImageIcon} title="Add Image" />
            <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} title="Horizontal Rule" />

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
    );
};
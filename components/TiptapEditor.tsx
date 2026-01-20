"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { Node as TiptapNode } from '@tiptap/core';
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";

import { Color } from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  SquareCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  X,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  Minus,
  Captions,
} from "lucide-react"; 
import { useCallback, useRef, useState, useEffect } from "react"; 
import { authFetch } from "@/lib/authFetch";

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
    onMouseDown={(e) => e.preventDefault()}
    title={title}
    className={`p-2 rounded-md transition-colors ${isActive
      ? "bg-purple-100 text-gray-700 dark:bg-gray-600 dark:text-white"
      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
  >
    <Icon size={18} />
  </button>
);

// Ekstensi kustom untuk menambahkan atribut 'style' ke node
const StyleAttribute = TiptapNode.create({
  name: 'styleAttribute',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'listItem'], // Terapkan pada paragraf dan item list
        attributes: {
          style: {
            default: null,
            parseHTML: element => element.getAttribute('style'),
            renderHTML: attributes => {
              if (!attributes.style) {
                return {};
              }
              return { style: attributes.style };
            },
          },
        },
      },
    ];
  },
});

// Ekstensi Image kustom dengan dukungan resize (width)
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            width: attributes.width,
            style: `width: ${attributes.width}; height: auto;`,
          };
        },
        parseHTML: (element) => element.getAttribute('width') || element.style.width,
      },
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-caption'),
        renderHTML: (attributes) => {
          if (!attributes.caption) return {};
          return {
            'data-caption': attributes.caption,
          };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { style, 'data-caption': caption, ...rest } = HTMLAttributes;
    if (caption) {
      return [
        'figure',
        { style: 'display: block; margin: 1rem 0; text-align: center;' },
        ['img', { style, ...rest }],
        ['figcaption', { style: 'margin-top: 0.5rem; color: #6b7280; font-size: 0.875rem; font-style: italic;' }, caption]
      ];
    }
    return ['img', { style, ...rest }];
  },
  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          const img = node.querySelector('img');
          if (!img) return false;
          const figcaption = node.querySelector('figcaption');
          return {
            src: img.getAttribute('src'),
            width: img.getAttribute('width') || img.style.width,
            caption: figcaption?.innerText || img.getAttribute('data-caption')
          };
        }
      },
      {
        tag: 'img',
      },
    ];
  }
});

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paksa re-render komponen MenuBar saat state editor berubah (selection, content, dll)
  // Ini penting agar tombol aktif/tidak aktif dan menu kontekstual (seperti resize gambar) muncul seketika
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => forceUpdate({});
    editor.on('transaction', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    return () => {
      editor.off('transaction', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  const setLink = useCallback(() => {
    const url = window.prompt("Masukkan URL:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Siapkan form data untuk dikirim ke server
      const formData = new FormData();
      formData.append("image", file);

      try {
        // Kirim ke backend upload route kamu
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`, {
          method: "POST",
          body: formData, // Untuk FormData, jangan set 'Content-Type' secara manual
        });

        if (!res.ok) {
          alert("Gagal mengunggah gambar.");
          return;
        }

        const data = await res.json();
        // Backend mengirimkan { imageUrl: '...' }, jadi kita ambil dari sana
        const imageUrl = data.imageUrl; 

        // Prompt untuk keterangan gambar
        const caption = window.prompt("Masukkan keterangan gambar (opsional):");

        // URL dari backend adalah path relatif, kita perlu menggabungkannya dengan base URL API
        const fullImageUrl = `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
        editor?.chain().focus().setImage({ src: fullImageUrl, caption } as any).run();
      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan saat mengunggah gambar.");
      } finally {
        // Reset input file supaya bisa upload file yang sama lagi jika mau
        e.target.value = "";
      }
    },
    [editor]
  );



  if (!editor) return null;

  return (
    <div className="flex items-center flex-wrap gap-1 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm">
      {/* Heading */}
      <select
        className="bg-transparent text-sm px-2 py-1 border-none outline-none rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        onChange={(e) => {
          const value = Number(e.target.value);
          if (value === 0) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: value as 1 | 2 | 3 }).run();
          }
        }}
      >
        <option value="0">P</option>
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
      </select>

      {/* Basic tools */}
      <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} icon={Bold} title="Bold" />
      <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} icon={Italic} title="Italic" />
      <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} icon={UnderlineIcon} title="Underline" />
      <ToolButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} icon={Highlighter} title="Highlight" />
      <ToolButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive("subscript")} icon={SubIcon} title="Subscript" />
      <ToolButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive("superscript")} icon={SuperIcon} title="Superscript" />
      <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} icon={Quote} title="Blockquote" />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* List tools */}
      <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} icon={List} title="Bullet List" />
      <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} icon={ListOrdered} title="Ordered List" />

      {/* Code tools */}
      <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} icon={Code} title="Inline Code" />
      <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} icon={SquareCode} title="Code Block" />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Align tools */}
      <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} icon={AlignLeft} title="Align Left" />
      <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} icon={AlignCenter} title="Align Center" />
      <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} icon={AlignRight} title="Align Right" />
      <ToolButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} icon={AlignJustify} title="Align Justify" />

      {/* Image Resize Controls (Contextual) */}
      {editor.isActive('image') && (
        <>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          {['25%', '50%', '75%', '100%'].map((size) => (
            <button
              key={size}
              onClick={() => editor.chain().focus().updateAttributes('image', { width: size }).run()}
              className={`text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.getAttributes('image').width === size
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-300'
                }`}
            >
              {size}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <ToolButton
            onClick={() => {
              const currentCaption = editor.getAttributes('image').caption;
              const newCaption = window.prompt("Ubah keterangan gambar:", currentCaption || "");
              if (newCaption !== null) {
                editor.chain().focus().updateAttributes('image', { caption: newCaption }).run();
              }
            }}
            isActive={!!editor.getAttributes('image').caption}
            icon={Captions}
            title="Edit Keterangan"
          />
        </>
      )}

      <div className="flex-1" />

      {/* Extra tools */}
      <ToolButton onClick={setLink} icon={LinkIcon} title="Add Link" />
      <ToolButton onClick={() => fileInputRef.current?.click()} icon={ImageIcon} title="Add Image" />
      <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} title="Horizontal Rule" />

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
};

export default function TiptapEditor({
  content,
  onChange,
  placeholder,
  onBlur,
}: {
  content: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onBlur?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: { class: 'list-disc pl-5' },
        },
        orderedList: {
          HTMLAttributes: { class: 'list-decimal pl-5' },
        },
        codeBlock: {},
        blockquote: {}, // Aktifkan blockquote
        horizontalRule: false,
      }),
      Highlight,
      TextStyle,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      HorizontalRule,
      Color,
      ResizableImage, // Gunakan ResizableImage menggantikan Image standar
      StyleAttribute, // Tambahkan ekstensi kustom di sini
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onBlur: ({ event }) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (containerRef.current && relatedTarget && containerRef.current.contains(relatedTarget)) {
        return;
      }
      if (onBlur) onBlur();
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none min-h-[200px] px-4 py-3 mt-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none [&_pre]:bg-gray-900",
      },
    },
    immediatelyRender: false,
  });

  return (
    <div className="space-y-2 my-4" ref={containerRef}>
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose dark:prose-invert max-w-none [&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-600 [&_pre]:text-sm [&_pre]:p-3 [&_pre]:rounded-md [&_code]:font-mono [&_code]:text-gray-600 dark:[&_code]:text-white"
      />
    </div>
  );
}

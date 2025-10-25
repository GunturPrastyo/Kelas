"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { Node } from '@tiptap/core';
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
  Image as ImageIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  X,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  Minus,
  ArrowUpFromLine,
  ArrowDownFromLine,
} from "lucide-react";
import { useCallback, useRef } from "react";

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
    className={`p-2 rounded-md transition-colors ${isActive
      ? "bg-purple-100 text-gray-700 dark:bg-gray-600 dark:text-white"
      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
  >
    <Icon size={18} />
  </button>
);

// Ekstensi kustom untuk menambahkan atribut 'style' ke node
const StyleAttribute = Node.create({
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

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setLink = useCallback(() => {
    const url = window.prompt("Masukkan URL:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const adjustMargin = useCallback((increment: number) => {
    if (!editor) return;

    const { state, dispatch } = editor.view;
    const { from, to } = state.selection;

    let transaction = state.tr;
    const nodesToUpdate: { node: any, pos: number, newMargin: number }[] = [];

    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'listItem') {
        // Hindari duplikasi jika node sudah ada di list
        if (nodesToUpdate.some(item => item.pos === pos)) return;

        const currentStyle = node.attrs.style || '';
        const marginMatch = currentStyle.match(/margin-top:\s*([0-9.]+)rem/);
        let currentMargin = 0;
        if (marginMatch) {
          currentMargin = parseFloat(marginMatch[1]);
        } else {
          // Jika tidak ada style, ambil dari class prose-p:my-2 (0.5rem) atau prose-li:my-2 (0.5rem)
          currentMargin = 0.5; 
        }

        const newMargin = Math.max(0, currentMargin + increment);
        const newStyle = `marginTop: ${newMargin}rem; marginBottom: ${newMargin}rem;`;
        
        transaction = transaction.setNodeMarkup(pos, undefined, { ...node.attrs, style: newStyle });
      }
    });

    dispatch(transaction);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`, {
          method: "POST",
          // Tidak perlu header Authorization, cookie akan dikirim otomatis
          credentials: 'include', // Penting: untuk mengirim cookie ke backend
          body: formData,
        });

        if (!res.ok) {
          alert("Gagal mengunggah gambar.");
          return;
        }

        const data = await res.json();
        // Backend mengirimkan { imageUrl: '...' }, jadi kita ambil dari sana
        const imageUrl = data.imageUrl; 

        // Masukkan URL hasil upload ke editor Tiptap
        // URL dari backend adalah path relatif, kita perlu menggabungkannya dengan base URL API
        const fullImageUrl = `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
        editor?.chain().focus().setImage({ src: fullImageUrl }).run();
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
        onChange={(e) =>
          editor.chain().focus().toggleHeading({ level: Number(e.target.value) }).run()
        }
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

      <div className="flex-1" />

      {/* Extra tools */}
      <ToolButton onClick={() => adjustMargin(0.25)} icon={ArrowUpFromLine} title="Increase Spacing" />
      <ToolButton onClick={() => adjustMargin(-0.25)} icon={ArrowDownFromLine} title="Decrease Spacing" />
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
}: {
  content: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: { class: 'list-disc pl-5' },
        },
        orderedList: {
          HTMLAttributes: { class: 'list-decimal pl-5' },
        },
        codeBlock: true,
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
      Image,
      StyleAttribute, // Tambahkan ekstensi kustom di sini
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none min-h-[200px] px-4 py-3 mt-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  return (
    <div className="space-y-2 my-4">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose dark:prose-invert max-w-none [&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-600 [&_pre]:text-sm [&_pre]:p-3 [&_pre]:rounded-md [&_code]:font-mono [&_code]:text-gray-600 dark:[&_code]:text-white"
      />
    </div>
  );
}

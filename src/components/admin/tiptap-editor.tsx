"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ value, onChange, placeholder = "Bắt đầu viết..." }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[300px] rounded-md border border-input bg-background p-4 focus:outline-none focus:ring-2 focus:ring-ring",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("URL liên kết:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("URL ảnh:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive("code") },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { icon: LinkIcon, action: addLink, active: editor.isActive("link") },
    { icon: ImageIcon, action: addImage, active: false },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false },
  ];

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1 rounded-md border bg-neutral-50 p-1">
        {tools.map((t, i) => {
          const Icon = t.icon;
          return (
            <Button
              key={i}
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", t.active && "bg-neutral-200")}
              onClick={t.action}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

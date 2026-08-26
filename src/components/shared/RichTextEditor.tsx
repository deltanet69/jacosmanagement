"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Link as LinkIcon,
  Minus,
  Undo,
  Redo,
  RemoveFormatting,
  Palette,
  Highlighter
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis detail informasi / kegiatan di sini...",
  minHeight = "300px"
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);
  const [activeFormats, setActiveFormats] = useState<{ [key: string]: boolean }>({});

  // Sync external value when not actively typing inside
  useEffect(() => {
    if (editorRef.current && !isInternalChangeRef.current) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const updateFormatState = useCallback(() => {
    if (typeof document === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull")
      });
    } catch {
      // ignore
    }
  }, []);

  const executeCommand = (command: string, valueArg: string | undefined = undefined) => {
    if (typeof document === "undefined" || !editorRef.current) return;

    // Ensure editor is focused
    editorRef.current.focus();

    // Execute standard command
    document.execCommand(command, false, valueArg);

    // Trigger update
    isInternalChangeRef.current = true;
    onChange(editorRef.current.innerHTML);
    isInternalChangeRef.current = false;

    updateFormatState();
  };

  const handleHeading = (tag: string) => {
    executeCommand("formatBlock", `<${tag}>`);
  };

  const handleLink = () => {
    const url = prompt("Masukkan URL tautan (link):", "https://");
    if (url && url.trim() !== "" && url !== "https://") {
      executeCommand("createLink", url.trim());
    }
  };

  const handleColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    executeCommand("foreColor", e.target.value);
  };

  const handleHighlight = (e: React.ChangeEvent<HTMLInputElement>) => {
    executeCommand("hiliteColor", e.target.value);
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChangeRef.current = true;
      onChange(editorRef.current.innerHTML);
      isInternalChangeRef.current = false;
    }
    updateFormatState();
  };

  return (
    <div className="w-full border border-ink/10 rounded-2xl bg-white overflow-hidden shadow-xs focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20 transition-all">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2.5 bg-cloud/70 border-b border-ink/10 select-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-ink/10">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("undo");
            }}
            className="p-2 rounded-xl text-ink-400 hover:text-ink hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("redo");
            }}
            className="p-2 rounded-xl text-ink-400 hover:text-ink hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 px-1.5 border-r border-ink/10">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleHeading("h2");
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-ink-500 hover:text-ink hover:bg-white hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            title="Judul Besar (Heading 1)"
          >
            <Heading1 size={15} /> H1
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleHeading("h3");
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-ink-500 hover:text-ink hover:bg-white hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            title="Sub Judul (Heading 2)"
          >
            <Heading2 size={15} /> H2
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleHeading("p");
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-ink-500 hover:text-ink hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Teks Paragraf Normal"
          >
            Normal
          </button>
        </div>

        {/* Text Style Formats */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-ink/10">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("bold");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.bold
                ? "bg-coral-50 text-coral font-bold shadow-xs ring-1 ring-coral/30"
                : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Tebal / Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("italic");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.italic
                ? "bg-coral-50 text-coral font-bold shadow-xs ring-1 ring-coral/30"
                : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Miring / Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("underline");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.underline
                ? "bg-coral-50 text-coral font-bold shadow-xs ring-1 ring-coral/30"
                : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Garis Bawah / Underline (Ctrl+U)"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("strikeThrough");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.strikeThrough
                ? "bg-coral-50 text-coral font-bold shadow-xs ring-1 ring-coral/30"
                : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Coretan / Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-ink/10">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("justifyLeft");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.justifyLeft ? "bg-coral-50 text-coral shadow-xs" : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Rata Kiri"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("justifyCenter");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.justifyCenter ? "bg-coral-50 text-coral shadow-xs" : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Rata Tengah"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("justifyRight");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.justifyRight ? "bg-coral-50 text-coral shadow-xs" : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Rata Kanan"
          >
            <AlignRight size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("justifyFull");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.justifyFull ? "bg-coral-50 text-coral shadow-xs" : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Rata Kanan-Kiri"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-ink/10">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("insertUnorderedList");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.insertUnorderedList
                ? "bg-coral-50 text-coral shadow-xs ring-1 ring-coral/30"
                : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Daftar Poin (Bullet List)"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("insertOrderedList");
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeFormats.insertOrderedList
                ? "bg-coral-50 text-coral shadow-xs ring-1 ring-coral/30"
                : "text-ink-400 hover:text-ink hover:bg-white"
            }`}
            title="Daftar Nomor (Numbered List)"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("formatBlock", "<blockquote>");
            }}
            className="p-2 rounded-xl text-ink-400 hover:text-ink hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Kutipan / Blockquote"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("insertHorizontalRule");
            }}
            className="p-2 rounded-xl text-ink-400 hover:text-ink hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Garis Pembatas (Divider)"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Colors & Links */}
        <div className="flex items-center gap-1.5 px-1.5 border-r border-ink/10">
          {/* Text Color */}
          <label
            className="p-2 rounded-xl text-ink-400 hover:text-ink hover:bg-white hover:shadow-xs transition-all cursor-pointer relative"
            title="Warna Teks"
          >
            <Palette size={16} />
            <input
              type="color"
              onChange={handleColor}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          {/* Highlight Color */}
          <label
            className="p-2 rounded-xl text-ink-400 hover:text-ink hover:bg-white hover:shadow-xs transition-all cursor-pointer relative"
            title="Warna Sorotan (Highlight)"
          >
            <Highlighter size={16} />
            <input
              type="color"
              defaultValue="#fff3cd"
              onChange={handleHighlight}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          {/* Link */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleLink();
            }}
            className="p-2 rounded-xl text-ink-400 hover:text-ink hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            title="Sisipkan Tautan (Link)"
          >
            <LinkIcon size={16} />
          </button>
        </div>

        {/* Clear Format */}
        <div className="flex items-center pl-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand("removeFormat");
            }}
            className="p-2 rounded-xl text-coral hover:bg-coral-50 hover:shadow-xs transition-all cursor-pointer"
            title="Hapus Semua Format"
          >
            <RemoveFormatting size={16} />
          </button>
        </div>
      </div>

      {/* Editable Content Area with Explicit Typography Styles */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateFormatState}
        onMouseUp={updateFormatState}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="p-6 text-ink text-base outline-none leading-relaxed min-h-[300px]
          empty:before:content-[attr(data-placeholder)] empty:before:text-ink-300 empty:before:pointer-events-none
          [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-ink [&_h2]:my-3 [&_h2]:leading-snug
          [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink [&_h3]:my-2.5 [&_h3]:leading-snug
          [&_p]:my-2 [&_p]:leading-relaxed
          [&_b]:font-bold [&_b]:text-ink [&_strong]:font-bold [&_strong]:text-ink
          [&_i]:italic [&_em]:italic
          [&_u]:underline [&_u]:decoration-coral/60 [&_u]:underline-offset-4
          [&_strike]:line-through [&_s]:line-through
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1
          [&_li]:leading-relaxed
          [&_blockquote]:border-l-4 [&_blockquote]:border-coral [&_blockquote]:bg-coral-50/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:rounded-r-2xl [&_blockquote]:text-ink-600
          [&_hr]:my-4 [&_hr]:border-ink/10
          [&_a]:text-sky [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2
        "
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Download,
  Check,
  Loader2,
  ArrowLeft,
  Pencil,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { DeliverableAudience, DeliverableFormat } from "@/lib/types";

interface DeliveryEditorProps {
  projectId: string;
  audience: DeliverableAudience;
  format: DeliverableFormat;
  deliverableId?: string | null;
  initialContent?: string;
  initialTitle?: string;
  onBack: () => void;
  onSaved?: (id: string) => void;
}

const FORMAT_LABELS: Record<DeliverableFormat, string> = {
  client_email: "Client Email",
  written_report: "Written Report",
  annotated_document: "Annotated Document",
  presentation_outline: "Presentation Outline",
  letter_of_advice: "Letter of Advice",
  negotiation_playbook: "Negotiation Playbook",
  risk_register: "Risk Register",
};

export default function DeliveryEditor({
  projectId,
  audience,
  format,
  deliverableId: initialDeliverableId,
  initialContent,
  initialTitle,
  onBack,
  onSaved,
}: DeliveryEditorProps) {
  const [title, setTitle] = useState(initialTitle || FORMAT_LABELS[format]);
  const [isGenerating, setIsGenerating] = useState(!initialContent);
  const [generatingContent, setGeneratingContent] = useState("");
  const [deliverableId, setDeliverableId] = useState<string | null>(initialDeliverableId || null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isEditing, setIsEditing] = useState(!!initialContent);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Tracks accumulated content during generation so we can recover on error
  const generatedContentRef = useRef("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Your document will appear here...",
      }),
    ],
    content: initialContent || "",
    editable: !!initialContent,
    editorProps: {
      attributes: {
        class: "deliverable-prose prose max-w-none outline-none min-h-[400px] px-8 py-6",
      },
    },
    onUpdate: ({ editor }) => {
      if (!isGenerating) {
        setSaveStatus("unsaved");
        debouncedSave(editor.getHTML());
      }
    },
  });

  // Ref to always access the current editor instance (avoids stale closures in effects)
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Auto-save debounce
  const debouncedSave = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveDeliverable(content);
      }, 2000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deliverableId, title]
  );

  const saveDeliverable = useCallback(
    async (content?: string) => {
      const htmlContent = content || editor?.getHTML() || "";
      setSaveStatus("saving");

      try {
        const session = (await supabase.auth.getSession()).data.session;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        };

        if (deliverableId) {
          await fetch(`/api/deliverables/${deliverableId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ title, content: htmlContent }),
          });
        } else {
          const res = await fetch("/api/deliverables", {
            method: "POST",
            headers,
            body: JSON.stringify({
              projectId,
              audience,
              format,
              title,
              content: htmlContent,
              aiGeneratedContent: htmlContent,
            }),
          });
          if (res.ok) {
            const { id } = await res.json();
            setDeliverableId(id);
            onSaved?.(id);
          }
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [deliverableId, title, editor, projectId, audience, format, onSaved]
  );

  // Helper: finish generation and load content into the editor
  // Uses editorRef to avoid stale closure over editor (which is null initially)
  const finishGeneration = useCallback(
    (content: string) => {
      const ed = editorRef.current;
      // Load content into Tiptap BEFORE switching views
      if (ed && content) {
        ed.commands.setContent(content);
        ed.setEditable(true);
      }
      setIsEditing(true);
      setIsGenerating(false);
      setGeneratingContent("");
    },
    []
  );

  // Generate document via streaming API
  useEffect(() => {
    if (initialContent || !isGenerating) return;

    const abortController = new AbortController();
    abortRef.current = abortController;
    generatedContentRef.current = "";

    const generate = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const response = await fetch("/api/deliverables/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ projectId, audience, format }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Generation failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                generatedContentRef.current += parsed.text;
                setGeneratingContent(generatedContentRef.current);
              } catch {
                // skip malformed chunks
              }
            }
          }
        }

        const fullContent = generatedContentRef.current;

        // Load into editor and switch to edit mode
        finishGeneration(fullContent);

        // Auto-save the generated content
        if (fullContent) {
          setSaveStatus("saving");
          try {
            const session2 = (await supabase.auth.getSession()).data.session;
            const res = await fetch("/api/deliverables", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session2?.access_token}`,
              },
              body: JSON.stringify({
                projectId,
                audience,
                format,
                title,
                content: fullContent,
                aiGeneratedContent: fullContent,
              }),
            });
            if (res.ok) {
              const { id } = await res.json();
              setDeliverableId(id);
              onSaved?.(id);
            }
            setSaveStatus("saved");
          } catch {
            setSaveStatus("unsaved");
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Generation error:", error);
          // Recover: load whatever was generated so far into the editor
          const partialContent = generatedContentRef.current;
          if (partialContent) {
            finishGeneration(partialContent);
          } else {
            setIsGenerating(false);
            setIsEditing(true);
            setGeneratingContent("");
          }
        }
      }
    };

    generate();

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Export as DOCX
  const handleExportDocx = useCallback(async () => {
    if (!editor) return;
    setIsExporting(true);
    try {
      const { asBlob } = await import("html-docx-js-typescript");
      const htmlContent = `
        <!DOCTYPE html>
        <html><head><meta charset="utf-8">
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #000; max-width: 700px; margin: 0 auto; }
          h1 { font-size: 18pt; font-weight: bold; margin-bottom: 12pt; border-bottom: 2px solid #1a1a2e; padding-bottom: 6pt; }
          h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; }
          h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
          p { margin-bottom: 6pt; }
          blockquote { border-left: 3px solid #666; padding-left: 12pt; margin: 8pt 0; color: #333; font-style: italic; }
          table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
          th, td { border: 1px solid #999; padding: 4pt 8pt; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          ul, ol { margin: 6pt 0; padding-left: 24pt; }
          li { margin-bottom: 3pt; }
          hr { border: none; border-top: 1px solid #ccc; margin: 12pt 0; }
        </style>
        </head><body>${editor.getHTML()}</body></html>
      `;
      const blob = await asBlob(htmlContent);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, "").trim()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  }, [editor, title]);

  // Export as HTML (printable PDF via browser)
  const handleExportPdf = useCallback(() => {
    if (!editor) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #000; max-width: 700px; margin: 40px auto; padding: 0 20px; }
        h1 { font-size: 18pt; font-weight: bold; margin-bottom: 12pt; border-bottom: 2px solid #1a1a2e; padding-bottom: 6pt; }
        h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; }
        h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
        p { margin-bottom: 6pt; }
        blockquote { border-left: 3px solid #666; padding-left: 12pt; margin: 8pt 0; color: #333; font-style: italic; }
        table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
        th, td { border: 1px solid #999; padding: 4pt 8pt; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        ul, ol { margin: 6pt 0; padding-left: 24pt; }
        li { margin-bottom: 3pt; }
        hr { border: none; border-top: 1px solid #ccc; margin: 12pt 0; }
        @media print { body { margin: 0; } }
      </style>
      </head><body>${editor.getHTML()}</body></html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }, [editor, title]);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExportMenu]);

  // Toolbar button helper
  const ToolbarButton = ({
    onClick,
    active,
    title: btnTitle,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "rounded p-1.5 transition-colors",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
      )}
      title={btnTitle}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
            title="Back to deliverables"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus("unsaved");
            }}
            onBlur={() => {
              if (deliverableId) saveDeliverable();
            }}
            className="text-sm font-semibold bg-transparent border-none outline-none truncate max-w-[300px] focus:ring-1 focus:ring-[var(--ring)] rounded px-1"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Save status */}
          <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
            {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
            {saveStatus === "saved" && <Check className="h-3 w-3 text-[var(--success)]" />}
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Unsaved"}
          </span>

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              disabled={isGenerating || isExporting}
              className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--accent)] disabled:opacity-40"
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                <button
                  onClick={() => { handleExportPdf(); setShowExportMenu(false); }}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--accent)] transition-colors"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => { handleExportDocx(); setShowExportMenu(false); }}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--accent)] transition-colors"
                >
                  Export as DOCX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar (always visible once generation is done so Edit/Preview toggle is reachable) */}
      {!isGenerating && editor && (
        <div className="flex items-center gap-0.5 border-b border-[var(--border)] bg-[var(--card)] px-4 py-1.5 flex-wrap">
          {isEditing && (
            <>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </ToolbarButton>

              <div className="w-px h-4 bg-[var(--border)] mx-1" />

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor.isActive("heading", { level: 1 })}
                title="Heading 1"
              >
                <Heading1 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive("heading", { level: 2 })}
                title="Heading 2"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive("heading", { level: 3 })}
                title="Heading 3"
              >
                <Heading3 className="h-3.5 w-3.5" />
              </ToolbarButton>

              <div className="w-px h-4 bg-[var(--border)] mx-1" />

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                title="Bullet List"
              >
                <List className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                title="Numbered List"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive("blockquote")}
                title="Blockquote"
              >
                <Quote className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal Rule"
              >
                <Minus className="h-3.5 w-3.5" />
              </ToolbarButton>

              <div className="w-px h-4 bg-[var(--border)] mx-1" />

              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                title="Undo"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                title="Redo"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </ToolbarButton>
            </>
          )}

          {!isEditing && (
            <span className="text-xs text-[var(--muted-foreground)] px-1">
              Preview mode
            </span>
          )}

          <div className="flex-1" />

          <button
            onClick={() => {
              const nextEditing = !isEditing;
              editor.setEditable(nextEditing);
              setIsEditing(nextEditing);
            }}
            className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            {isEditing ? <Eye className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {isEditing ? "Preview" : "Edit"}
          </button>
        </div>
      )}

      {/* Editor / Generation preview */}
      <div className="flex-1 overflow-auto bg-[var(--background)]">
        {isGenerating ? (
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating {FORMAT_LABELS[format].toLowerCase()}...
            </div>
            {generatingContent && (
              <div
                className="deliverable-prose prose max-w-none"
                dangerouslySetInnerHTML={{ __html: generatingContent }}
              />
            )}
            {!generatingContent && (
              <div className="space-y-3 animate-pulse">
                <div className="h-6 bg-[var(--accent)] rounded w-2/3" />
                <div className="h-4 bg-[var(--accent)] rounded w-full" />
                <div className="h-4 bg-[var(--accent)] rounded w-5/6" />
                <div className="h-4 bg-[var(--accent)] rounded w-4/6" />
                <div className="h-5 bg-[var(--accent)] rounded w-1/2 mt-6" />
                <div className="h-4 bg-[var(--accent)] rounded w-full" />
                <div className="h-4 bg-[var(--accent)] rounded w-3/4" />
              </div>
            )}
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  );
}

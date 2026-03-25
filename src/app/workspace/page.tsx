"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Upload,
  FileText,
  GripVertical,
  PanelRightOpen,
  PanelRightClose,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentContext, UserPosition } from "@/lib/types";
import ChatSidebar from "@/components/chat-sidebar";
import PositionSelector from "@/components/position-selector";

// Dynamic import for PDF viewer (needs browser APIs)
const DocumentViewer = dynamic(() => import("@/components/document-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
      Loading viewer...
    </div>
  ),
});

export default function WorkspacePage() {
  const [document, setDocument] = useState<DocumentContext | null>(null);
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedText, setSelectedText] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setError("");
      setIsUploading(true);

      try {
        // Parse the document server-side
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/parse", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to parse document");
        }

        const { text, htmlContent } = await response.json();

        // Create a local URL for the file viewer
        const fileUrl = URL.createObjectURL(file);
        const fileType = file.name.toLowerCase().endsWith(".pdf")
          ? "pdf"
          : "docx";

        setDocument({
          fileName: file.name,
          fileType: fileType as "pdf" | "docx",
          text,
          fileUrl,
          htmlContent,
        });

        // Show position selector after upload
        setShowPositionSelector(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  // Upload screen
  if (!document) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <div
          className="w-full max-w-lg"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center transition-colors hover:border-[var(--muted-foreground)]">
            <Upload className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
            <h2 className="mt-4 text-lg font-semibold">
              Open a legal document
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Drop a PDF or Word document here, or click to browse
            </p>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="mt-4 inline-block cursor-pointer rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
            >
              {isUploading ? "Processing..." : "Choose File"}
            </label>
            {error && (
              <p className="mt-3 text-sm text-[var(--destructive)]">{error}</p>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
            Supports PDF and DOCX files up to 10MB. Your document is processed
            locally and sent to AI for analysis only.
          </p>
        </div>
      </div>
    );
  }

  // Workspace with document + chat
  return (
    <>
      {showPositionSelector && (
        <PositionSelector
          onSelect={(pos) => {
            setPosition(pos);
            setShowPositionSelector(false);
          }}
          onSkip={() => setShowPositionSelector(false)}
        />
      )}

      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Document panel */}
        <div className={cn("flex-1 flex flex-col min-w-0", sidebarOpen ? "" : "")}>
          {/* Document toolbar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <span className="truncate text-sm font-medium">
                {document.fileName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPositionSelector(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                  position
                    ? "text-[var(--foreground)] hover:bg-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                )}
                title="Change your role"
              >
                <UserCheck className="h-3.5 w-3.5" />
                {position ? position.role : "Set role"}
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                title={sidebarOpen ? "Close assistant" : "Open assistant"}
              >
                {sidebarOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Document viewer */}
          <div className="flex-1 overflow-hidden">
            <DocumentViewer
              fileUrl={document.fileUrl}
              fileType={document.fileType}
              htmlContent={document.htmlContent}
              onTextSelect={handleTextSelect}
            />
          </div>
        </div>

        {/* Resizable divider */}
        {sidebarOpen && (
          <div className="flex w-1 cursor-col-resize items-center bg-[var(--border)] hover:bg-[var(--muted-foreground)]/30">
            <GripVertical className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
        )}

        {/* Chat sidebar */}
        {sidebarOpen && (
          <div className="w-[420px] shrink-0 border-l border-[var(--border)]">
            <ChatSidebar
              documentText={document.text}
              position={position}
              selectedText={selectedText}
              onClearSelection={() => setSelectedText(null)}
            />
          </div>
        )}
      </div>
    </>
  );
}

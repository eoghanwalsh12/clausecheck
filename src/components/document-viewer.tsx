"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  fileUrl: string;
  fileType: "pdf" | "docx";
  htmlContent?: string;
  onTextSelect?: (text: string) => void;
}

export default function DocumentViewer({
  fileUrl,
  fileType,
  htmlContent,
  onTextSelect,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
  );

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && onTextSelect) {
      onTextSelect(text);
    }
  }, [onTextSelect]);

  if (fileType === "docx" && htmlContent) {
    return (
      <div className="h-full overflow-auto bg-white" onMouseUp={handleTextSelection}>
        <div
          className="prose prose-sm max-w-none p-8 text-gray-900"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* PDF toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded p-1 hover:bg-[var(--accent)] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[80px] text-center text-sm text-[var(--muted-foreground)]">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="rounded p-1 hover:bg-[var(--accent)] disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="rounded p-1 hover:bg-[var(--accent)]"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[48px] text-center text-xs text-[var(--muted-foreground)]">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.0, s + 0.1))}
            className="rounded p-1 hover:bg-[var(--accent)]"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale(1.0)}
            className="rounded p-1 hover:bg-[var(--accent)]"
            title="Reset zoom"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* PDF content */}
      <div
        className={cn("flex-1 overflow-auto bg-gray-100 p-4")}
        onMouseUp={handleTextSelection}
      >
        <div className="flex justify-center">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex h-64 items-center justify-center text-sm text-[var(--muted-foreground)]">
                Loading document...
              </div>
            }
            error={
              <div className="flex h-64 items-center justify-center text-sm text-red-500">
                Failed to load PDF. Please try again.
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              className="shadow-lg"
              loading={
                <div className="flex h-64 w-[595px] items-center justify-center bg-white text-sm text-[var(--muted-foreground)]">
                  Loading page...
                </div>
              }
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

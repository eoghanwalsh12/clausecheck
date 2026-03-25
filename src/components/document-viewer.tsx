"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  highlightText?: string | null;
  documentText?: string;
}

export default function DocumentViewer({
  fileUrl,
  fileType,
  htmlContent,
  onTextSelect,
  highlightText,
  documentText,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const docxRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

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

  // DOCX highlighting: find and highlight matching text
  useEffect(() => {
    if (fileType !== "docx" || !docxRef.current || !highlightText) return;

    // Clear old highlights
    docxRef.current.querySelectorAll(".ai-highlight").forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(
          window.document.createTextNode(el.textContent || ""),
          el
        );
        parent.normalize();
      }
    });

    const searchStr = highlightText.slice(0, 100).toLowerCase().trim();
    if (searchStr.length < 5) return;

    const walker = window.document.createTreeWalker(
      docxRef.current,
      NodeFilter.SHOW_TEXT
    );
    let found = false;
    while (walker.nextNode() && !found) {
      const node = walker.currentNode as Text;
      const text = node.textContent?.toLowerCase() || "";
      const idx = text.indexOf(searchStr.slice(0, 60));
      if (idx !== -1) {
        try {
          const range = window.document.createRange();
          range.setStart(node, idx);
          range.setEnd(
            node,
            Math.min(idx + searchStr.length, (node.textContent || "").length)
          );
          const mark = window.document.createElement("mark");
          mark.className = "ai-highlight";
          range.surroundContents(mark);
          mark.scrollIntoView({ behavior: "smooth", block: "center" });
          found = true;
        } catch {
          // surroundContents can fail across node boundaries
        }
      }
    }
  }, [highlightText, fileType]);

  // PDF highlighting: navigate to the page containing the quoted text
  useEffect(() => {
    if (fileType !== "pdf" || !highlightText || !documentText || numPages === 0)
      return;

    const searchStr = highlightText.slice(0, 80).toLowerCase().trim();
    if (searchStr.length < 5) return;

    const idx = documentText.toLowerCase().indexOf(searchStr.slice(0, 50));
    if (idx !== -1) {
      const charsPerPage = documentText.length / numPages;
      const estimatedPage = Math.min(
        numPages,
        Math.max(1, Math.ceil(idx / charsPerPage))
      );
      setCurrentPage(estimatedPage);
    }
  }, [highlightText, documentText, numPages, fileType]);

  // PDF text layer highlighting: after page renders, highlight matching spans
  useEffect(() => {
    if (fileType !== "pdf" || !highlightText || !pdfContainerRef.current)
      return;

    const searchStr = highlightText.slice(0, 60).toLowerCase().trim();
    if (searchStr.length < 5) return;

    // Wait for text layer to render
    const timer = setTimeout(() => {
      const container = pdfContainerRef.current;
      if (!container) return;

      // Clear old highlights
      container.querySelectorAll(".ai-highlight-span").forEach((el) => {
        el.classList.remove("ai-highlight-span");
      });

      // Search text layer spans for a match
      const spans = Array.from(
        container.querySelectorAll(".react-pdf__Page__textContent span")
      );
      // Build running text to match multi-span phrases
      let runningText = "";
      const spanMap: { start: number; end: number; el: Element }[] = [];

      for (const span of spans) {
        const text = span.textContent || "";
        const start = runningText.length;
        runningText += text;
        spanMap.push({ start, end: runningText.length, el: span });
      }

      const matchIdx = runningText
        .toLowerCase()
        .indexOf(searchStr.slice(0, 40));
      if (matchIdx !== -1) {
        const matchEnd = matchIdx + searchStr.slice(0, 40).length;
        for (const { start, end, el } of spanMap) {
          if (end > matchIdx && start < matchEnd) {
            (el as HTMLElement).classList.add("ai-highlight-span");
          }
        }
        // Scroll to first highlighted span
        const firstHighlight = container.querySelector(".ai-highlight-span");
        firstHighlight?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [highlightText, fileType, currentPage]);

  if (fileType === "docx" && htmlContent) {
    return (
      <div
        className="h-full overflow-auto bg-white"
        onMouseUp={handleTextSelection}
      >
        <div
          ref={docxRef}
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
        ref={pdfContainerRef}
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

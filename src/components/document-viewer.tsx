"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
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
  activeRefs?: string[];
}

/**
 * For each ref like "Article 3", find its character position in the full doc text.
 * Returns a map of ref → estimated page number.
 */
function estimateRefPages(
  refs: string[],
  documentText: string,
  numPages: number
): Map<string, number> {
  const result = new Map<string, number>();
  if (!documentText || numPages === 0) return result;
  const charsPerPage = documentText.length / numPages;
  const lowerText = documentText.toLowerCase();

  for (const ref of refs) {
    const idx = lowerText.indexOf(ref.toLowerCase());
    if (idx !== -1) {
      const page = Math.min(numPages, Math.max(1, Math.ceil(idx / charsPerPage)));
      result.set(ref, page);
    }
  }
  return result;
}

export default function DocumentViewer({
  fileUrl,
  fileType,
  htmlContent,
  onTextSelect,
  highlightText,
  documentText,
  activeRefs = [],
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

  // Estimate which pages contain each active ref
  const refPageMap = useMemo(
    () => estimateRefPages(activeRefs, documentText || "", numPages),
    [activeRefs, documentText, numPages]
  );

  // ─── DOCX: highlight matching text on click ────────────────────────────────
  useEffect(() => {
    if (fileType !== "docx" || !docxRef.current || !highlightText) return;

    // Clear old click highlights
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

  // ─── DOCX: auto-highlight active section refs ──────────────────────────────
  useEffect(() => {
    if (fileType !== "docx" || !docxRef.current) return;

    // Clear old section highlights
    docxRef.current.querySelectorAll(".section-ref-hl").forEach((el) => {
      el.classList.remove("section-ref-hl");
    });

    if (!activeRefs.length) return;

    // Walk all elements and check if their text starts with a ref
    const allEls = docxRef.current.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, div");
    const refLower = activeRefs.map((r) => r.toLowerCase());

    Array.from(allEls).forEach((el) => {
      const text = (el.textContent || "").toLowerCase().trim();
      for (const ref of refLower) {
        // Match if the element text starts with or contains the ref as a heading
        if (text.startsWith(ref) || text.includes(ref + ".") || text.includes(ref + ":") || text.includes(ref + " ")) {
          (el as HTMLElement).classList.add("section-ref-hl");
          break;
        }
      }
    });
  }, [activeRefs, fileType]);

  // ─── PDF: navigate to page on click-highlight ──────────────────────────────
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

  // ─── PDF: highlight text layer spans (click-highlight + active refs) ───────
  useEffect(() => {
    if (fileType !== "pdf" || !pdfContainerRef.current) return;

    // Collect all search terms: click highlight + active refs
    const searchTerms: { text: string; className: string }[] = [];

    if (highlightText && highlightText.trim().length >= 5) {
      searchTerms.push({
        text: highlightText.slice(0, 60).toLowerCase().trim(),
        className: "ai-highlight-span",
      });
    }

    for (const ref of activeRefs) {
      searchTerms.push({
        text: ref.toLowerCase(),
        className: "section-ref-span",
      });
    }

    if (searchTerms.length === 0) {
      // Clear all highlights
      const timer = setTimeout(() => {
        pdfContainerRef.current
          ?.querySelectorAll(".ai-highlight-span, .section-ref-span")
          .forEach((el) => {
            el.classList.remove("ai-highlight-span", "section-ref-span");
          });
      }, 100);
      return () => clearTimeout(timer);
    }

    // Wait for text layer to render
    const timer = setTimeout(() => {
      const container = pdfContainerRef.current;
      if (!container) return;

      // Clear old highlights
      container
        .querySelectorAll(".ai-highlight-span, .section-ref-span")
        .forEach((el) => {
          el.classList.remove("ai-highlight-span", "section-ref-span");
        });

      // Build running text from text layer spans
      const spans = Array.from(
        container.querySelectorAll(".react-pdf__Page__textContent span")
      );
      let runningText = "";
      const spanMap: { start: number; end: number; el: Element }[] = [];

      for (const span of spans) {
        const text = span.textContent || "";
        const start = runningText.length;
        runningText += text;
        spanMap.push({ start, end: runningText.length, el: span });
      }

      const lowerRunning = runningText.toLowerCase();

      for (const { text, className } of searchTerms) {
        // Find ALL occurrences of this term
        let searchIdx = 0;
        while (searchIdx < lowerRunning.length) {
          const matchIdx = lowerRunning.indexOf(text, searchIdx);
          if (matchIdx === -1) break;

          const matchEnd = matchIdx + text.length;

          // Highlight all spans that overlap with this match
          for (const { start, end, el } of spanMap) {
            if (end > matchIdx && start < matchEnd) {
              (el as HTMLElement).classList.add(className);
            }
          }

          searchIdx = matchIdx + text.length;
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [highlightText, activeRefs, fileType, currentPage]);

  // ─── DOCX render ───────────────────────────────────────────────────────────
  if (fileType === "docx" && htmlContent) {
    return (
      <div className="flex h-full flex-col">
        {/* Active refs bar for DOCX */}
        {activeRefs.length > 0 && (
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 overflow-x-auto">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
            <span className="shrink-0 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
              Referenced:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {activeRefs.map((ref) => (
                <span
                  key={ref}
                  className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300"
                >
                  {ref}
                </span>
              ))}
            </div>
          </div>
        )}
        <div
          className="flex-1 overflow-auto bg-white"
          onMouseUp={handleTextSelection}
        >
          <div
            ref={docxRef}
            className="prose prose-sm max-w-none p-8 text-gray-900"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    );
  }

  // ─── Text-only fallback (loaded from DB without original file) ─────────────
  if (!fileUrl && documentText) {
    return (
      <div className="flex h-full flex-col">
        {activeRefs.length > 0 && (
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 overflow-x-auto">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
            <span className="shrink-0 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
              Referenced:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {activeRefs.map((ref) => (
                <span
                  key={ref}
                  className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300"
                >
                  {ref}
                </span>
              ))}
            </div>
          </div>
        )}
        <div
          className="flex-1 overflow-auto bg-white"
          onMouseUp={handleTextSelection}
        >
          <div className="prose prose-sm max-w-none p-8 text-gray-900 whitespace-pre-wrap">
            {documentText}
          </div>
        </div>
      </div>
    );
  }

  // ─── PDF render ────────────────────────────────────────────────────────────
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

      {/* Active refs navigation bar */}
      {activeRefs.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 overflow-x-auto">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span className="shrink-0 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
            Referenced:
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {activeRefs.map((ref) => {
              const page = refPageMap.get(ref);
              return (
                <button
                  key={ref}
                  onClick={() => {
                    if (page) setCurrentPage(page);
                  }}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                    page === currentPage
                      ? "bg-indigo-500 text-white"
                      : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50"
                  )}
                  title={page ? `Go to page ${page}` : ref}
                >
                  {ref}
                  {page ? ` (p.${page})` : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

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

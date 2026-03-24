"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(f.type)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const analysis = await res.json();
      // Store in sessionStorage for the results page
      sessionStorage.setItem(
        `analysis-${analysis.id}`,
        JSON.stringify(analysis)
      );
      router.push(`/analysis/${analysis.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
          dragging
            ? "border-[var(--primary)] bg-[var(--muted)]"
            : "border-[var(--border)]",
          !file && "cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--muted)]"
        )}
        onClick={() => {
          if (!file) {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf,.docx";
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFile(f);
            };
            input.click();
          }
        }}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-[var(--muted-foreground)]" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setError(null);
              }}
              className="ml-2 rounded-md p-1 hover:bg-[var(--muted)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="font-medium">Drop your contract here</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              PDF or DOCX, up to 10 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-center text-sm text-[var(--destructive)]">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || analyzing}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-medium text-[var(--primary-foreground)] transition-opacity",
          (!file || analyzing) ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
        )}
      >
        {analyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysing contract...
          </>
        ) : (
          "Analyse Contract"
        )}
      </button>
    </div>
  );
}

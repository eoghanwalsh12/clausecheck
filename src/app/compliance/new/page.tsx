"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, X, FileText, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

function sanitiseFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
void sanitiseFileName; // used in API route, referenced here for consistency

interface UploadedFile {
  file: File;
  id?: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

function NewComplianceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [jobName, setJobName] = useState(
    `Compliance Check — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
  );
  const [legislationName, setLegislationName] = useState("");
  const [matterId] = useState(searchParams.get("matter") || "");

  const [legislationFiles, setLegislationFiles] = useState<UploadedFile[]>([]);
  const [contractFiles, setContractFiles] = useState<UploadedFile[]>([]);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const legInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  const addLegislationFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files)
      .filter((f) => f.name.match(/\.(pdf|docx)$/i))
      .slice(0, 5 - legislationFiles.length)
      .map((f) => ({ file: f, status: "pending" as const }));
    setLegislationFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  }, [legislationFiles.length]);

  const addContractFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files)
      .filter((f) => f.name.match(/\.(pdf|docx)$/i))
      .map((f) => ({ file: f, status: "pending" as const }));
    setContractFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "legislation" | "contract") => {
      e.preventDefault();
      if (type === "legislation") addLegislationFiles(e.dataTransfer.files);
      else addContractFiles(e.dataTransfer.files);
    },
    [addLegislationFiles, addContractFiles]
  );

  const handleStart = useCallback(async () => {
    if (!user || creating) return;
    setCreating(true);
    setError("");

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      // Create job
      const jobRes = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: jobName, legislationName, matterId: matterId || null }),
      });
      if (!jobRes.ok) {
        const d = await jobRes.json();
        throw new Error(d.error || "Failed to create job");
      }
      const { id: jobId } = await jobRes.json();

      // Upload all files
      const allFiles: { file: File; docType: "legislation" | "contract" }[] = [
        ...legislationFiles.map((f) => ({ file: f.file, docType: "legislation" as const })),
        ...contractFiles.map((f) => ({ file: f.file, docType: "contract" as const })),
      ];

      for (const { file, docType } of allFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("docType", docType);
        await fetch(`/api/compliance/${jobId}/documents`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }

      // Update total_contracts count
      await fetch(`/api/compliance/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ totalContracts: contractFiles.length }),
      });

      router.push(`/compliance/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }, [user, creating, jobName, legislationName, matterId, legislationFiles, contractFiles, router]);

  const steps = ["Setup", "Legislation", "Contracts"];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i + 1 === step
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : i + 1 < step
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${i + 1 === step ? "font-medium text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
            >
              {s}
            </span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Setup */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              New Compliance Check
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Check multiple contracts against legislation.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                Check Name
              </label>
              <input
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                Legislation Name *
              </label>
              <input
                autoFocus
                value={legislationName}
                onChange={(e) => setLegislationName(e.target.value)}
                placeholder="e.g. GDPR, UK Employment Rights Act 2023"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                This label appears in findings to identify the source legislation.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!jobName.trim() || !legislationName.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Legislation */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Upload Legislation
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Upload 1–5 legislation documents. PDF or DOCX, up to 10 MB each.
            </p>
          </div>

          <div
            className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center transition-colors hover:border-[var(--primary)]/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "legislation")}
          >
            <Upload className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="mt-3 text-sm font-medium text-[var(--foreground)]">Drop legislation files here</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">or</p>
            <input
              ref={legInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              className="hidden"
              onChange={(e) => addLegislationFiles(e.target.files)}
            />
            <button
              onClick={() => legInputRef.current?.click()}
              className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              Browse files
            </button>
          </div>

          {legislationFiles.length > 0 && (
            <div className="space-y-2">
              {legislationFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                  <span className="flex-1 truncate text-sm text-[var(--foreground)]">{f.file.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {(f.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button
                    onClick={() => setLegislationFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={legislationFiles.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Contracts */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Upload Contracts
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Upload all contracts to check. You can drag multiple files at once.
            </p>
          </div>

          {contractFiles.length > 30 && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
              <p className="text-xs text-[var(--muted-foreground)]">
                Large batches (~{contractFiles.length} contracts) will take{" "}
                {Math.ceil((contractFiles.length * 12) / 60)} minutes. Keep this tab open during analysis.
              </p>
            </div>
          )}

          <div
            className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center transition-colors hover:border-[var(--primary)]/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "contract")}
          >
            <Upload className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
              Drop contract files here
              {contractFiles.length > 0 && (
                <span className="ml-2 rounded-full bg-[var(--primary)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]">
                  {contractFiles.length} added
                </span>
              )}
            </p>
            <input
              ref={contractInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              className="hidden"
              onChange={(e) => addContractFiles(e.target.files)}
            />
            <button
              onClick={() => contractInputRef.current?.click()}
              className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              Browse files
            </button>
          </div>

          {contractFiles.length > 0 && (
            <div className="max-h-60 space-y-1.5 overflow-y-auto">
              {contractFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                  <span className="flex-1 truncate text-xs text-[var(--foreground)]">{f.file.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {(f.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button
                    onClick={() => setContractFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            >
              Back
            </button>
            <button
              onClick={handleStart}
              disabled={contractFiles.length === 0 || creating}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? "Uploading…" : "Start Analysis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCompliancePage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" /></div>}>
      <NewComplianceContent />
    </Suspense>
  );
}

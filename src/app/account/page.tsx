"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center text-sm text-[var(--muted-foreground)]">
        Sign in to manage your account.
      </div>
    );
  }

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch("/api/account/export", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clausecheck-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Deletion failed");
      await signOut();
      router.push("/");
    } catch {
      setError("Failed to delete account. Please try again or contact support.");
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-14">
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        Account
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{user.email}</p>

      {error && (
        <p className="mt-4 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-3 py-2 text-sm text-[var(--destructive)]">
          {error}
        </p>
      )}

      {/* Data export */}
      <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold text-[var(--foreground)]">Export your data</h2>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
          Download all your projects, chat history, and deliverables as a JSON
          file. This is your right under GDPR Article 20 (data portability).
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exporting ? "Exporting..." : "Download my data"}
        </button>
      </section>

      {/* Account deletion */}
      <section className="mt-4 rounded-xl border border-[var(--destructive)]/25 bg-[var(--card)] p-5">
        <h2 className="font-semibold text-[var(--destructive)]">Delete account</h2>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
          Permanently delete all your data including projects, documents, chat
          history, and deliverables. This action cannot be undone.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--destructive)]/30 px-4 py-2 text-sm font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)]/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete my account
          </button>
        ) : (
          <div className="mt-4 rounded-lg border border-[var(--destructive)]/25 bg-[var(--destructive)]/6 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--destructive)]" />
              <div>
                <p className="text-sm font-medium">Are you sure?</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  All projects, documents, and deliverables will be permanently
                  deleted. We recommend exporting your data first.
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--destructive)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? "Deleting..." : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:bg-[var(--accent)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

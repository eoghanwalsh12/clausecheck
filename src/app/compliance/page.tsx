"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { ComplianceJob } from "@/lib/types";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:    { label: "Pending",    className: "bg-[var(--muted)] text-[var(--muted-foreground)]" },
  uploading:  { label: "Uploading",  className: "bg-[var(--muted)] text-[var(--muted-foreground)]" },
  extracting: { label: "Extracting", className: "bg-amber-400/10 text-amber-400" },
  analysing:  { label: "Analysing",  className: "bg-[var(--primary)]/10 text-[var(--primary)]" },
  complete:   { label: "Complete",   className: "bg-emerald-400/10 text-emerald-400" },
  error:      { label: "Error",      className: "bg-red-400/10 text-red-400" },
};

function formatDate(d: string) {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

export default function CompliancePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<ComplianceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch("/api/compliance", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user, fetchJobs]);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Delete this compliance check and all its results?")) return;
    setDeleting(jobId);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(`/api/compliance/${jobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setDeleting(null);
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Compliance Checks
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Audit contracts against legislation at scale.
          </p>
        </div>
        <button
          onClick={() => router.push("/compliance/new")}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Check
        </button>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <BarChart3 className="h-6 w-6 text-[var(--muted-foreground)]" />
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--foreground)]">No compliance checks yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Upload legislation and contracts to run your first audit.
          </p>
          <button
            onClick={() => router.push("/compliance/new")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Check
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {jobs.map((job) => {
            const total = job.total_contracts || 1;
            const ncPct = Math.round((job.noncompliant_contracts / total) * 100);
            const riskyPct = Math.round((job.risky_contracts / total) * 100);
            const okPct = Math.round((job.compliant_contracts / total) * 100);
            const badge = STATUS_BADGE[job.status] ?? STATUS_BADGE.pending;

            return (
              <div
                key={job.id}
                onClick={() => router.push(`/compliance/${job.id}`)}
                className="group flex cursor-pointer items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--accent)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{job.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                    <span>{job.legislation_name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(job.created_at)}
                    </span>
                    {job.total_contracts > 0 && (
                      <span>{job.total_contracts} contracts</span>
                    )}
                  </div>

                  {/* Compliance rate bar */}
                  {job.status === "complete" && job.total_contracts > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex h-1.5 flex-1 rounded-full overflow-hidden bg-[var(--muted)]">
                        {ncPct > 0 && (
                          <div className="h-full bg-red-400" style={{ width: `${ncPct}%` }} />
                        )}
                        {riskyPct > 0 && (
                          <div className="h-full bg-amber-400" style={{ width: `${riskyPct}%` }} />
                        )}
                        {okPct > 0 && (
                          <div className="h-full bg-emerald-400" style={{ width: `${okPct}%` }} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs shrink-0">
                        {job.noncompliant_contracts > 0 && (
                          <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="h-3 w-3" />{job.noncompliant_contracts}
                          </span>
                        )}
                        {job.risky_contracts > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <AlertTriangle className="h-3 w-3" />{job.risky_contracts}
                          </span>
                        )}
                        {job.compliant_contracts > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />{job.compliant_contracts}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                  disabled={deleting === job.id}
                  className="rounded-md p-1.5 text-[var(--muted-foreground)] opacity-0 transition-all hover:bg-[var(--destructive)]/15 hover:text-[var(--destructive)] group-hover:opacity-100"
                >
                  {deleting === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

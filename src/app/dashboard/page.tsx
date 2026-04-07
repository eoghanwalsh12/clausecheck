"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  UserCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface ProjectSummary {
  id: string;
  file_name: string;
  file_type: string;
  position_role: string | null;
  updated_at: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch("/api/projects", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) {
      setProjects(await res.json());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user, fetchProjects]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(id);
    const session = (await supabase.auth.getSession()).data.session;
    await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
            Your Projects
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Pick up where you left off, or start a new analysis.
          </p>
        </div>
        <button
          onClick={() => router.push("/workspace")}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <FileText className="h-6 w-6 text-[var(--muted-foreground)]" />
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--foreground)]">No projects yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Upload a document to get started.
          </p>
          <button
            onClick={() => router.push("/workspace")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-1.5">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/workspace?project=${project.id}`)}
              className="group flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--accent)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]">
                  <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {project.file_name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.updated_at)}
                    </span>
                    {project.position_role && (
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {project.position_role}
                      </span>
                    )}
                    <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                      {project.file_type}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(project.id);
                }}
                disabled={deleting === project.id}
                className="rounded-md p-1.5 text-[var(--muted-foreground)] opacity-0 transition-all hover:bg-[var(--destructive)]/15 hover:text-[var(--destructive)] group-hover:opacity-100"
                title="Delete project"
              >
                {deleting === project.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

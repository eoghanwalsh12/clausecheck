"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Clock,
  Loader2,
  ChevronRight,
  FileText,
  Users,
  Briefcase,
  ArrowLeft,
  Building2,
  UserRound,
  StickyNote,
  FolderOpen,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Client, Matter, ComplianceJob } from "@/lib/types";
import CreateClientModal from "@/components/create-client-modal";
import CreateMatterModal from "@/components/create-matter-modal";

interface ProjectSummary {
  id: string;
  file_name: string;
  file_type: string;
  position_role: string | null;
  matter_id: string | null;
  updated_at: string;
}

type View =
  | { type: "clients" }
  | { type: "client"; client: Client & { matters: Matter[] } }
  | { type: "matter"; client: Client; matter: Matter & { projects: ProjectSummary[] } };

function formatDate(dateStr: string) {
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
}

const MATTER_TYPE_LABELS: Record<string, string> = {
  analysis: "Analysis",
  due_diligence: "Due Diligence",
  compliance_check: "Compliance",
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<View>({ type: "clients" });
  const [clients, setClients] = useState<Client[]>([]);
  const [uncategorised, setUncategorised] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateMatter, setShowCreateMatter] = useState(false);
  const [complianceJobs, setComplianceJobs] = useState<ComplianceJob[]>([]);

  const getToken = useCallback(async () => {
    return (await supabase.auth.getSession()).data.session?.access_token;
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [authLoading, user, router]);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    const token = await getToken();
    const res = await fetch("/api/clients", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, [user, getToken]);

  const fetchUncategorised = useCallback(async () => {
    if (!user) return;
    const token = await getToken();
    const res = await fetch("/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const all: ProjectSummary[] = await res.json();
      setUncategorised(all.filter((p) => !p.matter_id));
    }
  }, [user, getToken]);

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchUncategorised();
    }
  }, [user, fetchClients, fetchUncategorised]);

  const openClient = useCallback(async (client: Client) => {
    const token = await getToken();
    const res = await fetch(`/api/clients/${client.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setView({ type: "client", client: data });
    }
  }, [getToken]);

  const openMatter = useCallback(async (client: Client, matter: Matter) => {
    const token = await getToken();
    const [matterRes, jobsRes] = await Promise.all([
      fetch(`/api/matters/${matter.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/compliance?matterId=${matter.id}`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (matterRes.ok) {
      const data = await matterRes.json();
      setView({ type: "matter", client, matter: data });
    }
    if (jobsRes.ok) {
      setComplianceJobs(await jobsRes.json());
    } else {
      setComplianceJobs([]);
    }
  }, [getToken]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    if (!confirm("Delete this client and all its matters? Documents will be kept.")) return;
    setDeleting(clientId);
    const token = await getToken();
    await fetch(`/api/clients/${clientId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setDeleting(null);
  }, [getToken]);

  const handleDeleteMatter = useCallback(async (matterId: string, client: Client) => {
    if (!confirm("Delete this matter? Documents will be kept.")) return;
    setDeleting(matterId);
    const token = await getToken();
    await fetch(`/api/matters/${matterId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await openClient(client);
    setDeleting(null);
  }, [getToken, openClient]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeleting(projectId);
    const token = await getToken();
    await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setView((prev) => {
      if (prev.type === "matter") {
        return {
          ...prev,
          matter: {
            ...prev.matter,
            projects: prev.matter.projects.filter((p) => p.id !== projectId),
          },
        };
      }
      return prev;
    });
    setUncategorised((prev) => prev.filter((p) => p.id !== projectId));
    setDeleting(null);
  }, [getToken]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* CLIENTS VIEW */}
      {view.type === "clients" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Clients
              </h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Manage your client files and matters.
              </p>
            </div>
            <button
              onClick={() => setShowCreateClient(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Client
            </button>
          </div>

          {loading ? (
            <div className="mt-16 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : (
            <div className="mt-6 space-y-1.5">
              {clients.length === 0 && uncategorised.length === 0 ? (
                <div className="mt-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
                    <Users className="h-6 w-6 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[var(--foreground)]">No clients yet</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Create a client to organise your matters.
                  </p>
                  <button
                    onClick={() => setShowCreateClient(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                    New Client
                  </button>
                </div>
              ) : (
                <>
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => openClient(client)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--accent)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]">
                          <FolderOpen className="h-4 w-4 text-[var(--primary)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">
                            {client.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {client.matter_count ?? 0}{" "}
                              {client.matter_count === 1 ? "matter" : "matters"}
                            </span>
                            {client.company_type && (
                              <span>{client.company_type}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id);
                          }}
                          disabled={deleting === client.id}
                          className="rounded-md p-1.5 text-[var(--muted-foreground)] opacity-0 transition-all hover:bg-[var(--destructive)]/15 hover:text-[var(--destructive)] group-hover:opacity-100"
                          title="Delete client"
                        >
                          {deleting === client.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Uncategorised bucket */}
                  {uncategorised.length > 0 && (
                    <>
                      {clients.length > 0 && (
                        <div className="pt-3 pb-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                            Uncategorised
                          </p>
                        </div>
                      )}
                      {uncategorised.map((project) => (
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
                                <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                                  {project.file_type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            disabled={deleting === project.id}
                            className="rounded-md p-1.5 text-[var(--muted-foreground)] opacity-0 transition-all hover:bg-[var(--destructive)]/15 hover:text-[var(--destructive)] group-hover:opacity-100"
                            title="Delete document"
                          >
                            {deleting === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* CLIENT DETAIL VIEW */}
      {view.type === "client" && (
        <>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <button
              onClick={() => setView({ type: "clients" })}
              className="flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Clients
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-[var(--foreground)]">{view.client.name}</span>
          </div>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {view.client.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
                {view.client.contact_name && (
                  <span className="flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5" />
                    {view.client.contact_name}
                  </span>
                )}
                {view.client.company_type && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {view.client.company_type}
                  </span>
                )}
                {view.client.notes && (
                  <span className="flex items-center gap-1.5">
                    <StickyNote className="h-3.5 w-3.5" />
                    {view.client.notes}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowCreateMatter(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Matter
            </button>
          </div>

          <div className="mt-8">
            {view.client.matters.length === 0 ? (
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  <Briefcase className="h-6 w-6 text-[var(--muted-foreground)]" />
                </div>
                <p className="mt-4 text-sm font-medium text-[var(--foreground)]">No matters yet</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Create a matter to start uploading documents.
                </p>
                <button
                  onClick={() => setShowCreateMatter(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  New Matter
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {view.client.matters.map((matter) => (
                  <div
                    key={matter.id}
                    onClick={() => openMatter(view.client, matter)}
                    className="group flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--accent)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]">
                        <Briefcase className="h-4 w-4 text-[var(--primary)]/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {matter.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                          <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                            {MATTER_TYPE_LABELS[matter.matter_type] ?? matter.matter_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {matter.project_count ?? 0}{" "}
                            {matter.project_count === 1 ? "document" : "documents"}
                          </span>
                          {matter.description && (
                            <span className="truncate">{matter.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMatter(matter.id, view.client);
                        }}
                        disabled={deleting === matter.id}
                        className="rounded-md p-1.5 text-[var(--muted-foreground)] opacity-0 transition-all hover:bg-[var(--destructive)]/15 hover:text-[var(--destructive)] group-hover:opacity-100"
                        title="Delete matter"
                      >
                        {deleting === matter.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* MATTER DETAIL VIEW */}
      {view.type === "matter" && (
        <>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <button
              onClick={() => setView({ type: "clients" })}
              className="rounded-md px-1 py-0.5 transition-colors hover:text-[var(--foreground)]"
            >
              Clients
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <button
              onClick={() => openClient(view.client)}
              className="rounded-md px-1 py-0.5 transition-colors hover:text-[var(--foreground)]"
            >
              {view.client.name}
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-[var(--foreground)]">{view.matter.name}</span>
          </div>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-2xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {view.matter.name}
                </h1>
                <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  {MATTER_TYPE_LABELS[view.matter.matter_type] ?? view.matter.matter_type}
                </span>
              </div>
              {view.matter.description && (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {view.matter.description}
                </p>
              )}
            </div>
            {view.matter.matter_type === "compliance_check" ? (
              <button
                onClick={() => router.push(`/compliance/new?matter=${view.matter.id}`)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                New Check
              </button>
            ) : (
              <button
                onClick={() => router.push(`/workspace?matter=${view.matter.id}`)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add Document
              </button>
            )}
          </div>

          <div className="mt-8">
            {view.matter.matter_type === "compliance_check" ? (
              /* ── COMPLIANCE MATTER VIEW ── */
              complianceJobs.length === 0 ? (
                <div className="mt-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
                    <ShieldCheck className="h-6 w-6 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[var(--foreground)]">No compliance checks yet</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Upload legislation and contracts to run a compliance check.
                  </p>
                  <button
                    onClick={() => router.push(`/compliance/new?matter=${view.matter.id}`)}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                    New Compliance Check
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {complianceJobs.map((job) => {
                    const total = job.total_contracts ?? 0;
                    const done = job.contracts_done ?? 0;
                    const compliant = job.compliant_contracts ?? 0;
                    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : null;
                    return (
                      <div
                        key={job.id}
                        onClick={() => router.push(`/compliance/${job.id}`)}
                        className="group flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--accent)]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]">
                            <ShieldCheck className="h-4 w-4 text-[var(--primary)]/70" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--foreground)]">
                              {job.name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                              <span>{job.legislation_name}</span>
                              {job.status === "complete" ? (
                                <>
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {total} contracts
                                  </span>
                                  {complianceRate !== null && (
                                    <span
                                      className={`font-medium ${
                                        complianceRate >= 80
                                          ? "text-emerald-500"
                                          : complianceRate >= 50
                                          ? "text-amber-500"
                                          : "text-red-500"
                                      }`}
                                    >
                                      {complianceRate}% compliant
                                    </span>
                                  )}
                                </>
                              ) : job.status === "analysing" || job.status === "extracting" ? (
                                <span className="flex items-center gap-1 text-amber-500">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  {done}/{total} contracts
                                </span>
                              ) : (
                                <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                                  {job.status}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(job.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* ── REGULAR MATTER VIEW ── */
              view.matter.projects.length === 0 ? (
                <div className="mt-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
                    <FileText className="h-6 w-6 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[var(--foreground)]">No documents yet</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Upload a document to begin analysis.
                  </p>
                  <button
                    onClick={() => router.push(`/workspace?matter=${view.matter.id}`)}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Document
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {view.matter.projects.map((project) => (
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
                            <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                              {project.file_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        disabled={deleting === project.id}
                        className="rounded-md p-1.5 text-[var(--muted-foreground)] opacity-0 transition-all hover:bg-[var(--destructive)]/15 hover:text-[var(--destructive)] group-hover:opacity-100"
                        title="Delete document"
                      >
                        {deleting === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}

                  {/* Compliance Check secondary action */}
                  <div
                    onClick={() => router.push(`/compliance/new?matter=${view.matter.id}`)}
                    className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--primary)]/30 px-4 py-3.5 transition-colors hover:border-[var(--primary)]/60 hover:bg-[var(--accent)]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]">
                      <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">New Compliance Check</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Bulk-check contracts against legislation
                      </p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-[var(--muted-foreground)]" />
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {showCreateClient && (
        <CreateClientModal
          onClose={() => setShowCreateClient(false)}
          onCreated={(client) => {
            setClients((prev) => [client, ...prev]);
            setShowCreateClient(false);
          }}
          getToken={getToken}
        />
      )}

      {showCreateMatter && view.type === "client" && (
        <CreateMatterModal
          clientId={view.client.id}
          clientName={view.client.name}
          onClose={() => setShowCreateMatter(false)}
          onCreated={(matter) => {
            setView((prev) => {
              if (prev.type !== "client") return prev;
              return {
                ...prev,
                client: {
                  ...prev.client,
                  matters: [matter, ...prev.client.matters],
                  matter_count: (prev.client.matter_count ?? 0) + 1,
                },
              };
            });
            setShowCreateMatter(false);
          }}
          getToken={getToken}
        />
      )}
    </div>
  );
}

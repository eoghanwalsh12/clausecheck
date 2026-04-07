"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useComplianceRun } from "@/hooks/use-compliance-run";
import type {
  ComplianceJob,
  ComplianceDocument,
  ComplianceFinding,
  ContractStatus,
} from "@/lib/types";

// ── Tier helpers ────────────────────────────────────────────
const TIER_LABEL: Record<string, string> = {
  non_compliant: "Non-Compliant",
  risky: "Risky",
  compliant: "Compliant",
};
const TIER_COLOR: Record<string, string> = {
  non_compliant: "text-red-400 bg-red-400/10 border-red-400/20",
  risky: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  compliant: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};
const STATUS_ICON = {
  non_compliant: <XCircle className="h-4 w-4 text-red-400" />,
  risky: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  compliant: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
};
const RISK_BASIS_LABEL: Record<string, string> = {
  interpretive: "Interpretive Risk",
  future_legislation: "Future Legislation",
  ambiguous_drafting: "Ambiguous Drafting",
};

// ── Sub-components ──────────────────────────────────────────

function FindingCard({ finding }: { finding: ComplianceFinding }) {
  const [open, setOpen] = useState(finding.compliance_tier !== "compliant");
  return (
    <div className={`rounded-xl border ${TIER_COLOR[finding.compliance_tier]} overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border">
          {finding.legislation_ref}
        </span>
        {finding.risk_basis && (
          <span className="mt-0.5 shrink-0 text-xs font-medium px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
            {RISK_BASIS_LABEL[finding.risk_basis]}
          </span>
        )}
        <span className="flex-1 text-sm text-[var(--foreground)] line-clamp-2">
          {finding.issue_summary}
        </span>
        {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-current/10 px-4 py-3 space-y-3">
          {finding.clause_text && (
            <blockquote className="border-l-2 border-current/30 pl-3 text-xs italic text-[var(--muted-foreground)]">
              &ldquo;{finding.clause_text}&rdquo;
            </blockquote>
          )}
          <p className="text-sm text-[var(--foreground)]">{finding.issue_summary}</p>
          {finding.suggested_fix && (
            <div className="rounded-lg bg-[var(--muted)]/60 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                Suggested Fix
              </p>
              <p className="text-sm text-[var(--foreground)]">{finding.suggested_fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContractFindingsPanel({ contract, jobId }: { contract: ComplianceDocument; jobId: string }) {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompliant, setShowCompliant] = useState(false);

  useEffect(() => {
    async function load() {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`/api/compliance/${jobId}/findings?contractId=${contract.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFindings(await res.json());
      setLoading(false);
    }
    load();
  }, [jobId, contract.id]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" /></div>;

  const nonCompliant = findings.filter((f) => f.compliance_tier === "non_compliant");
  const risky = findings.filter((f) => f.compliance_tier === "risky");
  const compliant = findings.filter((f) => f.compliance_tier === "compliant");

  return (
    <div className="space-y-6">
      {/* Contract header */}
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[var(--muted-foreground)]" />
        <div>
          <h3 className="font-medium text-[var(--foreground)]">{contract.file_name}</h3>
          {contract.contract_summary && (
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{contract.contract_summary}</p>
          )}
        </div>
        {contract.contract_status && (
          <span className={`ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-semibold border ${TIER_COLOR[contract.contract_status]}`}>
            {TIER_LABEL[contract.contract_status]}
          </span>
        )}
      </div>

      {/* Non-Compliant */}
      {nonCompliant.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">
            Non-Compliant ({nonCompliant.length})
          </h4>
          <div className="space-y-2">
            {nonCompliant.map((f) => <FindingCard key={f.id} finding={f} />)}
          </div>
        </div>
      )}

      {/* Risky */}
      {risky.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Risky ({risky.length})
          </h4>
          <div className="space-y-2">
            {risky.map((f) => <FindingCard key={f.id} finding={f} />)}
          </div>
        </div>
      )}

      {/* Compliant (collapsed) */}
      {compliant.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompliant((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400"
          >
            {showCompliant ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Compliant ({compliant.length})
          </button>
          {showCompliant && (
            <div className="mt-3 space-y-2">
              {compliant.map((f) => <FindingCard key={f.id} finding={f} />)}
            </div>
          )}
        </div>
      )}

      {findings.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">No findings recorded for this contract.</p>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────

export default function ComplianceJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<ComplianceJob | null>(null);
  const [contracts, setContracts] = useState<ComplianceDocument[]>([]);
  const [legislationDocs, setLegislationDocs] = useState<ComplianceDocument[]>([]);
  const [selectedContract, setSelectedContract] = useState<ComplianceDocument | null>(null);
  const [summary, setSummary] = useState<{
    topicBreakdown: { topic: string; non_compliant: number; risky: number; compliant: number; total: number }[];
    mostContravenedArticles: { ref: string; contractsAffected: number }[];
    mostProblematic: { id: string; fileName: string; nonCompliantCount: number; riskyCount: number }[];
    totals: { nonCompliant: number; risky: number; compliant: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequiresAttention, setShowRequiresAttention] = useState(true);
  const [showCompliantFolder, setShowCompliantFolder] = useState(false);
  const hasStartedRun = useRef(false);

  const { phase, phaseLabel, contractProgress, requirementsCount, error, startRun } =
    useComplianceRun({
      jobId,
      onComplete: () => loadSummary(),
    });

  const loadJob = useCallback(async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const [jobRes, docsRes] = await Promise.all([
      fetch(`/api/compliance/${jobId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/compliance/${jobId}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (jobRes.ok) setJob(await jobRes.json());
    if (docsRes.ok) {
      const docs: ComplianceDocument[] = await docsRes.json();
      setContracts(docs.filter((d) => d.doc_type === "contract"));
      setLegislationDocs(docs.filter((d) => d.doc_type === "legislation"));
    }
    setLoading(false);
  }, [jobId]);

  const loadSummary = useCallback(async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/compliance/${jobId}/summary`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setSummary(data);
      setContracts(data.contracts ?? []);
      setJob(data.job);
    }
  }, [jobId]);

  useEffect(() => {
    if (!user) return;
    loadJob();
  }, [user, loadJob]);

  // Auto-start run if job is not complete
  useEffect(() => {
    if (hasStartedRun.current || loading || !job || !user) return;
    if (job.status === "complete") {
      loadSummary();
      return;
    }
    if (["pending", "uploading", "extracting", "analysing"].includes(job.status)) {
      hasStartedRun.current = true;
      const pendingContracts = contracts.filter((d) => d.status === "pending");
      startRun(legislationDocs, pendingContracts, job.legislation_name);
    }
  }, [loading, job, contracts, legislationDocs, user, startRun, loadSummary]);

  // Warn on tab close while running
  useEffect(() => {
    if (!["extracting", "analysing"].includes(phase)) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Analysis is in progress. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  if (loading || !job) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  const isProcessing = ["extracting", "analysing"].includes(phase) && phase !== "complete";
  const isComplete = phase === "complete" || job.status === "complete";

  const requiresAttention = contracts.filter(
    (c) => c.contract_status === "non_compliant" || c.contract_status === "risky"
  ).sort((a, b) => {
    if (a.contract_status === "non_compliant" && b.contract_status !== "non_compliant") return -1;
    if (b.contract_status === "non_compliant" && a.contract_status !== "non_compliant") return 1;
    return (b.noncompliant_count || 0) - (a.noncompliant_count || 0);
  });

  const compliantContracts = contracts.filter((c) => c.contract_status === "compliant");

  const complianceRate = job.total_contracts > 0
    ? Math.round((job.compliant_contracts / job.total_contracts) * 100)
    : 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => router.push("/compliance")}
            className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All Checks
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-xl font-semibold"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {job.name}
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">{job.legislation_name}</p>
            </div>
            {isComplete && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Analysis complete</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* PROCESSING STATE */}
        {isProcessing && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{phaseLabel}</p>
                  {requirementsCount > 0 && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {requirementsCount} requirements extracted
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {contractProgress.length > 0 && (
                <>
                  <div className="h-1.5 w-full rounded-full bg-[var(--muted)] overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{
                        width: `${(contractProgress.filter((c) => c.status === "done" || c.status === "error").length / contractProgress.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {contractProgress.filter((c) => c.status === "done").length} of {contractProgress.length} contracts analysed
                  </p>
                </>
              )}
            </div>

            {/* Per-contract list */}
            <div className="space-y-1.5">
              {contractProgress.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                  <div className="shrink-0">
                    {c.status === "pending" && <div className="h-4 w-4 rounded-full border border-[var(--border)]" />}
                    {c.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />}
                    {c.status === "done" && (c.contractStatus === "non_compliant"
                      ? <XCircle className="h-4 w-4 text-red-400" />
                      : c.contractStatus === "risky"
                      ? <AlertTriangle className="h-4 w-4 text-amber-400" />
                      : <CheckCircle2 className="h-4 w-4 text-emerald-400" />)}
                    {c.status === "error" && <XCircle className="h-4 w-4 text-[var(--destructive)]" />}
                  </div>
                  <span className="flex-1 truncate text-sm text-[var(--foreground)]">{c.fileName}</span>
                  {c.status === "done" && c.contractStatus && (
                    <span className={`text-xs font-medium ${TIER_COLOR[c.contractStatus]} border rounded-full px-2 py-0.5`}>
                      {TIER_LABEL[c.contractStatus]}
                    </span>
                  )}
                  {c.status === "done" && (c.nonCompliantCount || 0) > 0 && (
                    <span className="text-xs text-red-400">{c.nonCompliantCount} issues</span>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--destructive)] mt-0.5" />
                <p className="text-sm text-[var(--destructive)]">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* RESULTS STATE */}
        {isComplete && summary && (
          <div className="space-y-8">
            {/* Summary Dashboard */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
                <h2
                  className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  Compliance Summary
                </h2>
              </div>

              {/* Rate + distribution */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Compliance Rate</p>
                  <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">{complianceRate}%</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{job.compliant_contracts} of {job.total_contracts} contracts</p>
                </div>
                <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-red-400">Non-Compliant</p>
                  <p className="mt-1 text-3xl font-bold text-red-400">{job.noncompliant_contracts}</p>
                  <p className="text-xs text-red-400/60">contracts</p>
                </div>
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Risky</p>
                  <p className="mt-1 text-3xl font-bold text-amber-400">{job.risky_contracts}</p>
                  <p className="text-xs text-amber-400/60">contracts</p>
                </div>
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Compliant</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-400">{job.compliant_contracts}</p>
                  <p className="text-xs text-emerald-400/60">contracts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Areas of concern */}
                {summary.topicBreakdown.filter((t) => t.non_compliant + t.risky > 0).length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Top Areas of Concern</h3>
                    <div className="space-y-2">
                      {summary.topicBreakdown
                        .filter((t) => t.non_compliant + t.risky > 0)
                        .slice(0, 6)
                        .map((t) => (
                          <div key={t.topic} className="flex items-center gap-3">
                            <span className="w-36 truncate text-xs text-[var(--foreground)]">{t.topic}</span>
                            <div className="flex flex-1 items-center gap-1">
                              {t.non_compliant > 0 && (
                                <div
                                  className="h-2 rounded-full bg-red-400"
                                  style={{ width: `${Math.max(4, (t.non_compliant / (t.non_compliant + t.risky)) * 60)}%` }}
                                />
                              )}
                              {t.risky > 0 && (
                                <div
                                  className="h-2 rounded-full bg-amber-400"
                                  style={{ width: `${Math.max(4, (t.risky / (t.non_compliant + t.risky)) * 60)}%` }}
                                />
                              )}
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {t.non_compliant > 0 && <span className="text-red-400">{t.non_compliant} </span>}
                              {t.risky > 0 && <span className="text-amber-400">{t.risky}</span>}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Most contravened articles */}
                {summary.mostContravenedArticles.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Most Contravened Articles</h3>
                    <div className="space-y-1.5">
                      {summary.mostContravenedArticles.slice(0, 6).map((a) => (
                        <div key={a.ref} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--muted)]/40 px-3 py-2">
                          <span className="truncate text-xs font-medium text-[var(--foreground)]">{a.ref}</span>
                          <span className="shrink-0 text-xs text-red-400">{a.contractsAffected} contracts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Most problematic */}
              {summary.mostProblematic.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Most Problematic Contracts</h3>
                  <div className="space-y-1.5">
                    {summary.mostProblematic.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          const contract = contracts.find((ct) => ct.id === c.id);
                          if (contract) setSelectedContract(contract);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-left hover:bg-[var(--accent)]"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                        <span className="flex-1 truncate text-xs text-[var(--foreground)]">{c.fileName}</span>
                        <span className="text-xs text-red-400">{c.nonCompliantCount} issues</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contract folders + findings panel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
              {/* Left: folders */}
              <div className="space-y-4">
                {/* Requires Attention */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <button
                    onClick={() => setShowRequiresAttention((v) => !v)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[var(--accent)]"
                  >
                    {showRequiresAttention ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                      Requires Attention
                    </span>
                    <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-semibold text-red-400">
                      {requiresAttention.length}
                    </span>
                  </button>
                  {showRequiresAttention && (
                    <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                      {requiresAttention.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedContract(c)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--accent)] ${selectedContract?.id === c.id ? "bg-[var(--accent)]" : ""}`}
                        >
                          {STATUS_ICON[c.contract_status as ContractStatus] || STATUS_ICON.risky}
                          <span className="flex-1 truncate text-xs text-[var(--foreground)]">{c.file_name}</span>
                          {(c.noncompliant_count || 0) > 0 && (
                            <span className="text-xs text-red-400">{c.noncompliant_count}</span>
                          )}
                        </button>
                      ))}
                      {requiresAttention.length === 0 && (
                        <p className="px-4 py-3 text-xs text-[var(--muted-foreground)]">No issues found.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Compliant */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <button
                    onClick={() => setShowCompliantFolder((v) => !v)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[var(--accent)]"
                  >
                    {showCompliantFolder ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="flex-1 text-sm font-medium text-[var(--foreground)]">Compliant</span>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                      {compliantContracts.length}
                    </span>
                  </button>
                  {showCompliantFolder && (
                    <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                      {compliantContracts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedContract(c)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--accent)] ${selectedContract?.id === c.id ? "bg-[var(--accent)]" : ""}`}
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="flex-1 truncate text-xs text-[var(--foreground)]">{c.file_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: findings panel */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                {selectedContract ? (
                  <ContractFindingsPanel contract={selectedContract} jobId={jobId} />
                ) : (
                  <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                    <FileText className="h-8 w-8 text-[var(--muted-foreground)] mb-3" />
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Select a contract to view its findings
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Still loading summary after complete */}
        {isComplete && !summary && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}
      </div>
    </div>
  );
}

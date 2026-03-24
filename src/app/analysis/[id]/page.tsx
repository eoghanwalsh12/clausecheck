"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  Shield,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskBadge } from "@/components/risk-badge";
import { ClauseCard } from "@/components/clause-card";
import type { ContractAnalysis, RiskLevel } from "@/lib/types";

const riskColors: Record<RiskLevel, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-orange-600 dark:text-orange-400",
  critical: "text-red-600 dark:text-red-400",
};

const riskBarColors: Record<RiskLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [filter, setFilter] = useState<RiskLevel | "all">("all");

  useEffect(() => {
    const id = params.id as string;
    const stored = sessionStorage.getItem(`analysis-${id}`);
    if (stored) {
      setAnalysis(JSON.parse(stored));
    }
  }, [params.id]);

  if (!analysis) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[var(--muted-foreground)]">
          Analysis not found. Please upload a contract first.
        </p>
      </div>
    );
  }

  const filteredClauses =
    filter === "all"
      ? analysis.clauses
      : analysis.clauses.filter((c) => c.riskLevel === filter);

  const riskCounts = analysis.clauses.reduce(
    (acc, c) => {
      acc[c.riskLevel] = (acc[c.riskLevel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleSaveDashboard = () => {
    const existing = JSON.parse(
      localStorage.getItem("clausecheck-history") || "[]"
    );
    const summary = {
      id: analysis.id,
      fileName: analysis.fileName,
      contractType: analysis.contractType,
      overallRiskScore: analysis.overallRiskScore,
      overallRiskLevel: analysis.overallRiskLevel,
      clauseCount: analysis.clauses.length,
      createdAt: analysis.createdAt,
    };
    const updated = [summary, ...existing.filter((e: { id: string }) => e.id !== analysis.id)];
    localStorage.setItem("clausecheck-history", JSON.stringify(updated));
    // Also persist the full analysis
    localStorage.setItem(`analysis-full-${analysis.id}`, JSON.stringify(analysis));
    alert("Saved to dashboard!");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <button
        onClick={() => router.push("/upload")}
        className="mb-6 flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Upload another
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contract Analysis</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {analysis.fileName}
          </p>
        </div>
        <button
          onClick={handleSaveDashboard}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)]"
        >
          <Download className="h-4 w-4" />
          Save
        </button>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <FileText className="h-4 w-4" />
            Type
          </div>
          <p className="mt-1 font-semibold">{analysis.contractType}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Users className="h-4 w-4" />
            Parties
          </div>
          <p className="mt-1 font-semibold">
            {analysis.parties.length > 0
              ? analysis.parties.join(", ")
              : "Not identified"}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Calendar className="h-4 w-4" />
            Date
          </div>
          <p className="mt-1 font-semibold">
            {analysis.effectiveDate || "Not stated"}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Shield className="h-4 w-4" />
            Risk Score
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                "text-xl font-bold",
                riskColors[analysis.overallRiskLevel]
              )}
            >
              {analysis.overallRiskScore}/10
            </span>
            <RiskBadge level={analysis.overallRiskLevel} />
          </div>
        </div>
      </div>

      {/* Risk Bar */}
      <div className="mb-8">
        <div className="flex h-2 overflow-hidden rounded-full bg-[var(--muted)]">
          {(["low", "medium", "high", "critical"] as RiskLevel[]).map(
            (level) =>
              riskCounts[level] && (
                <div
                  key={level}
                  className={cn("h-full", riskBarColors[level])}
                  style={{
                    width: `${(riskCounts[level] / analysis.clauses.length) * 100}%`,
                  }}
                />
              )
          )}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-[var(--muted-foreground)]">
          {(["low", "medium", "high", "critical"] as RiskLevel[]).map(
            (level) =>
              riskCounts[level] && (
                <span key={level} className="flex items-center gap-1">
                  <span
                    className={cn("inline-block h-2 w-2 rounded-full", riskBarColors[level])}
                  />
                  {riskCounts[level]} {level}
                </span>
              )
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-2 font-semibold">Executive Summary</h2>
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          {analysis.executiveSummary}
        </p>
      </div>

      {/* Missing Clauses */}
      {analysis.missingClauses.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Missing Clauses
          </h2>
          <ul className="space-y-1">
            {analysis.missingClauses.map((mc, i) => (
              <li
                key={i}
                className="text-sm text-amber-800 dark:text-amber-300"
              >
                &bull; {mc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clause Filter */}
      <div className="mb-4 flex items-center gap-2">
        <p className="text-sm font-medium">Filter:</p>
        {(["all", "critical", "high", "medium", "low"] as const).map(
          (level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === level
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              )}
            >
              {level === "all" ? `All (${analysis.clauses.length})` : `${level.charAt(0).toUpperCase() + level.slice(1)} (${riskCounts[level] || 0})`}
            </button>
          )
        )}
      </div>

      {/* Clauses */}
      <div className="space-y-3 pb-16">
        {filteredClauses.map((clause, i) => (
          <ClauseCard key={i} clause={clause} />
        ))}
        {filteredClauses.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No clauses at this risk level.
          </p>
        )}
      </div>
    </div>
  );
}

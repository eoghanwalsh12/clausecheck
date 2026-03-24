"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskBadge } from "@/components/risk-badge";
import type { RiskLevel } from "@/lib/types";

interface HistoryItem {
  id: string;
  fileName: string;
  contractType: string;
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  clauseCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("clausecheck-history") || "[]"
    );
    setHistory(stored);
  }, []);

  const handleDelete = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem("clausecheck-history", JSON.stringify(updated));
    localStorage.removeItem(`analysis-full-${id}`);
  };

  const handleView = (id: string) => {
    // Move from localStorage to sessionStorage so the analysis page can find it
    const full = localStorage.getItem(`analysis-full-${id}`);
    if (full) {
      sessionStorage.setItem(`analysis-${id}`, full);
      router.push(`/analysis/${id}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Your saved contract analyses.
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          New Analysis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-[var(--border)] py-16">
          <FileText className="mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="font-medium">No analyses yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Upload a contract and save the analysis to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <button
                onClick={() => handleView(item.id)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--muted)]">
                  <FileText className="h-5 w-5 text-[var(--muted-foreground)]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.fileName}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span>{item.contractType}</span>
                    <span>&bull;</span>
                    <span>{item.clauseCount} clauses</span>
                    <span>&bull;</span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-lg font-bold",
                      item.overallRiskLevel === "low" && "text-emerald-600",
                      item.overallRiskLevel === "medium" && "text-amber-600",
                      item.overallRiskLevel === "high" && "text-orange-600",
                      item.overallRiskLevel === "critical" && "text-red-600"
                    )}
                  >
                    {item.overallRiskScore}/10
                  </span>
                  <RiskBadge level={item.overallRiskLevel} />
                </div>
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="ml-4 rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--destructive)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

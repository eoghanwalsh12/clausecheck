"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { RiskBadge } from "./risk-badge";
import type { Clause } from "@/lib/types";

export function ClauseCard({ clause }: { clause: Clause }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAlternative = async () => {
    if (!clause.suggestedAlternative) return;
    await navigator.clipboard.writeText(clause.suggestedAlternative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <RiskBadge level={clause.riskLevel} />
          <div>
            <p className="font-medium">{clause.title}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {clause.category}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-[var(--border)] p-4">
          {/* Original Text */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              Original Text
            </p>
            <p className="rounded-lg bg-[var(--muted)] p-3 text-sm leading-relaxed">
              {clause.originalText}
            </p>
          </div>

          {/* Plain English */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              Plain English
            </p>
            <p className="text-sm leading-relaxed">{clause.plainEnglish}</p>
          </div>

          {/* Risk Explanation */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              Risk Assessment
            </p>
            <p className="text-sm leading-relaxed">{clause.riskExplanation}</p>
          </div>

          {/* Suggested Alternative */}
          {clause.suggestedAlternative && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Suggested Alternative
                </p>
                <button
                  onClick={copyAlternative}
                  className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed dark:border-emerald-800 dark:bg-emerald-900/20">
                {clause.suggestedAlternative}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

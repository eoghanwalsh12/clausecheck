"use client";

import {
  Shield,
  Target,
  Scale,
  FileText,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onAction: (prompt: string) => void;
  compact?: boolean;
}

const ACTIONS = [
  {
    label: "Risk Assessment",
    icon: Shield,
    prompt:
      "Provide a comprehensive risk assessment of this document. Identify all clauses that pose risks to my position, rank them by severity, and explain the real-world consequences of each risk. Include specific clause references.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    label: "Opportunities",
    icon: Lightbulb,
    prompt:
      "Identify opportunities and favourable terms in this document from my position. What clauses work in my favour? Are there any provisions I should leverage or build upon in negotiations?",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    label: "Negotiation Points",
    icon: Target,
    prompt:
      "List the key areas I should negotiate in this document. For each point, explain why it matters, what the current language says, and suggest specific alternative wording that would better protect my interests while remaining fair and reasonable.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    label: "Plain English Summary",
    icon: FileText,
    prompt:
      "Provide a plain English summary of this entire document. Break it down section by section, explaining what each part means in simple terms. Highlight anything unusual or non-standard.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Missing Protections",
    icon: AlertTriangle,
    prompt:
      "What standard protections or clauses are missing from this document that I should insist on? For each missing item, explain why it matters and suggest language that should be added.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    label: "Obligations & Deadlines",
    icon: Scale,
    prompt:
      "List all obligations, responsibilities, and deadlines that apply to me under this document. Include payment terms, notice periods, performance requirements, and any conditions I must meet. Organise them by timeline or priority.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

export default function QuickActions({ onAction, compact }: QuickActionsProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-[var(--muted-foreground)] transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <action.icon className={cn("h-3 w-3", action.color)} />
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onAction(action.prompt)}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left text-xs transition-all hover:border-[var(--primary)]/30 hover:bg-[var(--accent)]"
        >
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", action.bg)}>
            <action.icon className={cn("h-3.5 w-3.5", action.color)} />
          </div>
          <span className="text-[var(--foreground)]">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

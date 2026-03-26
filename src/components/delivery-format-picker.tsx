"use client";

import {
  Mail,
  FileText,
  FileCheck,
  Presentation,
  Scale,
  Swords,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliverableAudience, DeliverableFormat } from "@/lib/types";

interface DeliveryFormatPickerProps {
  audience: DeliverableAudience;
  onSelect: (format: DeliverableFormat) => void;
  onBack: () => void;
}

const formats: {
  id: DeliverableFormat;
  title: string;
  description: string;
  icon: typeof Mail;
}[] = [
  {
    id: "client_email",
    title: "Client Email",
    description: "Concise advisory email summarising key findings and next steps",
    icon: Mail,
  },
  {
    id: "written_report",
    title: "Written Report",
    description: "Comprehensive legal report with executive summary, analysis, and recommendations",
    icon: FileText,
  },
  {
    id: "annotated_document",
    title: "Annotated Document",
    description: "Clause-by-clause review with risk ratings, commentary, and suggested amendments",
    icon: FileCheck,
  },
  {
    id: "presentation_outline",
    title: "Presentation Outline",
    description: "Slide-by-slide outline with bullet points and speaker notes",
    icon: Presentation,
  },
  {
    id: "letter_of_advice",
    title: "Letter of Advice",
    description: "Formal legal letter with structured analysis and clear recommendations",
    icon: Scale,
  },
  {
    id: "negotiation_playbook",
    title: "Negotiation Playbook",
    description: "Strategic playbook with ideal positions, fallbacks, and redline language",
    icon: Swords,
  },
  {
    id: "risk_register",
    title: "Risk Register",
    description: "Structured risk table with likelihood, impact, scores, and mitigations",
    icon: ShieldAlert,
  },
];

export default function DeliveryFormatPicker({
  audience,
  onSelect,
  onBack,
}: DeliveryFormatPickerProps) {
  return (
    <div className="flex flex-col h-full px-8 py-6 overflow-auto">
      <div className="max-w-2xl w-full mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
        >
          &larr; Change audience
        </button>

        <h2 className="text-xl font-semibold mb-1">
          Select delivery format
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Delivering for:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {audience === "client" ? "Client (External)" : "Partner (Internal)"}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => onSelect(format.id)}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-left transition-all",
                  "hover:border-[var(--foreground)] hover:shadow-md"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{format.title}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mt-0.5">
                    {format.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

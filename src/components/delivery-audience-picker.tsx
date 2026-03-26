"use client";

import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliverableAudience } from "@/lib/types";

interface DeliveryAudiencePickerProps {
  onSelect: (audience: DeliverableAudience) => void;
}

const audiences: {
  id: DeliverableAudience;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Users;
}[] = [
  {
    id: "client",
    title: "Client",
    subtitle: "External",
    description: "Polished, formal communication for the client. Professional tone with clear advice and recommendations.",
    icon: Users,
  },
  {
    id: "partner",
    title: "Partner",
    subtitle: "Internal",
    description: "Candid, strategic analysis for colleagues. Includes risk assessments, tactical recommendations, and honest evaluations.",
    icon: Building2,
  },
];

export default function DeliveryAudiencePicker({ onSelect }: DeliveryAudiencePickerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="max-w-lg w-full">
        <h2 className="text-xl font-semibold text-center mb-2">
          Who is this for?
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] text-center mb-8">
          Select the intended audience to tailor the tone and content
        </p>

        <div className="grid grid-cols-2 gap-4">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <button
                key={audience.id}
                onClick={() => onSelect(audience.id)}
                className={cn(
                  "group flex flex-col items-start rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-6 text-left transition-all",
                  "hover:border-[var(--foreground)] hover:shadow-lg"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] mb-4 group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{audience.title}</h3>
                <span className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                  {audience.subtitle}
                </span>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {audience.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

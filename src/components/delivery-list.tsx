"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  FileText,
  FileCheck,
  Presentation,
  Scale,
  Swords,
  ShieldAlert,
  Trash2,
  Clock,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { DeliverableFormat, DeliverableAudience } from "@/lib/types";

interface DeliverableListItem {
  id: string;
  title: string;
  audience: DeliverableAudience;
  format: DeliverableFormat;
  created_at: string;
  updated_at: string;
}

interface DeliveryListProps {
  projectId: string;
  onSelect: (id: string) => void;
  refreshKey?: number;
}

const FORMAT_ICONS: Record<DeliverableFormat, typeof Mail> = {
  client_email: Mail,
  written_report: FileText,
  annotated_document: FileCheck,
  presentation_outline: Presentation,
  letter_of_advice: Scale,
  negotiation_playbook: Swords,
  risk_register: ShieldAlert,
};

const FORMAT_LABELS: Record<DeliverableFormat, string> = {
  client_email: "Email",
  written_report: "Report",
  annotated_document: "Annotated",
  presentation_outline: "Presentation",
  letter_of_advice: "Letter",
  negotiation_playbook: "Playbook",
  risk_register: "Risk Register",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DeliveryList({ projectId, onSelect, refreshKey }: DeliveryListProps) {
  const [items, setItems] = useState<DeliverableListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDeliverables = useCallback(async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`/api/deliverables?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDeliverables();
  }, [loadDeliverables, refreshKey]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!confirm("Delete this deliverable?")) return;

      setDeletingId(id);
      try {
        const session = (await supabase.auth.getSession()).data.session;
        await fetch(`/api/deliverables/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch {
        // ignore
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="border-t border-[var(--border)] mt-6 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
        <h3 className="text-sm font-semibold">Previous Deliverables</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = FORMAT_ICONS[item.format];
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left transition-all",
                "hover:border-[var(--muted-foreground)] hover:shadow-sm"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]">
                <Icon className="h-4 w-4 text-[var(--accent-foreground)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                    {item.audience === "client" ? "Client" : "Partner"}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {FORMAT_LABELS[item.format]}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                    <Clock className="h-2.5 w-2.5" />
                    {timeAgo(item.updated_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, item.id)}
                disabled={deletingId === item.id}
                className="shrink-0 rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--destructive)] transition-colors"
                title="Delete"
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
}

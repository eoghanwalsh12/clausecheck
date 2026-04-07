"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Matter, MatterType } from "@/lib/types";

interface Props {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onCreated: (matter: Matter) => void;
  getToken: () => Promise<string | undefined>;
}

const MATTER_TYPES: { value: MatterType; label: string; description: string }[] = [
  { value: "analysis", label: "Contract Analysis", description: "Review and analyse individual contracts" },
  { value: "due_diligence", label: "Due Diligence", description: "Multi-document review for transactions" },
  { value: "compliance_check", label: "Compliance Check", description: "Bulk-check contracts against legislation" },
];

export default function CreateMatterModal({ clientId, clientName, onClose, onCreated, getToken }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [matterType, setMatterType] = useState<MatterType>("analysis");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");

    try {
      const token = await getToken();
      const res = await fetch("/api/matters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientId, name, description, matterType }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create matter");
      }

      const { id } = await res.json();
      onCreated({
        id,
        client_id: clientId,
        user_id: "",
        name: name.trim(),
        description: description.trim() || undefined,
        matter_type: matterType,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_count: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create matter");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              New Matter
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Matter Name *
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q1 Supplier Contracts Review"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Matter Type
            </label>
            <div className="space-y-2">
              {MATTER_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    matterType === type.value
                      ? "border-[var(--primary)]/40 bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:bg-[var(--accent)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="matterType"
                    value={type.value}
                    checked={matterType === type.value}
                    onChange={() => setMatterType(type.value)}
                    className="mt-0.5 accent-[var(--primary)]"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-[var(--foreground)]">{type.label}</span>
                    <p className="text-xs text-[var(--muted-foreground)]">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context for this matter…"
              rows={2}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Matter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

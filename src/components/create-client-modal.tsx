"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Client } from "@/lib/types";

interface Props {
  onClose: () => void;
  onCreated: (client: Client) => void;
  getToken: () => Promise<string | undefined>;
}

export default function CreateClientModal({ onClose, onCreated, getToken }: Props) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");

    try {
      const token = await getToken();
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, contactName, companyType, notes }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create client");
      }

      const { id } = await res.json();
      onCreated({
        id,
        user_id: "",
        name: name.trim(),
        contact_name: contactName.trim() || undefined,
        company_type: companyType.trim() || undefined,
        notes: notes.trim() || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        matter_count: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            New Client
          </h2>
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
              Client Name *
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Contact Name
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Company Type
            </label>
            <input
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value)}
              placeholder="e.g. Technology, Real Estate, Finance"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any relevant context…"
              rows={3}
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
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

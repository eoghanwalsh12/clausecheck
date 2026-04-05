"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DeliveryAudiencePicker from "./delivery-audience-picker";
import DeliveryFormatPicker from "./delivery-format-picker";
import DeliveryEditor from "./delivery-editor";
import DeliveryList from "./delivery-list";
import type { DeliverableAudience, DeliverableFormat } from "@/lib/types";

type Step = "audience" | "format" | "editor";

interface DeliveryPanelProps {
  projectId: string;
}

export default function DeliveryPanel({ projectId }: DeliveryPanelProps) {
  const [step, setStep] = useState<Step>("audience");
  const [audience, setAudience] = useState<DeliverableAudience | null>(null);
  const [format, setFormat] = useState<DeliverableFormat | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading an existing deliverable
  const [loadingDeliverableId, setLoadingDeliverableId] = useState<string | null>(null);
  const [loadedContent, setLoadedContent] = useState<string | null>(null);
  const [loadedTitle, setLoadedTitle] = useState<string | null>(null);
  const [loadedDeliverableId, setLoadedDeliverableId] = useState<string | null>(null);

  // Hamburger menu for saved deliverables
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const handleAudienceSelect = useCallback((a: DeliverableAudience) => {
    setAudience(a);
    setStep("format");
  }, []);

  const handleFormatSelect = useCallback((f: DeliverableFormat) => {
    setFormat(f);
    setLoadedContent(null);
    setLoadedTitle(null);
    setLoadedDeliverableId(null);
    setStep("editor");
  }, []);

  const handleBackToAudience = useCallback(() => {
    setAudience(null);
    setStep("audience");
  }, []);

  const handleBackFromEditor = useCallback(() => {
    if (loadedDeliverableId) {
      setLoadedContent(null);
      setLoadedTitle(null);
      setLoadedDeliverableId(null);
      setFormat(null);
      setAudience(null);
      setStep("audience");
    } else {
      setFormat(null);
      setStep("format");
    }
    setRefreshKey((k) => k + 1);
  }, [loadedDeliverableId]);

  // Load existing deliverable from the menu
  const handleSelectExisting = useCallback(async (id: string) => {
    setShowMenu(false);
    setLoadingDeliverableId(id);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`/api/deliverables/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAudience(data.audience);
        setFormat(data.format);
        setLoadedContent(data.content);
        setLoadedTitle(data.title);
        setLoadedDeliverableId(data.id);
        setStep("editor");
      }
    } catch {
      // ignore
    } finally {
      setLoadingDeliverableId(null);
    }
  }, []);

  const stepLabel =
    step === "audience"
      ? "New deliverable"
      : step === "format" && audience
        ? `${audience === "client" ? "Client" : "Partner"} \u203a Format`
        : "Editing";

  return (
    <div className="flex h-full flex-col">
      {/* Header with hamburger menu */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--muted-foreground)] truncate">
          {stepLabel}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
            title="Saved deliverables"
          >
            <Menu className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-80 max-h-[70vh] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg z-30">
              <DeliveryList
                projectId={projectId}
                onSelect={handleSelectExisting}
                refreshKey={refreshKey}
                variant="menu"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {step === "audience" && (
          <div className="h-full overflow-auto py-6">
            <DeliveryAudiencePicker onSelect={handleAudienceSelect} />
          </div>
        )}

        {step === "format" && audience && (
          <DeliveryFormatPicker
            audience={audience}
            onSelect={handleFormatSelect}
            onBack={handleBackToAudience}
          />
        )}

        {step === "editor" && audience && format && (
          <DeliveryEditor
            projectId={projectId}
            audience={audience}
            format={format}
            deliverableId={loadedDeliverableId}
            initialContent={loadedContent || undefined}
            initialTitle={loadedTitle || undefined}
            onBack={handleBackFromEditor}
            onSaved={(id) => {
              setLoadedDeliverableId(id);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}

        {loadingDeliverableId && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20">
            <div className="bg-[var(--card)] rounded-lg px-4 py-3 shadow-lg text-sm flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent" />
              Loading deliverable...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

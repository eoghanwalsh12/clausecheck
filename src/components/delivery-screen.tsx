"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import DeliveryAudiencePicker from "./delivery-audience-picker";
import DeliveryFormatPicker from "./delivery-format-picker";
import DeliveryEditor from "./delivery-editor";
import DeliveryList from "./delivery-list";
import type { DeliverableAudience, DeliverableFormat } from "@/lib/types";

type DeliveryStep = "audience" | "format" | "editor";

interface DeliveryScreenProps {
  projectId: string;
  onClose: () => void;
}

export default function DeliveryScreen({ projectId, onClose }: DeliveryScreenProps) {
  const [step, setStep] = useState<DeliveryStep>("audience");
  const [audience, setAudience] = useState<DeliverableAudience | null>(null);
  const [format, setFormat] = useState<DeliverableFormat | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading an existing deliverable
  const [loadingDeliverableId, setLoadingDeliverableId] = useState<string | null>(null);
  const [loadedContent, setLoadedContent] = useState<string | null>(null);
  const [loadedTitle, setLoadedTitle] = useState<string | null>(null);
  const [loadedDeliverableId, setLoadedDeliverableId] = useState<string | null>(null);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(onClose, 400);
  }, [onClose]);

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
      // Came from list, go back to audience selection
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

  // Load existing deliverable
  const handleSelectExisting = useCallback(async (id: string) => {
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

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex transition-all duration-400 ease-in-out",
        isVisible && !isClosing ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop with document fold effect */}
      <div
        className={cn(
          "absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-400",
          isVisible && !isClosing ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Document fold animation overlay */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-all duration-500 ease-in-out",
          isVisible && !isClosing
            ? "opacity-0"
            : "opacity-100"
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-1/2 bg-[var(--card)] transition-transform duration-500 ease-in-out origin-right",
            isVisible && !isClosing
              ? "[transform:rotateY(-90deg)] opacity-0"
              : "[transform:rotateY(0deg)]"
          )}
          style={{ perspective: "1000px" }}
        />
      </div>

      {/* Main delivery panel — slides in from right */}
      <div
        className={cn(
          "relative ml-auto h-full bg-[var(--background)] shadow-2xl transition-transform duration-400 ease-out flex flex-col",
          "w-full md:w-[80%] lg:w-[70%] xl:w-[60%]",
          isVisible && !isClosing
            ? "translate-x-0"
            : "translate-x-full"
        )}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">Delivery</h1>
            {step !== "audience" && audience && (
              <span className="text-xs text-[var(--muted-foreground)]">
                &rsaquo; {audience === "client" ? "Client" : "Partner"}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
            title="Close delivery"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {step === "audience" && (
            <div className="h-full overflow-auto">
              <DeliveryAudiencePicker onSelect={handleAudienceSelect} />
              <div className="px-8 pb-8 max-w-lg mx-auto">
                <DeliveryList
                  projectId={projectId}
                  onSelect={handleSelectExisting}
                  refreshKey={refreshKey}
                />
                {loadingDeliverableId && (
                  <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
                    <div className="bg-[var(--card)] rounded-lg px-4 py-3 shadow-lg text-sm flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent" />
                      Loading deliverable...
                    </div>
                  </div>
                )}
              </div>
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
        </div>
      </div>
    </div>
  );
}

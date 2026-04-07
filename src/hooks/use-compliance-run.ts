"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { chunkText } from "@/lib/chunk-text";
import type { ComplianceDocument, ComplianceRequirement } from "@/lib/types";

export type RunPhase = "idle" | "uploading" | "extracting" | "analysing" | "complete" | "error";

export interface ContractProgress {
  id: string;
  fileName: string;
  status: "pending" | "processing" | "done" | "error";
  contractStatus?: string;
  nonCompliantCount?: number;
  riskyCount?: number;
}

interface UseComplianceRunOptions {
  jobId: string;
  onComplete?: () => void;
}

interface RunResult {
  phase: RunPhase;
  phaseLabel: string;
  contractProgress: ContractProgress[];
  requirementsCount: number;
  error: string | null;
  startRun: (
    legislationDocs: ComplianceDocument[],
    contractDocs: ComplianceDocument[],
    legislationName: string
  ) => Promise<void>;
  isRunning: boolean;
}

async function getToken(): Promise<string> {
  return (await supabase.auth.getSession()).data.session?.access_token ?? "";
}

async function apiFetch(url: string, body: unknown): Promise<Response> {
  const token = await getToken();
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export function useComplianceRun({ jobId, onComplete }: UseComplianceRunOptions): RunResult {
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [phaseLabel, setPhaseLabel] = useState("");
  const [contractProgress, setContractProgress] = useState<ContractProgress[]>([]);
  const [requirementsCount, setRequirementsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isRunningRef = useRef(false);

  const updateContract = useCallback(
    (id: string, update: Partial<ContractProgress>) => {
      setContractProgress((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...update } : c))
      );
    },
    []
  );

  const startRun = useCallback(
    async (
      legislationDocs: ComplianceDocument[],
      contractDocs: ComplianceDocument[],
      legislationName: string
    ) => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      setPhase("extracting");
      setError(null);

      // Initialise contract progress list
      const pendingContracts = contractDocs.filter((d) => d.status === "pending");
      setContractProgress(
        pendingContracts.map((d) => ({
          id: d.id,
          fileName: d.file_name,
          status: "pending",
        }))
      );

      try {
        // ── PHASE 1: Extract requirements from legislation ──────────────
        const allRequirements: ComplianceRequirement[] = [];

        for (const legDoc of legislationDocs) {
          setPhaseLabel(`Extracting requirements from ${legDoc.file_name}…`);

          // Read .txt from Storage
          const token = await getToken();
          const { data: blob } = await supabase.storage
            .from("documents")
            .download(`${legDoc.storage_path}.txt`);

          if (!blob) continue;

          const fullText = await blob.text();
          const chunks = chunkText(fullText);

          for (let i = 0; i < chunks.length; i++) {
            setPhaseLabel(
              `Extracting from ${legDoc.file_name}: chunk ${i + 1} of ${chunks.length}…`
            );

            const res = await fetch(`/api/compliance/${jobId}/extract-chunk`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                chunkText: chunks[i].text,
                legislationName,
                heading: chunks[i].heading,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.requirements)) {
                allRequirements.push(...data.requirements);
              }
            }
          }
        }

        // Save requirements
        if (allRequirements.length > 0) {
          setPhaseLabel("Saving extracted requirements…");
          await apiFetch(`/api/compliance/${jobId}/save-requirements`, {
            requirements: allRequirements,
            legislationDocId: legislationDocs[0]?.id || null,
          });
          setRequirementsCount(Math.min(allRequirements.length, 150));
        }

        // ── PHASE 2: Analyse each contract ─────────────────────────────
        setPhase("analysing");

        // Use capped requirements for Pass 2
        const PRIORITY: Record<string, number> = {
          prohibition: 0, obligation: 1, right: 2, procedure: 3, definition: 4,
        };
        const sortedReqs = [...allRequirements].sort((a, b) => {
          const pa = PRIORITY[(a as unknown as Record<string, string>).obligationType ?? ""] ?? 5;
          const pb = PRIORITY[(b as unknown as Record<string, string>).obligationType ?? ""] ?? 5;
          return pa - pb;
        });
        const cappedReqs = sortedReqs.slice(0, 150);

        for (const contract of pendingContracts) {
          setPhaseLabel(`Analysing ${contract.file_name}…`);
          updateContract(contract.id, { status: "processing" });

          const token = await getToken();
          const res = await fetch(`/api/compliance/${jobId}/analyse-contract`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              documentId: contract.id,
              requirements: cappedReqs,
              legislationName,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            updateContract(contract.id, {
              status: "done",
              contractStatus: data.contractStatus,
              nonCompliantCount: data.nonCompliantCount,
              riskyCount: data.riskyCount,
            });
          } else {
            updateContract(contract.id, { status: "error" });
          }
        }

        // Mark job complete
        const token = await getToken();
        await fetch(`/api/compliance/${jobId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "complete" }),
        });

        setPhase("complete");
        setPhaseLabel("Analysis complete");
        onComplete?.();
      } catch (err) {
        console.error("Compliance run error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setPhase("error");
      } finally {
        isRunningRef.current = false;
      }
    },
    [jobId, onComplete, updateContract]
  );

  return {
    phase,
    phaseLabel,
    contractProgress,
    requirementsCount,
    error,
    startRun,
    isRunning: isRunningRef.current,
  };
}

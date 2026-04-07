"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Upload,
  FileText,
  GripVertical,
  PanelRightOpen,
  PanelRightClose,
  UserCheck,
  Minimize2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentContext, UserPosition, ChatMessage } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import WorkspaceSidebar from "@/components/workspace-sidebar";
import PositionSelector from "@/components/position-selector";

const DocumentViewer = dynamic(() => import("@/components/document-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
      Loading viewer...
    </div>
  ),
});

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const projectId = searchParams.get("project");

  const [document, setDocument] = useState<DocumentContext | null>(null);
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(!!projectId);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [highlightText, setHighlightText] = useState<string | null>(null);
  const [activeRefs, setActiveRefs] = useState<string[]>([]);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId);
  const [initialChatHistory, setInitialChatHistory] = useState<ChatMessage[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const freshUploadRef = useRef(false);

  // Load existing project
  useEffect(() => {
    if (!projectId || !user) {
      setIsLoadingProject(false);
      return;
    }
    if (freshUploadRef.current) return;

    const loadProject = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const res = await fetch(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });

        if (!res.ok) {
          setError("Could not load project. It may have been deleted.");
          setIsLoadingProject(false);
          return;
        }

        const project = await res.json();

        let fileUrl = "";
        const storagePath = `${user.id}/${project.id}/${project.file_name}`;
        const { data: signedUrlData } = await supabase.storage
          .from("documents")
          .createSignedUrl(storagePath, 3600);
        if (signedUrlData?.signedUrl) {
          fileUrl = signedUrlData.signedUrl;
        }

        setDocument({
          fileName: project.file_name,
          fileType: project.file_type,
          text: project.document_text,
          fileUrl,
          htmlContent: project.html_content || undefined,
        });

        if (project.position_role) {
          setPosition({
            role: project.position_role,
            customDescription: project.position_description || undefined,
          });
        }

        if (project.chat_history?.length) {
          setInitialChatHistory(project.chat_history);
        }

        setCurrentProjectId(project.id);
      } catch {
        setError("Failed to load project.");
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadProject();
  }, [projectId, user]);

  // Save chat history (debounced)
  const saveChatHistory = useCallback(
    (messages: ChatMessage[]) => {
      if (!currentProjectId || !user) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        const session = (await supabase.auth.getSession()).data.session;
        await fetch(`/api/projects/${currentProjectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ chatHistory: messages }),
        });
      }, 2000);
    },
    [currentProjectId, user]
  );

  const handlePositionSelect = useCallback(
    async (pos: UserPosition) => {
      setPosition(pos);
      setShowPositionSelector(false);

      if (currentProjectId && user) {
        const session = (await supabase.auth.getSession()).data.session;
        await fetch(`/api/projects/${currentProjectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            positionRole: pos.role,
            positionDescription: pos.customDescription || null,
          }),
        });
      }
    },
    [currentProjectId, user]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      setError("");
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const session = (await supabase.auth.getSession()).data.session;
        const response = await fetch("/api/parse", {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to parse document");
        }

        const { text, htmlContent } = await response.json();
        const fileUrl = URL.createObjectURL(file);
        const fileType = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";

        setDocument({
          fileName: file.name,
          fileType: fileType as "pdf" | "docx",
          text,
          fileUrl,
          htmlContent,
        });

        if (user) {
          try {
            const session = (await supabase.auth.getSession()).data.session;
            const res = await fetch("/api/projects", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                fileName: file.name,
                documentText: text,
                htmlContent: htmlContent || null,
                fileType,
              }),
            });
            if (res.ok) {
              const { id } = await res.json();
              setCurrentProjectId(id);
              window.history.replaceState(null, "", `/workspace?project=${id}`);
              const storagePath = `${user.id}/${id}/${file.name}`;
              await supabase.storage
                .from("documents")
                .upload(storagePath, file, { upsert: true });
            }
          } catch {
            console.error("Failed to save project to cloud");
          }
        }

        freshUploadRef.current = true;
        setShowPositionSelector(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load document");
      } finally {
        setIsUploading(false);
      }
    },
    [user]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleTextSelect = useCallback((text: string) => setSelectedText(text), []);
  const handleHighlight = useCallback((text: string) => setHighlightText(text), []);
  const handleExpandRequest = useCallback(() => setSidebarExpanded(true), []);
  const handleActiveRefsChange = useCallback((refs: string[]) => setActiveRefs(refs), []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = startX - ev.clientX;
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const minW = 280;
      const maxW = containerWidth * 0.7;
      setSidebarWidth(Math.min(maxW, Math.max(minW, startWidth + delta)));
      setSidebarExpanded(false);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.document.removeEventListener("mousemove", onMouseMove);
      window.document.removeEventListener("mouseup", onMouseUp);
      window.document.body.style.cursor = "";
      window.document.body.style.userSelect = "";
    };

    window.document.body.style.cursor = "col-resize";
    window.document.body.style.userSelect = "none";
    window.document.addEventListener("mousemove", onMouseMove);
    window.document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

  // Loading state
  if (isLoadingProject) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Loading project...</p>
        </div>
      </div>
    );
  }

  // Upload screen
  if (!document) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center p-6">
        <div
          className="w-full max-w-lg"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center transition-all hover:border-[var(--primary)]/40">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)]">
              <Upload className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <h2
              className="mt-5 text-xl font-semibold"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Open a legal document
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Drop a PDF or Word document here, or click to browse
            </p>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="mt-5 inline-block cursor-pointer rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(196,162,72,0.25)]"
            >
              {isUploading ? "Processing..." : "Choose File"}
            </label>
            {error && (
              <p className="mt-3 text-sm text-[var(--destructive)]">{error}</p>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
            Supports PDF and DOCX · up to 10 MB
            {user
              ? " · Project saved automatically"
              : " · Sign in to save projects"}
          </p>
        </div>
      </div>
    );
  }

  // Workspace
  return (
    <>
      {showPositionSelector && (
        <PositionSelector
          onSelect={handlePositionSelect}
          onSkip={() => setShowPositionSelector(false)}
        />
      )}

      <div ref={containerRef} className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Document panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Legal disclaimer */}
          <div className="flex items-center justify-center gap-1.5 border-b border-[var(--warning)]/15 bg-[var(--warning)]/5 px-4 py-1.5">
            <AlertTriangle className="h-3 w-3 shrink-0 text-[var(--warning)]" />
            <span className="text-xs text-[var(--muted-foreground)]">
              AI output is for informational purposes only and does not constitute legal advice.
            </span>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
              <span className="truncate text-sm font-medium text-[var(--foreground)]">
                {document.fileName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPositionSelector(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-[var(--accent)]",
                  position ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                )}
                title="Change your role"
              >
                <UserCheck className="h-3.5 w-3.5" />
                {position ? position.role : "Set role"}
              </button>
              {sidebarOpen && sidebarExpanded && (
                <button
                  onClick={() => setSidebarExpanded(false)}
                  className="rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]"
                  title="Minimize sidebar"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => {
                  if (sidebarOpen) {
                    setSidebarOpen(false);
                    setSidebarExpanded(false);
                  } else {
                    setSidebarOpen(true);
                  }
                }}
                className="rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]"
                title={sidebarOpen ? "Close assistant" : "Open assistant"}
              >
                {sidebarOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Document viewer */}
          <div className="flex-1 overflow-hidden">
            <DocumentViewer
              fileUrl={document.fileUrl}
              fileType={document.fileType}
              htmlContent={document.htmlContent}
              onTextSelect={handleTextSelect}
              highlightText={highlightText}
              documentText={document.text}
              activeRefs={activeRefs}
            />
          </div>
        </div>

        {/* Resizable divider */}
        {sidebarOpen && (
          <div
            onMouseDown={handleResizeStart}
            className="flex w-1.5 cursor-col-resize items-center justify-center bg-[var(--border)] hover:bg-[var(--primary)]/30 active:bg-[var(--primary)]/50 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
        )}

        {/* Chat sidebar */}
        {sidebarOpen && (
          <div
            className="shrink-0 border-l border-[var(--border)]"
            style={{ width: sidebarExpanded ? "55%" : `${sidebarWidth}px` }}
          >
            <WorkspaceSidebar
              documentText={document.text}
              position={position}
              selectedText={selectedText}
              onClearSelection={() => setSelectedText(null)}
              onHighlight={handleHighlight}
              onExpandRequest={handleExpandRequest}
              onActiveRefsChange={handleActiveRefsChange}
              initialMessages={initialChatHistory}
              onMessagesChange={saveChatHistory}
              projectId={currentProjectId}
              userSignedIn={!!user}
            />
          </div>
        )}
      </div>
    </>
  );
}

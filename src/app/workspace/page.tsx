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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentContext, UserPosition, ChatMessage } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import ChatSidebar from "@/components/chat-sidebar";
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
          <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
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
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [highlightText, setHighlightText] = useState<string | null>(null);
  const [activeRefs, setActiveRefs] = useState<string[]>([]);

  // Project persistence state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    projectId
  );
  const [initialChatHistory, setInitialChatHistory] = useState<ChatMessage[]>(
    []
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing project
  useEffect(() => {
    if (!projectId || !user) {
      setIsLoadingProject(false);
      return;
    }

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

        // Try to get the original file from Supabase Storage
        let fileUrl = "";
        const storagePath = `${user.id}/${project.id}/${project.file_name}`;
        const { data: signedUrlData } = await supabase.storage
          .from("documents")
          .createSignedUrl(storagePath, 3600); // 1 hour expiry
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

  // Save position when it changes
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

        const response = await fetch("/api/parse", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to parse document");
        }

        const { text, htmlContent } = await response.json();

        const fileUrl = URL.createObjectURL(file);
        const fileType = file.name.toLowerCase().endsWith(".pdf")
          ? "pdf"
          : "docx";

        setDocument({
          fileName: file.name,
          fileType: fileType as "pdf" | "docx",
          text,
          fileUrl,
          htmlContent,
        });

        // Save project to Supabase if user is signed in
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
              // Update URL without navigation
              window.history.replaceState(null, "", `/workspace?project=${id}`);

              // Upload original file to Supabase Storage
              const storagePath = `${user.id}/${id}/${file.name}`;
              await supabase.storage
                .from("documents")
                .upload(storagePath, file, { upsert: true });
            }
          } catch {
            // Non-critical — project still works locally
            console.error("Failed to save project to cloud");
          }
        }

        setShowPositionSelector(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
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

  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  const handleHighlight = useCallback((text: string) => {
    setHighlightText(text);
  }, []);

  const handleExpandRequest = useCallback(() => {
    setSidebarExpanded(true);
  }, []);

  const handleActiveRefsChange = useCallback((refs: string[]) => {
    setActiveRefs(refs);
  }, []);

  // Loading state for project load
  if (isLoadingProject) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  // Upload screen
  if (!document) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <div
          className="w-full max-w-lg"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center transition-colors hover:border-[var(--muted-foreground)]">
            <Upload className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
            <h2 className="mt-4 text-lg font-semibold">
              Open a legal document
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
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
              className="mt-4 inline-block cursor-pointer rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
            >
              {isUploading ? "Processing..." : "Choose File"}
            </label>
            {error && (
              <p className="mt-3 text-sm text-[var(--destructive)]">{error}</p>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
            Supports PDF and DOCX files up to 10MB.
            {user
              ? " Your project will be saved automatically."
              : " Sign in to save your projects."}
          </p>
        </div>
      </div>
    );
  }

  // Workspace with document + chat
  return (
    <>
      {showPositionSelector && (
        <PositionSelector
          onSelect={handlePositionSelect}
          onSkip={() => setShowPositionSelector(false)}
        />
      )}

      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Document panel */}
        <div className={cn("flex-1 flex flex-col min-w-0")}>
          {/* Document toolbar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <span className="truncate text-sm font-medium">
                {document.fileName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPositionSelector(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                  position
                    ? "text-[var(--foreground)] hover:bg-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                )}
                title="Change your role"
              >
                <UserCheck className="h-3.5 w-3.5" />
                {position ? position.role : "Set role"}
              </button>
              {sidebarOpen && sidebarExpanded && (
                <button
                  onClick={() => setSidebarExpanded(false)}
                  className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
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
                className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
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
          <div className="flex w-1 cursor-col-resize items-center bg-[var(--border)] hover:bg-[var(--muted-foreground)]/30">
            <GripVertical className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
        )}

        {/* Chat sidebar */}
        {sidebarOpen && (
          <div
            className={cn(
              "shrink-0 border-l border-[var(--border)] transition-all duration-300 ease-in-out",
              sidebarExpanded ? "w-[55%]" : "w-[420px]"
            )}
          >
            <ChatSidebar
              documentText={document.text}
              position={position}
              selectedText={selectedText}
              onClearSelection={() => setSelectedText(null)}
              onHighlight={handleHighlight}
              onExpandRequest={handleExpandRequest}
              onActiveRefsChange={handleActiveRefsChange}
              initialMessages={initialChatHistory}
              onMessagesChange={saveChatHistory}
            />
          </div>
        )}
      </div>
    </>
  );
}

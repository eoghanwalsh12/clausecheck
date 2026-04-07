"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatSidebar from "./chat-sidebar";
import DeliveryPanel from "./delivery-panel";
import type { ChatMessage, UserPosition } from "@/lib/types";

interface WorkspaceSidebarProps {
  documentText: string;
  position: UserPosition | null;
  selectedText: string | null;
  onClearSelection: () => void;
  onHighlight?: (text: string) => void;
  onExpandRequest?: () => void;
  onActiveRefsChange?: (refs: string[]) => void;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  projectId: string | null;
  userSignedIn: boolean;
}

type TabKey = "chat" | "delivery";

export default function WorkspaceSidebar({
  documentText,
  position,
  selectedText,
  onClearSelection,
  onHighlight,
  onExpandRequest,
  onActiveRefsChange,
  initialMessages,
  onMessagesChange,
  projectId,
  userSignedIn,
}: WorkspaceSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("chat");

  const deliveryAvailable = !!projectId && userSignedIn;

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] bg-[var(--card)]">
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2",
            activeTab === "chat"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab("delivery")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2",
            activeTab === "delivery"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <Send className="h-3.5 w-3.5" />
          Delivery
        </button>
      </div>

      {/* Render both panels, hide inactive via CSS to preserve state */}
      <div
        className={cn(
          "flex-1 min-h-0",
          activeTab === "chat" ? "flex flex-col" : "hidden"
        )}
      >
        <ChatSidebar
          documentText={documentText}
          position={position}
          selectedText={selectedText}
          onClearSelection={onClearSelection}
          onHighlight={onHighlight}
          onExpandRequest={onExpandRequest}
          onActiveRefsChange={onActiveRefsChange}
          initialMessages={initialMessages}
          onMessagesChange={onMessagesChange}
        />
      </div>

      <div
        className={cn(
          "flex-1 min-h-0",
          activeTab === "delivery" ? "flex flex-col" : "hidden"
        )}
      >
        {deliveryAvailable ? (
          <DeliveryPanel projectId={projectId!} />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              {!userSignedIn
                ? "Sign in to create deliverables."
                : "Open a project to create deliverables."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

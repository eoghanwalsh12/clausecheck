"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Square, Sparkles, User, Locate } from "lucide-react";
import { cn, extractSectionRefs } from "@/lib/utils";
import type { ChatMessage, UserPosition } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import QuickActions from "./quick-actions";

interface ChatSidebarProps {
  documentText: string;
  position: UserPosition | null;
  selectedText: string | null;
  onClearSelection: () => void;
  onHighlight?: (text: string) => void;
  onExpandRequest?: () => void;
  onActiveRefsChange?: (refs: string[]) => void;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export default function ChatSidebar({
  documentText,
  position,
  selectedText,
  onClearSelection,
  onHighlight,
  onExpandRequest,
  onActiveRefsChange,
  initialMessages,
  onMessagesChange,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Notify parent when messages change (for persistence)
  useEffect(() => {
    if (messages.length > 0) {
      onMessagesChange?.(messages);
    }
  }, [messages, onMessagesChange]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Extract section references from the latest assistant response
  useEffect(() => {
    // Use streaming content if actively streaming, otherwise the latest assistant message
    const content =
      streamingContent ||
      [...messages].reverse().find((m) => m.role === "assistant")?.content;
    if (!content) {
      onActiveRefsChange?.([]);
      return;
    }
    const refs = extractSectionRefs(content);
    onActiveRefsChange?.(refs);
  }, [streamingContent, messages, onActiveRefsChange]);

  // When text is selected in the document, prefill the input
  useEffect(() => {
    if (selectedText) {
      setInput(
        `Regarding this section:\n\n"${selectedText.slice(0, 500)}${selectedText.length > 500 ? "..." : ""}"\n\n`
      );
      inputRef.current?.focus();
    }
  }, [selectedText]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      onClearSelection();
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const session = (await supabase.auth.getSession()).data.session;
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            documentText,
            userRole: position?.role,
            userDescription: position?.customDescription,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to get response");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                fullContent += parsed.text;
                setStreamingContent(fullContent);
              } catch {
                // skip malformed chunks
              }
            }
          }
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullContent,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Sorry, I encountered an error: ${(error as Error).message}. Please try again.`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [documentText, isStreaming, messages, onClearSelection, position]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    if (streamingContent) {
      const partialMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: streamingContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, partialMessage]);
      setStreamingContent("");
    }
    setIsStreaming(false);
  }, [streamingContent]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const handleQuickAction = useCallback(
    (prompt: string) => {
      onExpandRequest?.();
      sendMessage(prompt);
    },
    [sendMessage, onExpandRequest]
  );

  // Custom markdown components with clickable blockquotes
  const markdownComponents = useMemo(
    () => ({
      blockquote: ({
        children,
        ...props
      }: React.ComponentPropsWithoutRef<"blockquote"> & {
        children?: React.ReactNode;
      }) => (
        <blockquote
          onClick={(e: React.MouseEvent<HTMLQuoteElement>) => {
            const text = (
              e.currentTarget as HTMLElement
            ).textContent?.trim();
            if (text && onHighlight) {
              onHighlight(text);
            }
          }}
          title="Click to find in document"
          {...props}
        >
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 mb-0.5 not-italic">
            <Locate className="h-3 w-3" />
            Document reference — click to locate
          </span>
          {children}
        </blockquote>
      ),
    }),
    [onHighlight]
  );

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold">Legal Assistant</h2>
        {position && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Advising as: {position.role}
            {position.customDescription
              ? ` — ${position.customDescription}`
              : ""}
          </p>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Sparkles className="h-8 w-8 text-[var(--muted-foreground)]" />
            <div>
              <p className="text-sm font-medium">Ask me anything about this document</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Or use the quick actions below to get started
              </p>
            </div>
            <QuickActions onAction={handleQuickAction} />
          </div>
        )}

        {!isEmpty && (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-2.5">
                <div
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {msg.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="chat-prose max-w-none text-sm text-[var(--foreground)]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <div className="flex gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="chat-prose max-w-none min-w-0 flex-1 text-sm text-[var(--foreground)]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {streamingContent}
                  </ReactMarkdown>
                  <span className="inline-block h-4 w-1.5 animate-pulse bg-[var(--foreground)]" />
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isStreaming && !streamingContent && (
              <div className="flex gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1 py-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick actions (shown after first message) */}
      {!isEmpty && !isStreaming && (
        <div className="border-t border-[var(--border)] px-4 py-2">
          <QuickActions onAction={handleQuickAction} compact />
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this document..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:ring-1 focus:ring-[var(--ring)]"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="self-end rounded-lg bg-[var(--destructive)] p-2 text-white transition-colors hover:opacity-90"
              title="Stop generating"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="self-end rounded-lg bg-[var(--primary)] p-2 text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-30"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--muted-foreground)]">
          Shift+Enter for new line. AI analysis is not legal advice.
        </p>
      </div>
    </div>
  );
}

"use client";

import { ArrowRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeliveryButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function DeliveryButton({ onClick, disabled }: DeliveryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium transition-all",
        "text-[var(--foreground)] shadow-sm hover:shadow-md hover:border-[var(--muted-foreground)]",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm",
        "dark:bg-[var(--card)] dark:hover:bg-[var(--accent)]"
      )}
      title="Create a deliverable document"
    >
      <Send className="h-3 w-3" />
      Delivery
      <ArrowRight className="h-3 w-3" />
    </button>
  );
}

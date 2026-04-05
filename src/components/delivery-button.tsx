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
        "flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-2.5 py-1 text-xs font-medium transition-all",
        "text-[var(--primary-foreground)] shadow-sm hover:opacity-90 hover:shadow-md",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm"
      )}
      title="Create a deliverable document"
    >
      <Send className="h-3 w-3" />
      Delivery
      <ArrowRight className="h-3 w-3" />
    </button>
  );
}

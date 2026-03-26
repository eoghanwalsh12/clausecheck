"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Supabase sends the token as a hash fragment: #access_token=...&type=signup
    // The JS client auto-exchanges it when we call getSession after the hash is present.
    const handleConfirm = async () => {
      const hash = window.location.hash;
      if (hash) {
        // Supabase client picks up the hash automatically
        const { error } = await supabase.auth.getSession();
        if (error) {
          setStatus("error");
        } else {
          setStatus("success");
        }
      } else {
        // No hash — might be a direct visit or already confirmed
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      }
      requestAnimationFrame(() => setIsVisible(true));
    };

    handleConfirm();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <div
        className={cn(
          "w-full max-w-sm text-center transition-all duration-500",
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        )}
      >
        {status === "verifying" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              Verifying your account...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10">
              <CheckCircle className="h-8 w-8 text-[var(--success)]" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">You&apos;re good to go!</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Your email has been verified. You&apos;re all set to start using ClauseCheck.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => router.push("/workspace")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
              >
                <FileText className="h-4 w-4" />
                Get Started
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                Return to home page
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              We couldn&apos;t verify your account. The link may have expired.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
            >
              Return to home page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

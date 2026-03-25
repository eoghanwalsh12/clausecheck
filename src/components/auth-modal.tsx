"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password);

    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setSignUpSuccess(true);
    } else {
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {mode === "signin"
            ? "Sign in to save and access your projects."
            : "Create an account to save your work."}
        </p>

        {signUpSuccess ? (
          <div className="mt-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20 p-3 text-sm text-[var(--success)]">
            Check your email to confirm your account, then sign in.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSignUpSuccess(false);
                }}
                className="font-medium text-[var(--foreground)] underline underline-offset-2"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setSignUpSuccess(false);
                }}
                className="font-medium text-[var(--foreground)] underline underline-offset-2"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, organisation);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (mode === "signup") {
      setSignUpSuccess(true);
      setLoading(false);
    } else {
      // Sign in success — show welcome message briefly
      setSignInSuccess(true);
      setLoading(false);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 1500);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300",
        isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-black/0"
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg transition-all duration-300",
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-2"
        )}
      >
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute right-3 top-3 rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Sign-in success state */}
        {signInSuccess ? (
          <div className="flex flex-col items-center py-4 auth-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success)]/10">
              <CheckCircle className="h-6 w-6 text-[var(--success)]" />
            </div>
            <h2 className="mt-3 text-lg font-semibold">Welcome back!</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Let&apos;s pick up where you left off.
            </p>
          </div>
        ) : signUpSuccess ? (
          /* Sign-up success state */
          <div className="flex flex-col items-center py-4 auth-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/50">
              <Sparkles className="h-6 w-6 text-indigo-500" />
            </div>
            <h2 className="mt-3 text-lg font-semibold">Thanks for signing up!</h2>
            <p className="mt-1 text-center text-sm text-[var(--muted-foreground)]">
              Check your email to confirm your account, then sign in to get started.
            </p>
            <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
              Let&apos;s get to work.
            </p>
          </div>
        ) : (
          /* Form state */
          <>
            <h2 className="text-lg font-semibold">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {mode === "signin"
                ? "Sign in to save and access your projects."
                : "Create an account to save your work."}
            </p>

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

              {mode === "signup" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className={cn(
                        "mt-1 w-full rounded-lg border bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]",
                        confirmPassword && password !== confirmPassword
                          ? "border-[var(--destructive)]"
                          : "border-[var(--border)]"
                      )}
                      placeholder="Re-enter your password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-1 text-xs text-[var(--destructive)]">
                        Passwords don&apos;t match.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">
                      Organisation
                    </label>
                    <input
                      type="text"
                      value={organisation}
                      onChange={(e) => setOrganisation(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      placeholder="Where do you work?"
                    />
                  </div>
                </>
              )}

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

            <div className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("signup");
                      setError("");
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
                    }}
                    className="font-medium text-[var(--foreground)] underline underline-offset-2"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

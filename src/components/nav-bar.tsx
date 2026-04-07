"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, FolderOpen, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "./auth-modal";

export default function NavBar() {
  const { user, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-full items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Scale className="h-4 w-4 text-[var(--primary)] transition-transform group-hover:rotate-12" />
            <span
              className="text-base font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Clause<span className="text-[var(--primary)]">Check</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {!loading && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Projects
                </Link>
                <Link
                  href="/workspace"
                  className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  New
                </Link>
                <div className="h-4 w-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--muted-foreground)]">
                  {user.email}
                </span>
                <Link
                  href="/account"
                  className="rounded-md p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  title="Account settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="rounded-md p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/workspace"
                  className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                >
                  Open Document
                </Link>
                <button
                  onClick={() => setShowAuth(true)}
                  className="rounded-lg border border-[var(--primary)]/60 bg-[var(--primary)]/10 px-4 py-1.5 text-sm font-medium text-[var(--primary)] transition-all hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
                >
                  Sign In
                </button>
              </>
            ) : null}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}

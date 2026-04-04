"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "cc_cookie_notice_dismissed";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          This site uses strictly necessary cookies to keep you signed in. We do
          not use advertising or tracking cookies. See our{" "}
          <a href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </a>
          .
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md bg-[var(--primary)] px-4 py-1.5 text-xs font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
        >
          Understood
        </button>
      </div>
    </div>
  );
}

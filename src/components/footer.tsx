import Link from "next/link";
import { Scale } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-3.5 w-3.5 text-[var(--primary)]" />
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Clause<span className="text-[var(--primary)]">Check</span>
            </span>
          </div>

          <p className="text-xs text-[var(--muted-foreground)] sm:text-center">
            Not a law firm. AI output is not legal advice.
          </p>

          <div className="flex items-center gap-5 text-xs text-[var(--muted-foreground)]">
            <Link href="/privacy" className="transition-colors hover:text-[var(--foreground)]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[var(--foreground)]">
              Terms
            </Link>
            <Link href="/dpa" className="transition-colors hover:text-[var(--foreground)]">
              DPA
            </Link>
            <a
              href="mailto:clausecheckprivacy@gmail.com"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

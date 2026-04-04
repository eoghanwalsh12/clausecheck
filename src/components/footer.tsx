import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-white/60 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            ClauseCheck is not a law firm. AI output is not legal advice.
          </p>
          <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
            <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--foreground)] transition-colors">
              Terms of Service
            </Link>
            <Link href="/dpa" className="hover:text-[var(--foreground)] transition-colors">
              DPA
            </Link>
            <a
              href="mailto:clausecheckprivacy@gmail.com"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

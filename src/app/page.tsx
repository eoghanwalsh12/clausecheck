import Link from "next/link";
import {
  Shield,
  FileSearch,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "Clause-by-Clause Breakdown",
    description:
      "Every clause extracted, categorised, and explained in plain English.",
  },
  {
    icon: AlertTriangle,
    title: "Risk Flagging",
    description:
      "Risky or unusual terms highlighted with severity ratings and explanations.",
  },
  {
    icon: Lightbulb,
    title: "Suggested Edits",
    description:
      "Alternative language for problematic clauses, ready to copy and propose.",
  },
  {
    icon: Shield,
    title: "Missing Clause Detection",
    description:
      "Spots standard protections that are absent from your contract.",
  },
];

const steps = [
  { step: "1", title: "Upload", description: "Drop a PDF or DOCX contract" },
  {
    step: "2",
    title: "Analyse",
    description: "AI reviews every clause in seconds",
  },
  {
    step: "3",
    title: "Act",
    description: "Use the risk report to negotiate better terms",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--muted)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
          <CheckCircle className="h-3.5 w-3.5" />
          AI-Powered Contract Review
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight">
          Understand every clause
          <br />
          before you sign
        </h1>
        <p className="mt-4 max-w-xl text-lg text-[var(--muted-foreground)]">
          Upload any contract. Get instant risk analysis, plain-English
          summaries, and suggested edits — in seconds, not days.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            Review a Contract
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
          >
            How It Works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-6 pb-20 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <f.icon className="mb-3 h-5 w-5 text-[var(--muted-foreground)]" />
            <h3 className="mb-1 font-semibold">{f.title}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {f.description}
            </p>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="pb-24">
        <h2 className="mb-10 text-center text-3xl font-bold">How It Works</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
                {s.step}
              </div>
              <h3 className="mb-1 font-semibold">{s.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mb-20 rounded-2xl bg-[var(--primary)] p-12 text-center text-[var(--primary-foreground)]">
        <h2 className="text-3xl font-bold">Stop signing blind</h2>
        <p className="mx-auto mt-3 max-w-md text-sm opacity-80">
          Whether it&apos;s a freelance agreement, lease, NDA, or employment
          contract — know exactly what you&apos;re agreeing to.
        </p>
        <Link
          href="/upload"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--background)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-opacity hover:opacity-90"
        >
          Upload Your First Contract
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

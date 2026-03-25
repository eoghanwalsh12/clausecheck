import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Shield,
  Target,
  Lightbulb,
  Scale,
  ArrowRight,
  Upload,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your AI Legal Assistant
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted-foreground)]">
          Open any legal document and get instant, interactive analysis. Ask
          questions, identify risks, find opportunities, and negotiate better
          terms — all from one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            Open a Document
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-lg font-semibold">
              1
            </div>
            <h3 className="mt-3 font-medium">Upload your document</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Drop any PDF or Word document — contracts, leases, agreements,
              terms of service, or any legal document.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-lg font-semibold">
              2
            </div>
            <h3 className="mt-3 font-medium">Set your position</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Tell the AI who you are in the document — buyer, seller, tenant,
              employee — so analysis is tailored to your interests.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-lg font-semibold">
              3
            </div>
            <h3 className="mt-3 font-medium">Ask anything</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Chat with your AI legal assistant, run risk assessments, or
              highlight any passage to get an instant explanation.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-semibold">
          Built-in quick actions
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Risk Assessment",
              desc: "Identify every clause that could expose you to risk, ranked by severity",
              color: "text-red-500",
            },
            {
              icon: Lightbulb,
              title: "Opportunities",
              desc: "Find favourable terms and provisions you can leverage",
              color: "text-amber-500",
            },
            {
              icon: Target,
              title: "Negotiation Points",
              desc: "Get specific alternative wording to negotiate better terms",
              color: "text-blue-500",
            },
            {
              icon: FileText,
              title: "Plain English",
              desc: "Break down complex legal language into simple terms",
              color: "text-emerald-500",
            },
            {
              icon: Scale,
              title: "Obligations & Deadlines",
              desc: "See everything you are required to do and by when",
              color: "text-purple-500",
            },
            {
              icon: MessageSquare,
              title: "Ask Anything",
              desc: "Highlight any section and ask your assistant to explain or analyse it",
              color: "text-cyan-500",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <feature.icon
                className={`h-5 w-5 shrink-0 mt-0.5 ${feature.color}`}
              />
              <div>
                <h3 className="text-sm font-medium">{feature.title}</h3>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-20 text-center">
        <Link
          href="/workspace"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] underline underline-offset-4 hover:opacity-80"
        >
          Get started — it&apos;s free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

"use client";

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
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user } = useAuth();
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

      {/* Pricing */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-semibold">Simple pricing</h2>
        <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
          Start free. Upgrade when you need more.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col">
            <div>
              <h3 className="font-semibold text-lg">Free</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">£0</span>
                <span className="text-sm text-[var(--muted-foreground)]">/ month</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                For individuals reviewing the occasional contract.
              </p>
            </div>
            <ul className="mt-6 space-y-2.5 flex-1">
              {[
                "3 documents per month",
                "Interactive AI chat",
                "Risk assessment & plain English",
                "1 deliverable per project",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/workspace"
              className="mt-6 block rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-[var(--muted)]"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-[var(--primary)] bg-[var(--card)] p-6 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-medium text-[var(--primary-foreground)]">
              Most popular
            </div>
            <div>
              <h3 className="font-semibold text-lg">Pro</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">£49</span>
                <span className="text-sm text-[var(--muted-foreground)]">/ month</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                For solicitors and small firms reviewing contracts regularly.
              </p>
            </div>
            <ul className="mt-6 space-y-2.5 flex-1">
              {[
                "Unlimited documents",
                "Interactive AI chat",
                "All 6 quick-action analyses",
                "Unlimited deliverables",
                "All 7 deliverable formats",
                "Export to Word & PDF",
                "Priority support",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/workspace"
              className="mt-6 block rounded-lg bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
            >
              Start free trial
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
          No credit card required to start. Cancel any time.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-20 text-center">
        <Link
          href={user ? "/dashboard" : "/workspace"}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] underline underline-offset-4 hover:opacity-80"
        >
          {user ? "Go to your projects" : "Get started — it\u0027s free"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

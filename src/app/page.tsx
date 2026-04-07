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
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">

      {/* Hero */}
      <div className="fade-up text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/8 px-3.5 py-1 text-xs font-medium uppercase tracking-widest text-[var(--primary)]">
          <Scale className="h-3 w-3" />
          AI-Powered Legal Analysis
        </div>

        <h1
          className="text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Every clause,
          <br />
          <span className="text-[var(--primary)]">understood.</span>
        </h1>

        <p className="fade-up fade-up-delay-1 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted-foreground)]">
          Open any legal document and get instant, interactive analysis. Identify
          risks, find opportunities, and negotiate better terms — all from one place.
        </p>

        <div className="fade-up fade-up-delay-2 mt-8 flex items-center justify-center gap-3">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(196,162,72,0.3)]"
          >
            <Upload className="h-4 w-4" />
            Open a Document
          </Link>
          <Link
            href={user ? "/dashboard" : "/workspace"}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--muted-foreground)] transition-all hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
          >
            {user ? "My Projects" : "See how it works"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div className="fade-up fade-up-delay-3 mt-20 flex items-center gap-4">
        <div className="flex-1 border-t border-[var(--border)]" />
        <span className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">How it works</span>
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

      {/* How it works */}
      <div className="fade-up fade-up-delay-4 mt-10 grid grid-cols-1 gap-px sm:grid-cols-3">
        {[
          {
            step: "01",
            title: "Upload your document",
            desc: "Drop any PDF or Word document — contracts, leases, agreements, or any legal document up to 10 MB.",
          },
          {
            step: "02",
            title: "Set your position",
            desc: "Tell the AI who you are — buyer, seller, tenant, employee — so analysis is precisely tailored to your interests.",
          },
          {
            step: "03",
            title: "Ask anything",
            desc: "Chat with your AI legal assistant, run instant risk assessments, or highlight any passage for an explanation.",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <span
              className="block text-3xl font-semibold text-[var(--primary)]/40"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {item.step}
            </span>
            <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mt-20">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex-1 border-t border-[var(--border)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Built-in quick actions</span>
          <div className="flex-1 border-t border-[var(--border)]" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Risk Assessment",
              desc: "Identify every clause that could expose you to risk, ranked by severity",
              accent: "text-red-400",
              bg: "bg-red-500/8",
            },
            {
              icon: Lightbulb,
              title: "Opportunities",
              desc: "Find favourable terms and provisions you can leverage",
              accent: "text-amber-400",
              bg: "bg-amber-500/8",
            },
            {
              icon: Target,
              title: "Negotiation Points",
              desc: "Get specific alternative wording to negotiate better terms",
              accent: "text-blue-400",
              bg: "bg-blue-500/8",
            },
            {
              icon: FileText,
              title: "Plain English",
              desc: "Break down complex legal language into simple, clear terms",
              accent: "text-emerald-400",
              bg: "bg-emerald-500/8",
            },
            {
              icon: Scale,
              title: "Obligations & Deadlines",
              desc: "See everything you are required to do and by when",
              accent: "text-purple-400",
              bg: "bg-purple-500/8",
            },
            {
              icon: MessageSquare,
              title: "Ask Anything",
              desc: "Highlight any section and ask your assistant to explain or analyse it",
              accent: "text-cyan-400",
              bg: "bg-cyan-500/8",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/30"
            >
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${feature.bg}`}>
                <feature.icon className={`h-3.5 w-3.5 ${feature.accent}`} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[var(--foreground)]">{feature.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-20">
        <div className="mb-2 flex items-center gap-4">
          <div className="flex-1 border-t border-[var(--border)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Simple pricing</span>
          <div className="flex-1 border-t border-[var(--border)]" />
        </div>
        <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
          Start free. Upgrade when you need more.
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Free
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">£0</span>
                <span className="text-sm text-[var(--muted-foreground)]">/ month</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                For individuals reviewing the occasional contract.
              </p>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5">
              {[
                "3 documents per month",
                "Interactive AI chat",
                "Risk assessment & plain English",
                "1 deliverable per project",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
                  <span className="text-[var(--muted-foreground)]">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/workspace"
              className="mt-6 block rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-[var(--accent)] hover:border-[var(--primary)]/30"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-xl border-2 border-[var(--primary)]/60 bg-[var(--card)] p-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-semibold text-[var(--primary-foreground)]">
              Most popular
            </div>
            <div>
              <h3
                className="text-lg font-semibold text-[var(--primary)]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Pro
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">£49</span>
                <span className="text-sm text-[var(--muted-foreground)]">/ month</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                For solicitors and small firms reviewing contracts regularly.
              </p>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5">
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
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                  <span className="text-[var(--muted-foreground)]">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/workspace"
              className="mt-6 block rounded-lg bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(196,162,72,0.25)]"
            >
              Start free trial
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
          No credit card required. Cancel any time.
        </p>
      </div>

      {/* Legal disclaimer */}
      <div className="mt-16 flex items-start gap-2 rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
          ClauseCheck is not a law firm and does not provide legal advice. AI output is for informational purposes only. Always consult a qualified solicitor before making legal decisions.
        </p>
      </div>
    </div>
  );
}

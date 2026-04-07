import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/compliance/[jobId]/summary — aggregated dashboard data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    // Verify job ownership
    const { data: job } = await auth.supabase
      .from("compliance_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", auth.user.id)
      .single();

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // All findings for this job
    const { data: findings } = await auth.supabase
      .from("compliance_findings")
      .select("compliance_tier, topic_area, legislation_ref, contract_doc_id")
      .eq("job_id", jobId)
      .eq("user_id", auth.user.id);

    // All contract documents
    const { data: contracts } = await auth.supabase
      .from("compliance_documents")
      .select("id, file_name, contract_status, noncompliant_count, risky_count, compliant_count")
      .eq("job_id", jobId)
      .eq("user_id", auth.user.id)
      .eq("doc_type", "contract")
      .order("noncompliant_count", { ascending: false });

    const f = findings ?? [];

    // Topic area breakdown
    const topicMap: Record<string, { non_compliant: number; risky: number; compliant: number }> = {};
    for (const finding of f) {
      const topic = finding.topic_area || "Other";
      if (!topicMap[topic]) topicMap[topic] = { non_compliant: 0, risky: 0, compliant: 0 };
      if (finding.compliance_tier === "non_compliant") topicMap[topic].non_compliant++;
      else if (finding.compliance_tier === "risky") topicMap[topic].risky++;
      else topicMap[topic].compliant++;
    }
    const topicBreakdown = Object.entries(topicMap)
      .map(([topic, counts]) => ({ topic, ...counts, total: counts.non_compliant + counts.risky }))
      .sort((a, b) => b.total - a.total);

    // Most contravened articles (by contracts affected)
    const articleContractMap: Record<string, Set<string>> = {};
    for (const finding of f) {
      if (finding.compliance_tier === "non_compliant") {
        const ref = finding.legislation_ref;
        if (!articleContractMap[ref]) articleContractMap[ref] = new Set();
        articleContractMap[ref].add(finding.contract_doc_id);
      }
    }
    const mostContravenedArticles = Object.entries(articleContractMap)
      .map(([ref, contracts]) => ({ ref, contractsAffected: contracts.size }))
      .sort((a, b) => b.contractsAffected - a.contractsAffected)
      .slice(0, 10);

    // Most problematic contracts (top 5)
    const mostProblematic = (contracts ?? [])
      .filter((c) => (c.noncompliant_count || 0) > 0)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        fileName: c.file_name,
        nonCompliantCount: c.noncompliant_count,
        riskyCount: c.risky_count,
      }));

    // Tier totals
    const totalNonCompliant = f.filter((x) => x.compliance_tier === "non_compliant").length;
    const totalRisky = f.filter((x) => x.compliance_tier === "risky").length;
    const totalCompliant = f.filter((x) => x.compliance_tier === "compliant").length;

    return NextResponse.json({
      job,
      topicBreakdown,
      mostContravenedArticles,
      mostProblematic,
      totals: { nonCompliant: totalNonCompliant, risky: totalRisky, compliant: totalCompliant },
      contracts: contracts ?? [],
    });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json({ error: safeErrorMessage(error, "Failed to load summary") }, { status: 500 });
  }
}

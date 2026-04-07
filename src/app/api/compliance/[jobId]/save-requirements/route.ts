import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// POST /api/compliance/[jobId]/save-requirements
// Batch-inserts extracted requirements and updates job count
export async function POST(
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
      .select("id")
      .eq("id", jobId)
      .eq("user_id", auth.user.id)
      .single();

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const body = await request.json();
    const { requirements, legislationDocId } = body;

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return NextResponse.json({ error: "requirements array is required" }, { status: 400 });
    }

    // Cap at 150, prioritising prohibitions then obligations
    const PRIORITY = { prohibition: 0, obligation: 1, right: 2, procedure: 3, definition: 4 };
    const sorted = [...requirements].sort((a, b) => {
      const pa = PRIORITY[a.obligationType as keyof typeof PRIORITY] ?? 5;
      const pb = PRIORITY[b.obligationType as keyof typeof PRIORITY] ?? 5;
      return pa - pb;
    });
    const capped = sorted.slice(0, 150);

    const rows = capped.map((r: Record<string, unknown>) => ({
      job_id: jobId,
      user_id: auth.user.id,
      legislation_doc_id: legislationDocId || null,
      article_ref: String(r.articleRef || r.article_ref || ""),
      requirement_text: String(r.requirementText || r.requirement_text || ""),
      obligation_type: r.obligationType || r.obligation_type || null,
    }));

    const { error: insertError } = await auth.supabase
      .from("compliance_requirements")
      .insert(rows);

    if (insertError) throw insertError;

    // Update job with requirement count and status
    await auth.supabase
      .from("compliance_jobs")
      .update({
        requirements_count: capped.length,
        status: "analysing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("user_id", auth.user.id);

    return NextResponse.json({ saved: capped.length });
  } catch (error) {
    console.error("Save requirements error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to save requirements") },
      { status: 500 }
    );
  }
}

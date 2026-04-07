import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/compliance/[jobId]/findings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const contractId = request.nextUrl.searchParams.get("contractId");
    const tier = request.nextUrl.searchParams.get("tier");

    let query = auth.supabase
      .from("compliance_findings")
      .select("*")
      .eq("job_id", jobId)
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: true });

    if (contractId && isValidUUID(contractId)) query = query.eq("contract_doc_id", contractId);
    if (tier) query = query.eq("compliance_tier", tier);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error, "Failed to load findings") }, { status: 500 });
  }
}

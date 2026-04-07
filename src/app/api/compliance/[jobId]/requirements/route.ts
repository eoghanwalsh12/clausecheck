import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/compliance/[jobId]/requirements
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const { data, error } = await auth.supabase
      .from("compliance_requirements")
      .select("*")
      .eq("job_id", jobId)
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error, "Failed to load requirements") }, { status: 500 });
  }
}

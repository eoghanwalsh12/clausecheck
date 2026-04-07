import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/compliance/[jobId]
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
      .from("compliance_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error, "Failed to load job") }, { status: 500 });
  }
}

// PATCH /api/compliance/[jobId] — update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) updates.status = body.status;
    if (body.errorMessage !== undefined) updates.error_message = body.errorMessage;
    if (body.totalContracts !== undefined) updates.total_contracts = body.totalContracts;

    const { error } = await auth.supabase
      .from("compliance_jobs")
      .update(updates)
      .eq("id", jobId)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error, "Failed to update job") }, { status: 500 });
  }
}

// DELETE /api/compliance/[jobId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    // Clean up storage
    const { data: files } = await auth.supabase.storage
      .from("documents")
      .list(`${auth.user.id}/compliance/${jobId}`);

    if (files && files.length > 0) {
      const paths: string[] = [];
      for (const folder of files) {
        const { data: subFiles } = await auth.supabase.storage
          .from("documents")
          .list(`${auth.user.id}/compliance/${jobId}/${folder.name}`);
        if (subFiles) {
          for (const f of subFiles) {
            paths.push(`${auth.user.id}/compliance/${jobId}/${folder.name}/${f.name}`);
          }
        }
      }
      if (paths.length > 0) {
        await auth.supabase.storage.from("documents").remove(paths);
      }
    }

    const { error } = await auth.supabase
      .from("compliance_jobs")
      .delete()
      .eq("id", jobId)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error, "Failed to delete job") }, { status: 500 });
  }
}

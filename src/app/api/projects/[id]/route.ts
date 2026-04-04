import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/projects/[id] — load a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`projects:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { data, error } = await auth.supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to load project") },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] — update project (chat history, position, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`projects:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.chatHistory !== undefined) updates.chat_history = body.chatHistory;
    if (body.positionRole !== undefined) updates.position_role = body.positionRole;
    if (body.positionDescription !== undefined) updates.position_description = body.positionDescription;

    const { error } = await auth.supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to update project") },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] — delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`projects:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    // Get project details for storage cleanup
    const { data: project } = await auth.supabase
      .from("projects")
      .select("file_name")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    const { error } = await auth.supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    // Clean up stored file
    if (project?.file_name) {
      await auth.supabase.storage
        .from("documents")
        .remove([`${auth.user.id}/${id}/${project.file_name}`]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to delete project") },
      { status: 500 }
    );
  }
}

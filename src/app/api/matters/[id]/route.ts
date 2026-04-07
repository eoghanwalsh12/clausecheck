import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/matters/[id] — fetch matter with its projects
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid matter ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`matters:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { data: matter, error: matterError } = await auth.supabase
      .from("matters")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (matterError) throw matterError;
    if (!matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

    const { data: projects, error: projectsError } = await auth.supabase
      .from("projects")
      .select("id, file_name, file_type, position_role, updated_at, created_at")
      .eq("matter_id", id)
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false });

    if (projectsError) throw projectsError;

    return NextResponse.json({ ...matter, projects: projects ?? [] });
  } catch (error) {
    console.error("Get matter error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to load matter") },
      { status: 500 }
    );
  }
}

// PATCH /api/matters/[id] — update matter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid matter ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`matters:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.status !== undefined) updates.status = body.status;
    if (body.matterType !== undefined) updates.matter_type = body.matterType;

    const { error } = await auth.supabase
      .from("matters")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update matter error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to update matter") },
      { status: 500 }
    );
  }
}

// DELETE /api/matters/[id] — delete matter (projects get matter_id = null via SET NULL)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid matter ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`matters:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { error } = await auth.supabase
      .from("matters")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete matter error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to delete matter") },
      { status: 500 }
    );
  }
}

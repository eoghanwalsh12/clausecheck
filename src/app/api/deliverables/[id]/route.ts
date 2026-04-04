import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/deliverables/[id] — fetch a single deliverable with full content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid deliverable ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`deliverables:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { data, error } = await auth.supabase
      .from("deliverables")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get deliverable error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to load deliverable") },
      { status: 500 }
    );
  }
}

// PATCH /api/deliverables/[id] — update deliverable content/title
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid deliverable ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`deliverables:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;

    const { error } = await auth.supabase
      .from("deliverables")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update deliverable error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to update deliverable") },
      { status: 500 }
    );
  }
}

// DELETE /api/deliverables/[id] — delete a deliverable
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid deliverable ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`deliverables:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { error } = await auth.supabase
      .from("deliverables")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete deliverable error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to delete deliverable") },
      { status: 500 }
    );
  }
}

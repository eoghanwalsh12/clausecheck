import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient(authHeader: string | null) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  );
}

// GET /api/deliverables/[id] — fetch a single deliverable with full content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient(request.headers.get("authorization"));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("deliverables")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get deliverable error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load deliverable" },
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
    const supabase = getSupabaseClient(request.headers.get("authorization"));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;

    const { error } = await supabase
      .from("deliverables")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update deliverable error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update deliverable" },
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
    const supabase = getSupabaseClient(request.headers.get("authorization"));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("deliverables")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete deliverable error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete deliverable" },
      { status: 500 }
    );
  }
}

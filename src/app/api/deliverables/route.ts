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

// GET /api/deliverables?projectId=xxx — list deliverables for a project
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request.headers.get("authorization"));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("deliverables")
      .select("id, title, audience, format, created_at, updated_at")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("List deliverables error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list deliverables" },
      { status: 500 }
    );
  }
}

// POST /api/deliverables — create a new deliverable
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request.headers.get("authorization"));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, audience, format, title, content, aiGeneratedContent } = body;

    if (!projectId || !audience || !format || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("deliverables")
      .insert({
        project_id: projectId,
        user_id: user.id,
        audience,
        format,
        title,
        content: content || "",
        ai_generated_content: aiGeneratedContent || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Create deliverable error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create deliverable" },
      { status: 500 }
    );
  }
}

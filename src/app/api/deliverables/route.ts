import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/deliverables?projectId=xxx — list deliverables for a project
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`deliverables:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId || !isValidUUID(projectId)) {
      return NextResponse.json({ error: "Missing or invalid projectId" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("deliverables")
      .select("id, title, audience, format, created_at, updated_at")
      .eq("project_id", projectId)
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("List deliverables error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to list deliverables") },
      { status: 500 }
    );
  }
}

// POST /api/deliverables — create a new deliverable
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`deliverables:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { projectId, audience, format, title, content, aiGeneratedContent } = body;

    if (!projectId || !isValidUUID(projectId) || !audience || !format || !title) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("deliverables")
      .insert({
        project_id: projectId,
        user_id: auth.user.id,
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
      { error: safeErrorMessage(error, "Failed to create deliverable") },
      { status: 500 }
    );
  }
}

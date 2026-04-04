import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/validation";

// GET /api/projects — list user's projects
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`projects:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { data, error } = await auth.supabase
      .from("projects")
      .select("id, file_name, file_type, position_role, updated_at, created_at")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to list projects") },
      { status: 500 }
    );
  }
}

// POST /api/projects — create a new project
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`projects:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { fileName, documentText, htmlContent, fileType, positionRole, positionDescription } =
      body;

    if (!fileName || !documentText || !fileType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("projects")
      .insert({
        user_id: auth.user.id,
        file_name: fileName,
        document_text: documentText,
        html_content: htmlContent || null,
        file_type: fileType,
        position_role: positionRole || null,
        position_description: positionDescription || null,
        chat_history: [],
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to create project") },
      { status: 500 }
    );
  }
}

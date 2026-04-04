import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`export:${auth.user.id}`, 3, 300_000)) {
      return rateLimitResponse();
    }

    const [projectsRes, deliverablesRes] = await Promise.all([
      auth.supabase
        .from("projects")
        .select("id, file_name, file_type, document_text, position_role, position_description, chat_history, created_at, updated_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false }),
      auth.supabase
        .from("deliverables")
        .select("id, project_id, title, audience, format, content, ai_generated_content, created_at, updated_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: {
        id: auth.user.id,
        email: auth.user.email,
        createdAt: auth.user.created_at,
      },
      projects: projectsRes.data ?? [],
      deliverables: deliverablesRes.data ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="clausecheck-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}

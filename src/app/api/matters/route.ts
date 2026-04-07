import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/matters — list matters, optionally filtered by ?clientId=
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`matters:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const clientId = request.nextUrl.searchParams.get("clientId");

    let query = auth.supabase
      .from("matters")
      .select("id, name, description, matter_type, status, client_id, created_at, updated_at, projects(count)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (clientId) {
      if (!isValidUUID(clientId)) {
        return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
      }
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const matters = (data ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      project_count: Array.isArray(m.projects) ? (m.projects[0] as Record<string, number>)?.count ?? 0 : 0,
      projects: undefined,
    }));

    return NextResponse.json(matters);
  } catch (error) {
    console.error("List matters error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to list matters") },
      { status: 500 }
    );
  }
}

// POST /api/matters — create a matter
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`matters:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { clientId, name, description, matterType } = body;

    if (!clientId || !isValidUUID(clientId)) {
      return NextResponse.json({ error: "Valid client ID is required" }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: "Matter name is required" }, { status: 400 });
    }

    // Verify the client belongs to this user
    const { data: client } = await auth.supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("user_id", auth.user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data, error } = await auth.supabase
      .from("matters")
      .insert({
        client_id: clientId,
        user_id: auth.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        matter_type: matterType || "analysis",
        status: "active",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Create matter error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to create matter") },
      { status: 500 }
    );
  }
}

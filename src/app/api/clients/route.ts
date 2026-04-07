import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/validation";

// GET /api/clients — list user's clients with matter counts
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`clients:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { data, error } = await auth.supabase
      .from("clients")
      .select("id, name, contact_name, company_type, notes, created_at, updated_at, matters(count)")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Flatten matter count
    const clients = (data ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      matter_count: Array.isArray(c.matters) ? (c.matters[0] as Record<string, number>)?.count ?? 0 : 0,
      matters: undefined,
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error("List clients error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to list clients") },
      { status: 500 }
    );
  }
}

// POST /api/clients — create a client
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`clients:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { name, contactName, companyType, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("clients")
      .insert({
        user_id: auth.user.id,
        name: name.trim(),
        contact_name: contactName?.trim() || null,
        company_type: companyType?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to create client") },
      { status: 500 }
    );
  }
}

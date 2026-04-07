import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// GET /api/clients/[id] — fetch client with its matters and project counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`clients:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { data: client, error: clientError } = await auth.supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (clientError) throw clientError;
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const { data: matters, error: mattersError } = await auth.supabase
      .from("matters")
      .select("id, name, description, matter_type, status, created_at, updated_at, projects(count)")
      .eq("client_id", id)
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (mattersError) throw mattersError;

    const mattersWithCount = (matters ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      project_count: Array.isArray(m.projects) ? (m.projects[0] as Record<string, number>)?.count ?? 0 : 0,
      projects: undefined,
    }));

    return NextResponse.json({ ...client, matters: mattersWithCount });
  } catch (error) {
    console.error("Get client error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to load client") },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id] — update client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`clients:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.contactName !== undefined) updates.contact_name = body.contactName?.trim() || null;
    if (body.companyType !== undefined) updates.company_type = body.companyType?.trim() || null;
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;

    const { error } = await auth.supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to update client") },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] — delete client (matters cascade; projects get matter_id = null)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`clients:${auth.user.id}`, 60)) {
      return rateLimitResponse();
    }

    const { error } = await auth.supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to delete client") },
      { status: 500 }
    );
  }
}

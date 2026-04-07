import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";

// POST /api/compliance — create a compliance job
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    // DB-backed rate limit: max 10 jobs per user per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await auth.supabase
      .from("compliance_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 10) {
      return NextResponse.json(
        { error: "Too many compliance jobs. Please wait before starting another." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, legislationName, matterId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Job name is required" }, { status: 400 });
    }
    if (!legislationName?.trim()) {
      return NextResponse.json({ error: "Legislation name is required" }, { status: 400 });
    }
    if (matterId && !isValidUUID(matterId)) {
      return NextResponse.json({ error: "Invalid matter ID" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("compliance_jobs")
      .insert({
        user_id: auth.user.id,
        name: name.trim(),
        legislation_name: legislationName.trim(),
        matter_id: matterId || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Create compliance job error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to create compliance job") },
      { status: 500 }
    );
  }
}

// GET /api/compliance — list user's compliance jobs
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const matterId = request.nextUrl.searchParams.get("matterId");

    let query = auth.supabase
      .from("compliance_jobs")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (matterId && isValidUUID(matterId)) {
      query = query.eq("matter_id", matterId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("List compliance jobs error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to list jobs") },
      { status: 500 }
    );
  }
}

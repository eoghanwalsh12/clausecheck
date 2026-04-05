import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

export function getSupabaseClient(authHeader: string | null): SupabaseClient {
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

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "") ?? null;
  if (!token) return null;

  const supabase = getSupabaseClient(authHeader);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return { user, supabase };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

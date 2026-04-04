import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`delete-account:${auth.user.id}`, 2, 300_000)) {
      return rateLimitResponse();
    }

    const userId = auth.user.id;

    // Delete in dependency order: deliverables -> projects -> storage
    await auth.supabase.from("deliverables").delete().eq("user_id", userId);
    await auth.supabase.from("projects").delete().eq("user_id", userId);

    // Remove all files in the user's storage folder
    const { data: files } = await auth.supabase.storage
      .from("documents")
      .list(userId);

    if (files?.length) {
      // Storage may have sub-folders per project — list recursively
      const paths: string[] = [];
      for (const entry of files) {
        const { data: subFiles } = await auth.supabase.storage
          .from("documents")
          .list(`${userId}/${entry.name}`);
        if (subFiles?.length) {
          for (const f of subFiles) {
            paths.push(`${userId}/${entry.name}/${f.name}`);
          }
        }
      }
      if (paths.length) {
        await auth.supabase.storage.from("documents").remove(paths);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
  }
}

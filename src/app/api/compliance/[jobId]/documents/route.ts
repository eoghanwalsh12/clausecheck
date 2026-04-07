import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { isFileTooLarge, isValidUUID, safeErrorMessage } from "@/lib/validation";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");
import mammoth from "mammoth";

function sanitiseFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// POST /api/compliance/[jobId]/documents — upload one file, extract text, store to Storage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    // Verify job belongs to user
    const { data: job } = await auth.supabase
      .from("compliance_jobs")
      .select("id")
      .eq("id", jobId)
      .eq("user_id", auth.user.id)
      .single();

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!docType || !["legislation", "contract"].includes(docType)) {
      return NextResponse.json({ error: "docType must be legislation or contract" }, { status: 400 });
    }
    if (isFileTooLarge(file)) {
      return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 400 });
    }

    const safeName = sanitiseFileName(file.name);
    const fileType = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";

    // Extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (fileType === "pdf") {
      const data = await pdf(buffer);
      text = data.text;
    } else {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    if (text.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract enough text from this file." }, { status: 400 });
    }

    const storagePath = `${auth.user.id}/compliance/${jobId}/${docType}/${safeName}`;
    const textPath = `${storagePath}.txt`;

    // Upload original + extracted text
    await Promise.all([
      auth.supabase.storage.from("documents").upload(storagePath, buffer, { upsert: true }),
      auth.supabase.storage.from("documents").upload(textPath, Buffer.from(text, "utf-8"), {
        upsert: true,
        contentType: "text/plain",
      }),
    ]);

    const { data, error } = await auth.supabase
      .from("compliance_documents")
      .insert({
        job_id: jobId,
        user_id: auth.user.id,
        doc_type: docType,
        file_name: file.name,
        file_type: fileType,
        storage_path: storagePath,
        char_count: text.length,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, charCount: text.length });
  } catch (error) {
    console.error("Upload compliance document error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to upload document") },
      { status: 500 }
    );
  }
}

// GET /api/compliance/[jobId]/documents — list documents for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const docType = request.nextUrl.searchParams.get("docType");

    let query = auth.supabase
      .from("compliance_documents")
      .select("*")
      .eq("job_id", jobId)
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: true });

    if (docType) query = query.eq("doc_type", docType);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error, "Failed to list documents") }, { status: 500 });
  }
}

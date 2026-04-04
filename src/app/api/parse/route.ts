import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isFileTooLarge } from "@/lib/validation";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");
import mammoth from "mammoth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`parse:${auth.user.id}`, 20)) {
      return rateLimitResponse();
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (isFileTooLarge(file)) {
      return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    let htmlContent: string | undefined;

    if (file.type === "application/pdf") {
      const data = await pdf(buffer);
      text = data.text;
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const [rawResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ buffer }),
        mammoth.convertToHtml({ buffer }),
      ]);
      text = rawResult.value;
      htmlContent = htmlResult.value;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    if (text.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from the document. Please ensure it contains readable text.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ text, htmlContent });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse document" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");
import mammoth from "mammoth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse document",
      },
      { status: 500 }
    );
  }
}

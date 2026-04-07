import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// POST /api/compliance/[jobId]/extract-chunk
// Sends one legislation chunk to Claude and returns requirements array
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`compliance-extract:${auth.user.id}`, 10)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { chunkText, legislationName, heading } = body;

    if (!chunkText?.trim()) {
      return NextResponse.json({ error: "chunkText is required" }, { status: 400 });
    }

    const preamble = heading ? `\n[Context: This text is from the section: "${heading}"]` : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `You are a legal analyst. Extract discrete actionable legal requirements from legislative text that would directly affect the drafting of a commercial contract.

Respond with a JSON array only — no markdown, no commentary outside the JSON. Each item must have exactly these fields:
{
  "articleRef": "exact section/article reference e.g. 'Article 6(1)(a)' or 'Section 23(2)'",
  "requirementText": "plain English restatement starting with 'A contract must...' or 'The following is prohibited...' or 'A party must...'",
  "obligationType": "obligation" or "prohibition" or "right" or "definition" or "procedure"
}

Rules:
- Only extract requirements relevant to commercial contract drafting
- Skip recitals, preambles, and procedural rules about how the legislation itself operates
- One object per distinct obligation — do not bundle multiple obligations together
- Maximum 50 requirements per response — prioritise obligations and prohibitions
- If no relevant requirements are found, return an empty array []`,
      messages: [
        {
          role: "user",
          content: `Extract compliance requirements from this section of ${legislationName || "the legislation"}:${preamble}

---
${chunkText}
---`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let requirements: unknown[];
    try {
      requirements = JSON.parse(cleaned);
      if (!Array.isArray(requirements)) requirements = [];
    } catch {
      requirements = [];
    }

    return NextResponse.json({ requirements });
  } catch (error) {
    console.error("Extract chunk error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to extract requirements") },
      { status: 500 }
    );
  }
}

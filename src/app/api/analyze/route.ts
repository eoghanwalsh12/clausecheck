import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isFileTooLarge } from "@/lib/validation";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse");
import mammoth from "mammoth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    const data = await pdf(buffer);
    return data.text;
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type");
}

const SYSTEM_PROMPT = `You are an expert contract lawyer AI assistant. Your job is to analyse contracts clause-by-clause and provide actionable risk assessments.

You MUST respond with valid JSON matching this exact schema — no markdown, no commentary outside the JSON:

{
  "contractType": "string — e.g. NDA, Employment Agreement, Freelance Contract, Lease, etc.",
  "parties": ["string — name of each party"],
  "effectiveDate": "string or null — the effective/start date if stated",
  "overallRiskScore": number (1-10, where 1 is very safe and 10 is very risky),
  "overallRiskLevel": "low" | "medium" | "high" | "critical",
  "executiveSummary": "string — 2-3 sentence plain-English summary of the contract and its key risks",
  "clauses": [
    {
      "title": "string — short name for this clause",
      "category": "string — e.g. Liability, Termination, IP, Non-Compete, Payment, Confidentiality, Indemnification, Dispute Resolution, etc.",
      "originalText": "string — the relevant excerpt from the contract",
      "plainEnglish": "string — what this clause means in simple terms",
      "riskLevel": "low" | "medium" | "high" | "critical",
      "riskExplanation": "string — why this clause is or isn't risky",
      "suggestedAlternative": "string or null — rewritten clause language if the risk is medium or above, null if low risk"
    }
  ],
  "keyTerms": ["string — important defined terms in the contract"],
  "missingClauses": ["string — standard clauses that are notably absent, e.g. 'No limitation of liability clause', 'No termination for convenience'"]
}

Guidelines:
- Extract ALL meaningful clauses, not just risky ones.
- Be specific in risk explanations — reference the actual language.
- Suggested alternatives should be realistic and balanced, not one-sided.
- Flag missing standard protections in missingClauses.
- If the document doesn't appear to be a contract, set overallRiskScore to 0 and explain in executiveSummary.`;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`analyze:${auth.user.id}`, 10)) {
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

    const text = await extractText(file);

    if (text.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from the document. Please ensure it contains readable text." },
        { status: 400 }
      );
    }

    // Truncate very long documents to stay within context limits
    const truncatedText = text.slice(0, 80000);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Analyse the following contract:\n\n${truncatedText}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format");
    }

    // Strip markdown code fences if Claude wraps the JSON
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const analysis = JSON.parse(jsonText);

    // Add metadata
    analysis.id = crypto.randomUUID();
    analysis.fileName = file.name;
    analysis.createdAt = new Date().toISOString();

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse analysis results. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyse contract" },
      { status: 500 }
    );
  }
}

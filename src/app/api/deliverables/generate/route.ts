import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID } from "@/lib/validation";
import type { DeliverableAudience, DeliverableFormat } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const AUDIENCE_INSTRUCTIONS: Record<DeliverableAudience, string> = {
  client:
    "Write in a formal, polished, client-facing tone. Avoid internal commentary or strategic speculation. Use professional legal language appropriate for an external audience. Be precise, clear, and authoritative. The recipient is the client — address them respectfully and professionally.",
  partner:
    "Write in a candid, strategic, internal tone. Include risk-benefit analysis, tactical recommendations, and honest assessments. Flag areas of concern directly. Include litigation/negotiation strategy where relevant. This is for internal consumption by legal colleagues who need actionable intelligence.",
};

const FORMAT_INSTRUCTIONS: Record<DeliverableFormat, { instruction: string; maxTokens: number; defaultTitle: string }> = {
  client_email: {
    instruction: `Draft a professional email to the client summarising the key findings from the document review. Structure:
- Subject line (use as the document title)
- Professional salutation
- Brief opening paragraph referencing the engagement/matter
- 3-5 key findings as numbered points with clear, concise explanations
- Recommended next steps
- Professional closing with appropriate sign-off

Keep it concise (under 500 words in the body). Use the tone appropriate for a senior lawyer writing to a valued client.`,
    maxTokens: 4096,
    defaultTitle: "Client Advisory Email",
  },
  written_report: {
    instruction: `Produce a comprehensive legal report with the following structure:
- Title page information (matter name, date, prepared by, confidentiality notice)
- Table of Contents
- Executive Summary (1-2 paragraphs)
- Background & Scope of Review
- Key Findings (organised by topic, with numbered paragraphs)
- Risk Analysis (with risk ratings: Low/Medium/High/Critical for each area)
- Recommendations (numbered, actionable)
- Conclusion
- Appendix references where applicable

Use formal legal report conventions: numbered paragraphs (1.1, 1.2, etc.), professional headings, and precise language. Target 1500-3000 words.`,
    maxTokens: 12000,
    defaultTitle: "Legal Review Report",
  },
  annotated_document: {
    instruction: `Create a clause-by-clause annotation of the document. For each significant clause or section, provide:
- Clause reference and title
- Plain-English summary of what the clause does
- Risk level: Low / Medium / High / Critical (highlighted prominently)
- Detailed commentary on implications, unusual terms, and potential issues
- Recommended amendments or alternative language where applicable

Use a clear, structured format. Highlight contentious or high-risk clauses prominently. Group annotations by document section. Include an overview summary at the top listing all high-risk and critical items.`,
    maxTokens: 12000,
    defaultTitle: "Annotated Document Review",
  },
  presentation_outline: {
    instruction: `Create a presentation outline suitable for PowerPoint/Keynote covering the document review. Structure:

For each slide provide:
- Slide number and title
- 3-5 bullet points (concise, presentation-ready)
- Speaker notes (2-3 sentences of context)

Suggested slides:
1. Title Slide (matter name, date, presented by)
2. Engagement Overview
3. Document Summary
4. Key Terms & Structure
5. Risk Summary (with visual risk matrix description)
6-8. Detailed Findings (grouped by topic)
9. Negotiation Points / Recommended Changes
10. Recommended Next Steps
11. Questions / Discussion

Target 8-12 slides. Keep bullet points short and impactful.`,
    maxTokens: 8192,
    defaultTitle: "Document Review Presentation",
  },
  letter_of_advice: {
    instruction: `Draft a formal letter of advice in traditional legal letter format:
- Firm letterhead placeholder
- Date
- Addressee (with [Client Name] placeholder)
- RE: line referencing the matter
- "Dear [Client]" salutation
- Introduction paragraph referencing the engagement and scope
- Detailed analysis organised by issue (numbered paragraphs: 1, 2, 3...)
  - Each issue: statement of the position, analysis, and clear advice
- Summary of key recommendations
- Standard qualifications and limitations paragraph
- Professional sign-off with partner/solicitor signature block

Use paragraph numbering throughout. Write in the authoritative yet accessible style expected of formal legal correspondence. Target 1000-2000 words.`,
    maxTokens: 10000,
    defaultTitle: "Letter of Advice",
  },
  negotiation_playbook: {
    instruction: `Create a negotiation playbook document. Structure:

1. Executive Strategy Summary (overall negotiation approach, leverage points, red lines)
2. Priority Matrix (must-haves vs. nice-to-haves vs. acceptable concessions)
3. For each negotiable point:
   - Current clause language (quoted)
   - Why it matters (risk/impact assessment)
   - Ideal outcome (best case position)
   - Acceptable fallback position
   - Walk-away point (the line that cannot be crossed)
   - Suggested redline language (exact wording to propose)
   - Anticipated counterarguments and responses
4. Concession Strategy (what can be traded and for what)
5. Timeline & Process Recommendations

Organise by priority. Be direct and strategic. This is a working document for the negotiation team.`,
    maxTokens: 10000,
    defaultTitle: "Negotiation Playbook",
  },
  risk_register: {
    instruction: `Produce a comprehensive risk register. Structure:

1. Risk Summary Dashboard:
   - Total risks identified
   - Distribution: Critical / High / Medium / Low
   - Top 3 priority risks

2. Risk Register Table — for each risk:
   - Risk ID (R-001, R-002, etc.)
   - Clause/Section Reference
   - Risk Category (Financial, Operational, Legal, Reputational, Compliance)
   - Risk Description (clear, specific)
   - Likelihood (1-5 scale with descriptor)
   - Impact (1-5 scale with descriptor)
   - Risk Score (Likelihood x Impact)
   - Risk Owner (suggested role/party)
   - Mitigation Strategy (specific, actionable)
   - Recommended Action
   - Priority (Immediate / Short-term / Monitor)

3. Risk Heat Map description (5x5 matrix showing risk distribution)
4. Key Recommendations (top 5 actions to reduce overall risk exposure)

Be thorough — identify all material risks from the document.`,
    maxTokens: 10000,
    defaultTitle: "Risk Register",
  },
};

function buildGenerationPrompt(
  documentText: string,
  chatHistory: Array<{ role: string; content: string }>,
  positionRole: string | undefined,
  positionDescription: string | undefined,
  audience: DeliverableAudience,
  format: DeliverableFormat
): string {
  const formatConfig = FORMAT_INSTRUCTIONS[format];

  // Build chat transcript (last 20 messages, prioritise assistant messages)
  let chatTranscript = "";
  if (chatHistory?.length) {
    const recent = chatHistory.slice(-20);
    chatTranscript = recent
      .map((m) => `${m.role === "user" ? "USER" : "ASSISTANT"}: ${m.content}`)
      .join("\n\n");
  }

  let positionContext = "";
  if (positionRole) {
    positionContext = `The user's position in this document: "${positionRole}"${positionDescription ? `. Additional context: ${positionDescription}` : ""}.`;
  }

  return `You are a senior legal professional at a leading law firm producing a formal deliverable document. You must produce output that would be indistinguishable from work product at a top-tier firm.

${AUDIENCE_INSTRUCTIONS[audience]}

${positionContext}

DOCUMENT UNDER REVIEW:
---
${documentText.slice(0, 80000)}
---

${chatTranscript ? `PRIOR ANALYSIS (conversation transcript — use these findings as the basis for your deliverable):\n---\n${chatTranscript.slice(0, 30000)}\n---\n` : ""}

TASK: ${formatConfig.instruction}

Format your output using HTML tags for rich text rendering:
- <h1> for the document title
- <h2> for major section headings
- <h3> for subsection headings
- <p> for paragraphs
- <ul>/<ol> with <li> for lists
- <strong> for bold emphasis
- <em> for italics
- <blockquote> for quoted clause language
- <table>, <thead>, <tbody>, <tr>, <th>, <td> for tables
- <hr> for section dividers

Do NOT use markdown. Output only valid HTML content (no <html>, <head>, or <body> wrapper tags).`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`deliverables-gen:${auth.user.id}`, 10)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { projectId, audience, format } = body as {
      projectId: string;
      audience: DeliverableAudience;
      format: DeliverableFormat;
    };

    if (!projectId || !isValidUUID(projectId) || !audience || !format) {
      return new Response(JSON.stringify({ error: "Missing or invalid required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Load project data
    const { data: project, error: projectError } = await auth.supabase
      .from("projects")
      .select("document_text, chat_history, position_role, position_description")
      .eq("id", projectId)
      .eq("user_id", auth.user.id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildGenerationPrompt(
      project.document_text,
      project.chat_history || [],
      project.position_role,
      project.position_description,
      audience,
      format
    );

    const formatConfig = FORMAT_INSTRUCTIONS[format];

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: formatConfig.maxTokens,
      messages: [{ role: "user", content: "Generate the deliverable document now." }],
      system: systemPrompt,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Generation stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generate deliverable error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate deliverable" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

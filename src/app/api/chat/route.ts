import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function buildSystemPrompt(
  documentText: string,
  userRole: string | undefined,
  userDescription: string | undefined
) {
  let positionContext = "";
  if (userRole) {
    positionContext = `\n\nIMPORTANT — The user's position: They are the "${userRole}" in this document.${
      userDescription ? ` Additional context: ${userDescription}` : ""
    } Tailor all analysis, risk assessments, and recommendations to protect and advance THEIR interests from this position. When identifying risks, focus on risks TO THEM. When suggesting negotiations, suggest terms that benefit THEIR position.`;
  }

  return `You are an expert legal analyst AI assistant reviewing a legal document. Provide direct, concise analysis.${positionContext}

CRITICAL — CONCISENESS RULES (follow strictly):
- Be DIRECT. Lead with the answer, not background or preamble.
- Keep responses SHORT. Most answers should be under 300 words.
- For risk assessments: list risks ranked by severity (critical → low). State each risk in 1-2 sentences max. Stop after identifying risks — do NOT add mitigation strategies, recommendations, or next steps unless the user explicitly asks.
- For clause explanations: give the plain-English meaning in 2-3 sentences. Stop there.
- For negotiation points: list the leverage points. Don't write a full playbook unless asked.
- NEVER pad responses with generic advice, disclaimers, or "happy to help" language.
- Only elaborate when the user asks a follow-up or says "tell me more".
- If something is standard/fair, say so in one line — don't manufacture risk.

Guidelines:
- Reference actual language from the document using > blockquotes (clickable for the user)
- Use clear section/clause references
- Be specific about real-world consequences

Formatting:
- Use ## headings only when covering multiple distinct topics
- Use bullet points (- ) for lists
- Use **bold** for key terms and warnings
- Keep paragraphs to 1-2 sentences
- Never write a wall of text

THE DOCUMENT:
---
${documentText.slice(0, 80000)}
---`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`chat:${auth.user.id}`, 30)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { messages, documentText, userRole, userDescription } = body;

    if (!documentText || !messages?.length) {
      return new Response(
        JSON.stringify({ error: "Missing document text or messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildSystemPrompt(
      documentText,
      userRole,
      userDescription
    );

    // Convert chat messages to Anthropic format
    const anthropicMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })
    );

    // Stream the response
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: anthropicMessages,
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
          console.error("Stream error:", error);
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
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

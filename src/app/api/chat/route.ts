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

  return `You are an expert legal analyst AI assistant. You have been given a legal document to review, and the user will ask you questions about it. You should provide thorough, actionable legal analysis.${positionContext}

Your capabilities:
- Explain any clause or section in plain English
- Identify risks, opportunities, and areas for negotiation
- Generate comprehensive risk assessments
- Suggest alternative language for problematic clauses
- Flag missing protections or unusual terms
- Compare terms against market standards
- Identify leverage points for negotiation

Guidelines:
- Be specific — reference actual language from the document
- When identifying risks, explain the real-world consequence
- Suggested alternatives should be realistic and balanced
- If something is standard/fair, say so — don't manufacture risk
- Use clear section references so the user can find what you're discussing

Formatting rules (IMPORTANT — follow strictly):
- Use ## headings to separate major topics or sections of your analysis
- Use ### subheadings within topics when needed
- Use bullet points (- ) for lists of risks, items, or recommendations
- Use numbered lists (1. 2. 3.) for ranked items or sequential steps
- Use **bold** for key terms, clause names, and important warnings
- Use > blockquotes when quoting exact language from the document — the user can click these to find the passage in the document
- Keep paragraphs short — 2-3 sentences maximum
- Add blank lines between sections for visual breathing room
- Never write a wall of text — always break analysis into structured, scannable sections

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
      max_tokens: 4096,
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

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/supabase-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUUID, safeErrorMessage } from "@/lib/validation";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const CONTRACT_CHAR_LIMIT = 60000;

// POST /api/compliance/[jobId]/analyse-contract
// Reads contract .txt from Storage, calls Claude Pass 2, saves findings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!isValidUUID(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    if (!checkRateLimit(`compliance-analyse:${auth.user.id}`, 10)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { documentId, requirements, legislationName } = body;

    if (!isValidUUID(documentId)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }
    if (!Array.isArray(requirements) || requirements.length === 0) {
      return NextResponse.json({ error: "requirements array is required" }, { status: 400 });
    }

    // Fetch document record
    const { data: doc } = await auth.supabase
      .from("compliance_documents")
      .select("*")
      .eq("id", documentId)
      .eq("job_id", jobId)
      .eq("user_id", auth.user.id)
      .single();

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    // Read extracted text from Storage
    const textPath = `${doc.storage_path}.txt`;
    const { data: blob, error: storageError } = await auth.supabase.storage
      .from("documents")
      .download(textPath);

    if (storageError || !blob) {
      return NextResponse.json({ error: "Could not read document text from storage" }, { status: 500 });
    }

    const fullText = await blob.text();
    const contractText = fullText.slice(0, CONTRACT_CHAR_LIMIT);
    const wasTruncated = fullText.length > CONTRACT_CHAR_LIMIT;

    // Build requirements list string (cap at 150)
    const reqList = requirements
      .slice(0, 150)
      .map((r: Record<string, string>, i: number) =>
        `${i + 1}. ${r.article_ref || r.articleRef}: ${r.requirement_text || r.requirementText}`
      )
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: `You are a specialist compliance lawyer auditing commercial contracts on behalf of a law firm. For each legal requirement listed, classify the contract's position using THREE tiers:

NON_COMPLIANT — the contract clearly and directly contravenes the requirement. No ambiguity.
RISKY — the contract may technically comply today but carries risk: ambiguous language that could be challenged, poor drafting with unintended exposure, or it complies now but conflicts with the clear direction of anticipated legislation or regulatory guidance.
COMPLIANT — the contract clearly and adequately satisfies the requirement.

Respond with valid JSON only — no markdown, no text outside the JSON:
{
  "contractSummary": "1 sentence: contract type and parties",
  "overallStatus": "compliant" or "risky" or "non_compliant",
  "findings": [
    {
      "legislationRef": "e.g. 'GDPR Article 28(3)(a)'",
      "requirementText": "the requirement being assessed",
      "clauseText": "verbatim excerpt from the contract, or null if requirement is absent",
      "complianceTier": "non_compliant" or "risky" or "compliant",
      "riskBasis": "interpretive" or "future_legislation" or "ambiguous_drafting" or null,
      "topicArea": one of ["Data Processing","Liability","Termination","Intellectual Property","Confidentiality","Payment Terms","Dispute Resolution","Employment","Regulatory","Other"],
      "issueDescription": "specific explanation — for non_compliant: what the contract does wrong; for risky: what the risk is and why; for compliant: brief confirmation",
      "suggestedFix": "specific contract language or structural change, or null for compliant findings"
    }
  ]
}

IMPORTANT:
- Include ALL requirements in findings — compliant ones too. The firm needs a complete picture.
- overallStatus must be non_compliant if any finding is non_compliant; risky if any is risky and none are non_compliant; otherwise compliant.
- riskBasis is only set for risky tier findings; null for others.`,
      messages: [
        {
          role: "user",
          content: `LEGISLATION: ${legislationName || "the applicable legislation"}${wasTruncated ? "\n\n⚠️ Note: This contract was truncated at 60,000 characters for analysis." : ""}

REQUIREMENTS:
${reqList}

CONTRACT (${doc.file_name}):
---
${contractText}
---`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let result: {
      contractSummary?: string;
      overallStatus?: string;
      findings?: Record<string, unknown>[];
    };
    try {
      result = JSON.parse(cleaned);
    } catch {
      // Parse failure — mark contract as errored and return
      await auth.supabase
        .from("compliance_documents")
        .update({ status: "error" })
        .eq("id", documentId);
      await auth.supabase.rpc("increment_contracts_done", { job_id_param: jobId });
      return NextResponse.json({ contractStatus: "error", findingsCount: 0 });
    }

    const findings = Array.isArray(result.findings) ? result.findings : [];
    const contractStatus = result.overallStatus || "compliant";

    // Count tiers
    const nonCompliantCount = findings.filter((f) => f.complianceTier === "non_compliant").length;
    const riskyCount = findings.filter((f) => f.complianceTier === "risky").length;
    const compliantCount = findings.filter((f) => f.complianceTier === "compliant").length;

    // Insert findings
    if (findings.length > 0) {
      const rows = findings.map((f) => ({
        job_id: jobId,
        contract_doc_id: documentId,
        user_id: auth.user.id,
        compliance_tier: f.complianceTier || "compliant",
        risk_basis: f.riskBasis || null,
        topic_area: f.topicArea || "Other",
        clause_text: f.clauseText || null,
        legislation_ref: String(f.legislationRef || ""),
        issue_summary: String(f.issueDescription || ""),
        suggested_fix: f.suggestedFix || null,
      }));
      const { error: findingsError } = await auth.supabase.from("compliance_findings").insert(rows);
      if (findingsError) {
        console.error("compliance_findings insert error:", JSON.stringify(findingsError));
      }
    }

    // Update document record
    const { error: docUpdateError } = await auth.supabase
      .from("compliance_documents")
      .update({
        contract_status: contractStatus,
        contract_summary: result.contractSummary || null,
        noncompliant_count: nonCompliantCount,
        risky_count: riskyCount,
        compliant_count: compliantCount,
        status: "done",
      })
      .eq("id", documentId);
    if (docUpdateError) {
      console.error("compliance_documents update error:", JSON.stringify(docUpdateError));
    }

    // Update job counters (read-then-write; sequential browser loop means no race)
    const { data: currentJob, error: jobReadError } = await auth.supabase
      .from("compliance_jobs")
      .select("contracts_done, compliant_contracts, risky_contracts, noncompliant_contracts")
      .eq("id", jobId)
      .single();

    if (jobReadError) {
      console.error("compliance_jobs read error:", JSON.stringify(jobReadError));
    }

    if (currentJob) {
      const { error: jobUpdateError } = await auth.supabase
        .from("compliance_jobs")
        .update({
          contracts_done: (currentJob.contracts_done || 0) + 1,
          compliant_contracts:
            contractStatus === "compliant"
              ? (currentJob.compliant_contracts || 0) + 1
              : currentJob.compliant_contracts,
          risky_contracts:
            contractStatus === "risky"
              ? (currentJob.risky_contracts || 0) + 1
              : currentJob.risky_contracts,
          noncompliant_contracts:
            contractStatus === "non_compliant"
              ? (currentJob.noncompliant_contracts || 0) + 1
              : currentJob.noncompliant_contracts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      if (jobUpdateError) {
        console.error("compliance_jobs update error:", JSON.stringify(jobUpdateError));
      }
    }

    return NextResponse.json({
      contractStatus,
      findingsCount: findings.length,
      nonCompliantCount,
      riskyCount,
      compliantCount,
    });
  } catch (error) {
    console.error("Analyse contract error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Failed to analyse contract") },
      { status: 500 }
    );
  }
}

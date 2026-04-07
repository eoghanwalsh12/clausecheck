# Feature: Compliance Check

**Status**: Planned — not yet implemented  
**Goal**: Upload legislation + multiple contracts → get a compliance report a law firm partner can present to a client the same day.

---

## The Core Problem

A law firm wants to audit 50–100 contracts against new legislation in minutes, not days. The current tool handles one document at a time with an 80K character limit. This feature:

1. Removes the document limit via intelligent chunking
2. Handles unlimited contract uploads
3. Uses a two-pass AI approach (extract requirements → check contracts)
4. Produces a partner-ready executive report — not just a raw list of issues
5. Runs entirely within Vercel's free tier (client-side orchestrated batch)

---

## Output Model: Three-Tier Classification

Law firms think in three categories, not abstract severity scores. Every finding is classified as one of:

| Tier | Meaning | Example |
|------|---------|---------|
| **Non-Compliant** | Clear, direct contravention — unambiguous legal breach | Clause expressly contradicts GDPR Article 28(3)(a) |
| **Risky** | Technically may comply today, but carries interpretive, contextual, or anticipatory risk | Ambiguous language open to regulatory challenge; or compliant now but conflicts with draft upcoming legislation |
| **Compliant** | Clearly satisfies the requirement | Adequate data processing clause present and well-drafted |

**Contract-level status** is derived from its worst tier:
- `compliant` — all findings are Compliant
- `risky` — at least one Risky finding, zero Non-Compliant
- `non_compliant` — at least one Non-Compliant finding

**Risky sub-types** (stored in `risk_basis` field, useful for filtering):
- `interpretive` — language is ambiguous, outcome depends on regulatory interpretation
- `future_legislation` — compliant now but conflicts with pending/anticipated law
- `ambiguous_drafting` — poor drafting creates unintended exposure

---

## Report Output Structure

### 1. Summary Dashboard (the landing view after analysis)

What a law firm partner sees first — all in one glance:

```
╔══════════════════════════════════════════════════════════╗
║  GDPR Compliance Audit — Acme Corp Supplier Contracts    ║
║  47 contracts analysed · 3 min ago                       ║
╠══════════════════════════════════════════════════════════╣
║  COMPLIANCE RATE                                         ║
║  █████████░░ 12 / 47 Compliant (25.5%)                   ║
║  ██████░░░░░ 18 / 47 Risky (38.3%)                       ║
║  █████░░░░░░ 17 / 47 Non-Compliant (36.2%)               ║
╠══════════════════════════════════════════════════════════╣
║  TOP AREAS OF CONCERN            MOST CONTRAVENED        ║
║  1. Data Processing  (38 issues) Article 28(3)(a) — 31   ║
║  2. Liability Caps   (22 issues) Article 13(1)   — 18    ║
║  3. Termination      (14 issues) Article 6(1)(b) — 12    ║
╠══════════════════════════════════════════════════════════╣
║  MOST PROBLEMATIC CONTRACTS                              ║
║  1. Supplier_A.pdf       9 non-compliant findings        ║
║  2. Distributor_B.docx   7 non-compliant findings        ║
╚══════════════════════════════════════════════════════════╝
```

**Metrics:**
- Compliance Rate (% fully compliant contracts)
- Contract distribution: Non-Compliant / Risky / Compliant (count + %)
- Top Areas of Concern (group findings by `topic_area`, ranked by count)
- Most Contravened Articles (rank by contracts affected)
- Most Problematic Contracts (top 5 by Non-Compliant finding count)
- Total findings across all contracts: X Non-Compliant / Y Risky / Z Compliant

### 2. Contract Folders (below the dashboard)

**Non-Compliant & Risky folder** (requires action):
- Sorted by severity: Non-Compliant contracts first, then Risky
- Within each contract: within the expanded finding view, clauses sorted:
  1. Non-Compliant findings
  2. Risky findings
  3. Compliant findings

**Compliant folder:**
- All contracts where status = `compliant`
- Collapsed by default (less urgent)

### 3. Per-Contract Finding View (drilled into from either folder)

For each contract:
- Contract summary (parties, type, 1 sentence)
- Overall status badge
- Finding sections:
  - **Non-Compliant** — red, each with: legislation ref, clause excerpt (blockquote), explanation, suggested fix
  - **Risky** — amber, each with: risk basis badge (`Interpretive` / `Future Legislation` / `Ambiguous Drafting`), explanation, suggested fix
  - **Compliant** — green (collapsed by default, expandable)

---

## Architecture: Client-Orchestrated Batch Processing

**Why not SSE / long-running server functions?**  
Vercel Free is capped at 60 seconds per serverless function. 100 contracts at ~12s each = 20 minutes. The browser drives sequential short API calls — each ≤30s — saving progress to Supabase after every contract. If the user closes the tab, the job is resumable.

```
Browser (user watching progress)
│
├─ POST /api/compliance                        → create job → { jobId }
├─ POST /api/compliance/[jobId]/documents ×N  → upload files, extract text
│
│  [Phase 1 — Legislation]
├─ POST /api/compliance/[jobId]/extract-chunk  (one call per 30K-char chunk)
│      Claude extracts requirements list → client accumulates
├─ POST /api/compliance/[jobId]/save-requirements
│
│  [Phase 2 — Contracts, sequential loop in browser]
└─ For each contract:
   POST /api/compliance/[jobId]/analyse-contract { documentId }
   └─ Server reads .txt from Storage, calls Claude, saves findings
   └─ Returns { contractStatus, nonCompliantCount, riskyCount }
```

---

## Database Schema

Run in Supabase SQL Editor. Add to the bottom of `supabase-schema.sql`.

```sql
-- Parent record for one compliance check run
CREATE TABLE public.compliance_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matter_id         UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  legislation_name  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','uploading','extracting','analysing','complete','error')),
  error_message     TEXT,
  requirements_count INT DEFAULT 0,
  total_contracts   INT DEFAULT 0,
  contracts_done    INT DEFAULT 0,
  -- Summary counts (updated as each contract completes)
  compliant_contracts   INT DEFAULT 0,
  risky_contracts       INT DEFAULT 0,
  noncompliant_contracts INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.compliance_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own compliance jobs"
  ON public.compliance_jobs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX compliance_jobs_user_id ON public.compliance_jobs(user_id, created_at DESC);
CREATE INDEX compliance_jobs_matter_id ON public.compliance_jobs(matter_id);

-- Each uploaded file (legislation or contract)
CREATE TABLE public.compliance_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES public.compliance_jobs(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL CHECK (doc_type IN ('legislation','contract')),
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL CHECK (file_type IN ('pdf','docx')),
  storage_path  TEXT NOT NULL,
  char_count    INT,
  -- Contract-level compliance outcome (set after Pass 2)
  contract_status TEXT CHECK (contract_status IN ('compliant','risky','non_compliant')),
  contract_summary TEXT,              -- 1-sentence summary from Claude
  noncompliant_count INT DEFAULT 0,
  risky_count        INT DEFAULT 0,
  compliant_count    INT DEFAULT 0,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','done','error')),
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own compliance documents"
  ON public.compliance_documents USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX compliance_documents_job_id ON public.compliance_documents(job_id);
CREATE INDEX compliance_documents_status ON public.compliance_documents(job_id, contract_status);

-- Requirements extracted from legislation (Pass 1 output)
CREATE TABLE public.compliance_requirements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              UUID NOT NULL REFERENCES public.compliance_jobs(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legislation_doc_id  UUID REFERENCES public.compliance_documents(id) ON DELETE CASCADE,
  article_ref         TEXT NOT NULL,
  requirement_text    TEXT NOT NULL,
  obligation_type     TEXT CHECK (obligation_type IN ('obligation','prohibition','right','definition','procedure')),
  created_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own compliance requirements"
  ON public.compliance_requirements USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX compliance_requirements_job_id ON public.compliance_requirements(job_id);

-- Findings per contract (three tiers: non_compliant / risky / compliant)
CREATE TABLE public.compliance_findings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES public.compliance_jobs(id) ON DELETE CASCADE,
  contract_doc_id  UUID NOT NULL REFERENCES public.compliance_documents(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Three-tier classification
  compliance_tier  TEXT NOT NULL CHECK (compliance_tier IN ('non_compliant','risky','compliant')),
  risk_basis       TEXT CHECK (risk_basis IN ('interpretive','future_legislation','ambiguous_drafting')),
  -- For grouping/filtering by legal topic in the dashboard
  topic_area       TEXT,             -- e.g. 'Data Processing', 'Liability', 'Termination', 'IP Rights'
  clause_text      TEXT,
  legislation_ref  TEXT NOT NULL,
  issue_summary    TEXT NOT NULL,
  suggested_fix    TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.compliance_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own compliance findings"
  ON public.compliance_findings USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX compliance_findings_job_id ON public.compliance_findings(job_id);
CREATE INDEX compliance_findings_contract ON public.compliance_findings(contract_doc_id, compliance_tier);
CREATE INDEX compliance_findings_topic ON public.compliance_findings(job_id, topic_area);
```

---

## File Storage

**Bucket:** existing `documents` bucket — no policy changes needed.

**Paths:**
```
{userId}/compliance/{jobId}/legislation/{sanitisedName}       ← original
{userId}/compliance/{jobId}/legislation/{sanitisedName}.txt   ← extracted text
{userId}/compliance/{jobId}/contracts/{sanitisedName}
{userId}/compliance/{jobId}/contracts/{sanitisedName}.txt
```

Text extracted at upload time → stored as `.txt`. All processing reads `.txt` only.

Sanitise: `fileName.replace(/[^a-zA-Z0-9._-]/g, '_')`

---

## Chunking Strategy (`src/lib/chunk-text.ts`)

Target: **30,000 chars per chunk**, hard max 35,000.

**Split priority:**
1. `\n\n` before section/article headings — regex: `/\n\n(?=(?:Article|Section|PART|CHAPTER|\d+\.)\s)/i`
2. Double newline
3. Single newline
4. Hard split at 35,000 chars

**Context carry-forward:** Track last heading. Prepend to next chunk so Claude knows which article it's reading.

**Contracts:** Truncate at 60,000 chars for MVP. Flag in UI. If contract exceeds 60K, chunk it, run Pass 2 per chunk, merge findings (deduplicate by `legislation_ref + clause_text`).

---

## AI Prompts

### Pass 1 — Extract Requirements (per legislation chunk)

**System:**
```
You are a legal analyst. Extract discrete actionable legal requirements from legislative text 
that would directly affect the drafting of a commercial contract.

Respond with a JSON array only — no markdown. Each item:
{
  "articleRef": "exact section reference e.g. 'Article 6(1)(a)'",
  "requirementText": "plain English starting with 'A contract must...' or 'The following is prohibited...'",
  "obligationType": "obligation" | "prohibition" | "right" | "definition" | "procedure"
}

Rules:
- Only include requirements relevant to commercial contract drafting
- Skip recitals, preambles, procedural meta-rules about the legislation
- One object per distinct obligation
- Max 50 per response — prioritise obligations and prohibitions
```

### Pass 2 — Contract Analysis (per contract)

**System:**
```
You are a specialist compliance lawyer auditing commercial contracts on behalf of a law firm.
For each requirement, classify the contract's position in one of THREE tiers:

NON_COMPLIANT — the contract clearly and directly contravenes the requirement. No ambiguity.
RISKY — the contract may technically comply today but carries risk: ambiguous language that 
  could be challenged, poor drafting with unintended exposure, or it complies now but conflicts 
  with the clear direction of anticipated legislation or regulatory guidance.
COMPLIANT — the contract clearly and adequately satisfies the requirement.

Also classify each finding into a legal topic area — one of:
"Data Processing", "Liability", "Termination", "Intellectual Property", "Confidentiality",
"Payment Terms", "Dispute Resolution", "Employment", "Regulatory", "Other"

Respond with valid JSON only — no markdown:
{
  "contractSummary": "1 sentence: contract type and parties",
  "overallStatus": "compliant" | "risky" | "non_compliant",
  "findings": [
    {
      "legislationRef": "e.g. 'GDPR Article 28(3)(a)'",
      "requirementText": "the requirement being assessed",
      "clauseText": "verbatim excerpt from the contract, or null if the requirement is absent",
      "complianceTier": "non_compliant" | "risky" | "compliant",
      "riskBasis": "interpretive" | "future_legislation" | "ambiguous_drafting" | null,
      "topicArea": "Data Processing" | "Liability" | "Termination" | "Intellectual Property" | "Confidentiality" | "Payment Terms" | "Dispute Resolution" | "Employment" | "Regulatory" | "Other",
      "issueDescription": "specific explanation — for non_compliant: what the contract does wrong; for risky: what the risk is and why; for compliant: brief confirmation",
      "suggestedFix": "specific contract language or structural change — null for compliant findings"
    }
  ]
}

IMPORTANT: Include ALL requirements in findings — compliant ones too. 
The firm needs a complete picture, not just problems.
For riskBasis: only set this for risky tier findings. Set to null for non_compliant and compliant.
```

**User:**
```
LEGISLATION: [LEGISLATION_NAME]

REQUIREMENTS:
1. [articleRef]: [requirementText]
2. [articleRef]: [requirementText]
... (up to 150)

CONTRACT ([FILE_NAME]):
---
[CONTRACT_TEXT — truncated to 60,000 chars]
---
```

**After each contract:** derive `contract_status` from worst tier in findings. Update counts:
```sql
UPDATE compliance_documents 
SET contract_status = ?, contract_summary = ?,
    noncompliant_count = ?, risky_count = ?, compliant_count = ?,
    status = 'done'
WHERE id = ?

UPDATE compliance_jobs
SET contracts_done = contracts_done + 1,
    compliant_contracts = compliant_contracts + (1 if compliant else 0),
    risky_contracts = risky_contracts + (1 if risky else 0),
    noncompliant_contracts = noncompliant_contracts + (1 if non_compliant else 0)
WHERE id = ?
```

---

## New TypeScript Types (add to `src/lib/types.ts`)

```typescript
export type ComplianceJobStatus =
  | 'pending' | 'uploading' | 'extracting' | 'analysing' | 'complete' | 'error';

export type ComplianceTier = 'non_compliant' | 'risky' | 'compliant';

export type ComplianceRiskBasis = 'interpretive' | 'future_legislation' | 'ambiguous_drafting';

export type ComplianceTopicArea =
  | 'Data Processing' | 'Liability' | 'Termination' | 'Intellectual Property'
  | 'Confidentiality' | 'Payment Terms' | 'Dispute Resolution' | 'Employment'
  | 'Regulatory' | 'Other';

export interface ComplianceJob {
  id: string;
  user_id: string;
  matter_id?: string;
  name: string;
  legislation_name: string;
  status: ComplianceJobStatus;
  error_message?: string;
  requirements_count: number;
  total_contracts: number;
  contracts_done: number;
  compliant_contracts: number;
  risky_contracts: number;
  noncompliant_contracts: number;
  created_at: string;
  updated_at: string;
}

export type ComplianceDocType = 'legislation' | 'contract';
export type ContractStatus = 'compliant' | 'risky' | 'non_compliant';

export interface ComplianceDocument {
  id: string;
  job_id: string;
  user_id: string;
  doc_type: ComplianceDocType;
  file_name: string;
  file_type: 'pdf' | 'docx';
  storage_path: string;
  char_count?: number;
  contract_status?: ContractStatus;
  contract_summary?: string;
  noncompliant_count: number;
  risky_count: number;
  compliant_count: number;
  status: 'pending' | 'done' | 'error';
  created_at: string;
}

export interface ComplianceRequirement {
  id: string;
  job_id: string;
  user_id: string;
  legislation_doc_id?: string;
  article_ref: string;
  requirement_text: string;
  obligation_type?: 'obligation' | 'prohibition' | 'right' | 'definition' | 'procedure';
}

export interface ComplianceFinding {
  id: string;
  job_id: string;
  contract_doc_id: string;
  user_id: string;
  compliance_tier: ComplianceTier;
  risk_basis?: ComplianceRiskBasis;
  topic_area?: ComplianceTopicArea;
  clause_text?: string;
  legislation_ref: string;
  issue_summary: string;
  suggested_fix?: string;
  created_at: string;
}
```

---

## New API Routes

All follow existing patterns: Bearer auth via `getAuthenticatedUser`, rate limiting, `safeErrorMessage`.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/compliance` | POST | Create job `{ name, legislationName, matterId? }` → `{ jobId }` |
| `/api/compliance/[jobId]` | GET | Job status + summary counts |
| `/api/compliance/[jobId]` | DELETE | Delete job + cascade + Storage cleanup |
| `/api/compliance/[jobId]/documents` | POST | Upload one file, extract text → Storage → `{ documentId, charCount }` |
| `/api/compliance/[jobId]/extract-chunk` | POST | `{ chunkText, legislationName, heading? }` → Claude → requirements array |
| `/api/compliance/[jobId]/save-requirements` | POST | `{ requirements[] }` → batch insert → update job counts |
| `/api/compliance/[jobId]/analyse-contract` | POST | `{ documentId, requirements[] }` → reads .txt → Claude → saves findings → `{ contractStatus, nonCompliantCount, riskyCount }` |
| `/api/compliance/[jobId]/findings` | GET | `?contractId=&tier=&topicArea=` filters → findings list |
| `/api/compliance/[jobId]/requirements` | GET | All requirements for job |
| `/api/compliance/[jobId]/summary` | GET | Aggregated dashboard data: topic counts, article counts, top problematic contracts |

**`/api/compliance/[jobId]/summary`** — computed on request from existing DB data:
```sql
-- Topic areas grouped by count
SELECT topic_area, compliance_tier, COUNT(*) as count
FROM compliance_findings WHERE job_id = ?
GROUP BY topic_area, compliance_tier
ORDER BY count DESC

-- Most contravened articles
SELECT legislation_ref, COUNT(DISTINCT contract_doc_id) as contracts_affected
FROM compliance_findings WHERE job_id = ? AND compliance_tier = 'non_compliant'
GROUP BY legislation_ref ORDER BY contracts_affected DESC LIMIT 10

-- Most problematic contracts
SELECT d.id, d.file_name, d.noncompliant_count, d.risky_count
FROM compliance_documents d WHERE d.job_id = ? AND d.doc_type = 'contract'
ORDER BY noncompliant_count DESC, risky_count DESC LIMIT 5
```

---

## New Pages

### `/compliance/new` — 3-step upload form

**Step 1:** Job name, legislation label, optional matter selector  
**Step 2:** Upload 1–5 legislation files (drop zone)  
**Step 3:** Upload contracts (multi-file drop zone, no limit; count badge)

Warning if >30 contracts: "Large batches will take 15–20 minutes. Keep this tab open."

On "Start Analysis": create job → upload all files → navigate to `/compliance/[jobId]`

### `/compliance/[jobId]` — Processing + Results (single page, two states)

**Processing state:**
- Phase indicator + progress bar (contracts_done / total_contracts)
- Per-contract list updating live: ⏳ → ⚙️ → ✅ N non-compliant, M risky | ❌ error
- `window.beforeunload` warning while active

**Orchestration hook (`src/hooks/use-compliance-run.ts`):**
```
Phase 1: chunk legislation → extract-chunk per chunk → save-requirements
Phase 2: loop contracts (status='pending') → analyse-contract per contract → update progress
On complete: update job status → switch to results view
```

**Results state (same page):**

*Section 1 — Summary Dashboard*
- Compliance rate gauge + distribution bar
- Top Areas of Concern (table: topic area / non-compliant / risky / compliant counts)
- Most Contravened Articles (ranked list)
- Most Problematic Contracts (top 5 cards)

*Section 2 — Contract Folders*

**Requires Attention** (non_compliant + risky contracts):
- Non-Compliant contracts first (sorted by noncompliant_count DESC)
- Risky contracts second (sorted by risky_count DESC)
- Click contract → expand finding view

**Compliant** (collapsed by default):
- All fully compliant contracts

*Per-contract finding view:*
- Contract summary line
- Status badge (Non-Compliant / Risky / Compliant)
- **Non-Compliant** section — red cards; legislation ref, clause excerpt, explanation, suggested fix
- **Risky** section — amber cards; risk basis badge, explanation, suggested fix
- **Compliant** section — green, collapsed by default, expandable

### `/compliance` — Jobs List

Cards: name, legislation, date, status badge, compliance rate bar (compliant/risky/non-compliant).  
Dashboard `View 3` (matter detail, `compliance_check` type) links here.

---

## New Components

| File | Purpose |
|------|---------|
| `src/components/compliance-upload-zone.tsx` | Multi-file drop zone with file list |
| `src/hooks/use-compliance-run.ts` | Orchestration hook |
| `src/components/compliance-progress.tsx` | Progress bar + per-contract live list |
| `src/components/compliance-dashboard.tsx` | Summary dashboard (metrics, charts, top lists) |
| `src/components/compliance-contract-folders.tsx` | Two folders: Requires Attention / Compliant |
| `src/components/compliance-findings-panel.tsx` | Per-contract finding view, tiered sections |
| `src/components/compliance-job-card.tsx` | List card with compliance rate bar |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add all compliance types |
| `supabase-schema.sql` | Add 4 new tables |
| `src/app/dashboard/page.tsx` | Wire compliance_check matter type to `/compliance/new?matter={id}` |
| `src/middleware.ts` | Verify `connect-src` covers Supabase Storage URL |

---

## Files to Create

```
src/lib/chunk-text.ts
src/hooks/use-compliance-run.ts
src/app/api/compliance/route.ts
src/app/api/compliance/[jobId]/route.ts
src/app/api/compliance/[jobId]/documents/route.ts
src/app/api/compliance/[jobId]/extract-chunk/route.ts
src/app/api/compliance/[jobId]/save-requirements/route.ts
src/app/api/compliance/[jobId]/analyse-contract/route.ts
src/app/api/compliance/[jobId]/findings/route.ts
src/app/api/compliance/[jobId]/requirements/route.ts
src/app/api/compliance/[jobId]/summary/route.ts
src/app/compliance/page.tsx
src/app/compliance/new/page.tsx
src/app/compliance/[jobId]/page.tsx
src/components/compliance-upload-zone.tsx
src/components/compliance-progress.tsx
src/components/compliance-dashboard.tsx
src/components/compliance-contract-folders.tsx
src/components/compliance-findings-panel.tsx
src/components/compliance-job-card.tsx
```

---

## Build Sequence

1. SQL tables → Supabase
2. Types → `src/lib/types.ts`
3. `src/lib/chunk-text.ts` — pure function (test manually with sample legislation)
4. `/api/compliance` POST → `/api/compliance/[jobId]/documents` POST
5. `/api/compliance/[jobId]/extract-chunk` → verify requirements JSON
6. `/api/compliance/[jobId]/save-requirements`
7. `/api/compliance/[jobId]/analyse-contract` → verify findings + counts saved
8. `/api/compliance/[jobId]/summary` → verify aggregated stats
9. `/compliance/new` — 3-step form
10. `use-compliance-run.ts` orchestration hook
11. `/compliance/[jobId]` — progress state
12. `/compliance/[jobId]` — results state: dashboard + folder view + finding panel
13. `/compliance` list page
14. Dashboard integration
15. `npm run build && npm run lint`

---

## Key Gotchas

- **Resumability:** Phase 2 loop fetches `compliance_documents` with `status='pending'` fresh from DB on reconnect. Never rely on local state.
- **Requirements cap:** Store all to DB; send only top 150 to Pass 2 (prioritise `prohibition` → `obligation`).
- **Include compliant findings:** The Pass 2 prompt must explicitly request ALL findings (compliant too) — this enables the law firm to see what's already well-drafted.
- **Claude JSON failures:** Catch `SyntaxError` per contract. Insert error finding, mark contract as `error`, continue loop.
- **File name sanitisation:** `replace(/[^a-zA-Z0-9._-]/g, '_')` before all Storage paths.
- **Tab close warning:** `window.addEventListener('beforeunload', handler)` while loop active; remove on complete.
- **Rate limits:** Use DB-backed check for job creation (count jobs in last hour) — in-memory limiter resets on Vercel cold starts.
- **Large legislation preview:** After Pass 1, show extracted requirements to user before starting Pass 2 — lets them verify quality and abort before 20 minutes of processing.
- **Summary dashboard computed at runtime:** Don't store aggregated stats beyond the job-level counters. Compute topic breakdowns and article rankings in `/api/compliance/[jobId]/summary` with GROUP BY queries — fast enough, always up to date.

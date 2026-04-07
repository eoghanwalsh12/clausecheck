# ClauseCheck

Next.js 14 (App Router) + Supabase + Anthropic SDK — AI-powered contract analysis tool.

## Stack

- **Framework**: Next.js 14, TypeScript, Tailwind CSS
- **Auth/DB**: Supabase (RLS enabled, `public.profiles` + `public.projects` + `public.deliverables`)
- **AI**: `@anthropic-ai/sdk` — claude-sonnet-4-6 (or latest capable model)
- **Editors**: Tiptap (rich text), react-pdf + mammoth (PDF/DOCX parsing)

## Key Paths

```
src/
  app/
    api/analyze/     # Contract analysis endpoint
    api/chat/        # Legal assistant chat endpoint
    api/parse/       # PDF/DOCX text extraction
    api/deliverables/ # Deliverable CRUD
    workspace/       # Main document workspace
    dashboard/       # Project list
  components/
    document-viewer.tsx    # PDF/DOCX display, edit/preview toggle
    chat-sidebar.tsx       # AI chat + deliverables tabs
    delivery-editor.tsx    # Tiptap editor for deliverables
    delivery-panel.tsx     # Deliverable type/format picker
    workspace-sidebar.tsx  # Project list sidebar
  lib/
    types.ts          # All shared types (Clause, ContractAnalysis, Deliverable, etc.)
    supabase.ts       # Client-side Supabase client
    supabase-server.ts # Server-side Supabase client
```

## Core Types (src/lib/types.ts)

- `ContractAnalysis` — full analysis result with clauses, risk scores, parties
- `Clause` — title, category, originalText, plainEnglish, riskLevel, suggestedAlternative
- `ChatMessage` — role/content/timestamp
- `Deliverable` — audience (client|partner), format (7 types), content, ai_generated_content
- `UserPosition` — role + optional customDescription (set before analysis)

## DB Schema

- `profiles` — id, email, plan (free|pro), analyses_this_month
- `projects` — id, user_id, file_name, document_text, html_content, file_type, position_role, chat_history (jsonb), analysis stored separately
- `deliverables` — id, project_id, user_id, audience, format, title, content, ai_generated_content

## Deployment Workflow

After every change, commit and push to main so Vercel auto-deploys:

```bash
git add <changed files>
git commit -m "description"
git push origin main
```

Vercel is connected to the `main` branch — each push triggers a deployment.

## Dev Commands

```bash
npm run dev     # localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

## Env vars

`.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`

## Gotchas / Non-obvious Constraints

- **CSP is strict** — no external scripts/fonts/images. Adding new external resources requires updating `connect-src` or relevant directive in `src/middleware.ts`.
- **react-pdf** — `canvas` aliased to `false` in webpack config; `DocumentViewer` must stay `dynamic({ ssr: false })` or it breaks.
- **Rate limiter is in-memory** — resets on serverless cold starts; not shared across Vercel instances. Don't rely on it for hard security limits.
- **Max upload**: 10 MB (`MAX_FILE_SIZE` in `validation.ts`). File type locked to `pdf` | `docx`.
- **Supabase client split** — never use `supabase.ts` (browser) in API routes; always use `supabase-server.ts` (cookie auth).
- **`chat_history` stored as jsonb** in `projects` table, not a separate table.
- **No auth redirects in middleware** — middleware only sets security headers. Auth gating is handled per-page via `useAuth()` hook.
- **`WorkspacePage`** wraps content in `<Suspense>` because it uses `useSearchParams()` — required by Next.js App Router.

## Patterns

- API routes use `supabase-server.ts` (cookie-based auth), components use `supabase.ts`
- Rate limiting via `src/lib/rate-limit.ts`
- Input validation via `src/lib/validation.ts`
- Middleware handles auth redirects (`src/middleware.ts`)
- All AI calls stream responses where possible
- Deliverable formats: `client_email`, `written_report`, `annotated_document`, `presentation_outline`, `letter_of_advice`, `negotiation_playbook`, `risk_register`

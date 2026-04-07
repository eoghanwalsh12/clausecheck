# Feature: Clients & Matters

**Status**: Planned — not yet implemented  
**Goal**: Add a two-level organisational layer (Clients → Matters) for law firm use, enabling management of multiple clients and their contract engagements.

---

## Why

ClauseCheck is being positioned for sale to law firms. Firms need to organise documents by client and by engagement (matter). The current flat project list doesn't support this. This feature also lays the database groundwork for a future **compliance checker** (upload legislation + multiple contracts, flag contraventions).

---

## Terminology

| Term | Definition |
|------|-----------|
| **Client** | A law firm's end-client (e.g. "Acme Corp") |
| **Matter** | A discrete engagement within a client (e.g. "Q1 Supplier Review") |
| **Project/Document** | The existing model — a single uploaded document with analysis and chat history |

---

## Hierarchy

```
User
└── Client
    └── Matter  (matter_type: analysis | compliance_check | due_diligence)
        └── Project / Document  (existing model, gets matter_id FK)
```

---

## Database Changes (run in Supabase SQL editor)

```sql
-- 1. Clients
CREATE TABLE public.clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  contact_name TEXT,
  company_type TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clients" ON public.clients
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX clients_user_id ON public.clients(user_id);

-- 2. Matters
CREATE TYPE matter_type AS ENUM ('analysis', 'compliance_check', 'due_diligence');
CREATE TABLE public.matters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  matter_type matter_type NOT NULL DEFAULT 'analysis',
  status      TEXT DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.matters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own matters" ON public.matters
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX matters_client_id ON public.matters(client_id);
CREATE INDEX matters_user_id ON public.matters(user_id);

-- 3. Link projects to matters
ALTER TABLE public.projects ADD COLUMN matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL;
CREATE INDEX projects_matter_id ON public.projects(matter_id);
```

---

## New Types (`src/lib/types.ts`)

```typescript
export type MatterType = 'analysis' | 'compliance_check' | 'due_diligence';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  contact_name?: string;
  company_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  matter_count?: number;
}

export interface Matter {
  id: string;
  client_id: string;
  user_id: string;
  name: string;
  description?: string;
  matter_type: MatterType;
  status: string;
  created_at: string;
  updated_at: string;
  project_count?: number;
}
```

---

## New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/clients` | GET | List user's clients (with matter count) |
| `/api/clients` | POST | Create client |
| `/api/clients/[id]` | GET | Get client with its matters |
| `/api/clients/[id]` | PATCH | Update client |
| `/api/clients/[id]` | DELETE | Delete client (matters cascade, projects get matter_id=null) |
| `/api/matters` | GET | List matters, filter by `?clientId=` |
| `/api/matters` | POST | Create matter |
| `/api/matters/[id]` | GET | Get matter with projects |
| `/api/matters/[id]` | PATCH | Update matter |
| `/api/matters/[id]` | DELETE | Delete matter |

Also update:
- `POST /api/projects` — accept optional `matterId`
- `PATCH /api/projects/[id]` — accept `matterId` for reassignment
- `GET /api/projects` — accept `?matterId=` and `?clientId=` filters

---

## Dashboard Redesign (`src/app/dashboard/page.tsx`)

Full rewrite. Three views managed as state (no new routes).

**View 1 — Clients list**
- Header: "Clients" + `[+ New Client]`
- Client folder cards: name, doc count, last active
- "Uncategorised" card at bottom (projects with no matter_id)

**View 2 — Client detail**
- Breadcrumb: `← Clients / Acme Corp`
- Inline editable client metadata (contact, company type, notes)
- `[+ New Matter]`
- Matter cards: name, type badge, doc count, last updated
- Click matter with 1 doc → workspace directly
- Click matter with 0 or >1 docs → View 3

**View 3 — Matter detail**
- Breadcrumb: `← Clients / Acme Corp / Q1 Review`
- `[+ Add Document]` → workspace with `?matter={id}` pre-filled
- Document list (same card style as existing project cards)
- Future: `[+ Compliance Check]` (disabled, "Coming Soon")

**Design**: Use `frontend-design` skill. Follow dark legal editorial aesthetic — Playfair Display headings, existing CSS variables. No new external fonts (CSP strict).

---

## New Components

| File | Purpose |
|------|---------|
| `src/components/client-card.tsx` | Client folder card |
| `src/components/matter-card.tsx` | Matter row with type badge |
| `src/components/create-client-modal.tsx` | Create/edit client modal |
| `src/components/create-matter-modal.tsx` | Create/edit matter modal |
| `src/components/assign-matter-selector.tsx` | Dropdown to assign project to matter |

---

## Workspace Changes (`src/app/workspace/page.tsx`)

Minor updates:
1. Accept `?matter={id}` URL param — auto-assign new project to this matter on creation
2. Show breadcrumb: `Acme Corp > Q1 Review > filename.pdf`
3. If no matter pre-filled, show optional "Assign to client/matter" after project save

---

## Verification Checklist

- [ ] `npm run build` — zero type errors
- [ ] Create client → create matter → upload document → appears under matter
- [ ] Legacy uncategorised projects still open correctly
- [ ] Delete client → matters deleted, projects get matter_id = null (not deleted)
- [ ] RLS: two users cannot see each other's clients/matters
- [ ] `npm run lint`

---

## Future Scope (not in this feature)

- **Compliance checker**: `compliance_checks` table with `matter_id` FK, legislation uploads, contravention findings
- **Multi-doc analysis**: cross-document AI analysis within a matter
- **Matter status workflow**: draft → active → closed
- **Client portal / sharing**

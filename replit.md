# QueueCutter

## Overview

QueueCutter is an AI paperwork copilot for government forms. It turns confusing government paperwork into a guided conversation and produces a ready-to-submit filled PDF, a required document checklist, a step-by-step submission guide, and warnings for missing or inconsistent answers.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + shadcn/ui + Tailwind CSS
- **PDF generation**: pdf-lib

## Supported Forms (MVP)

1. **SNAP Benefits Application** — 15 questions covering identity, address, household size, income, assets, citizenship
2. **Change of Address Request** — 15 questions for USPS mail forwarding + voter registration update

## Key Features

- Schema-driven form engine (forms defined in `artifacts/api-server/src/lib/forms.ts`)
- Guided step-by-step interview UX (one question per step with back/next navigation)
- Field mapping transparency (user answers → official form field labels)
- Warning engine: missing fields, format errors, eligibility hints, cross-field inconsistencies
- Document checklist: categorized as "carry", "verify", "do next"
- Step-by-step submission guide (form-specific)
- PDF generation using pdf-lib (professional formatted document)

## Architecture

### Frontend (`artifacts/queue-cutter/`)
- `/` — Form catalog / home page
- `/forms/:formId` — Form detail + start CTA
- `/session/:sessionId` — Guided interview
- `/session/:sessionId/preview` — Field preview + PDF download
- `/session/:sessionId/checklist` — Document checklist + submission guide
- `/session/:sessionId/warnings` — Warnings list

### Backend (`artifacts/api-server/`)
- `src/lib/forms.ts` — Form schemas (all 2 forms defined here)
- `src/lib/warnings.ts` — Warning engine
- `src/lib/checklist.ts` — Checklist + submission steps generator
- `src/lib/pdf-generator.ts` — PDF generation with pdf-lib
- `src/routes/forms.ts` — GET /api/forms, GET /api/forms/:formId
- `src/routes/sessions.ts` — Full session CRUD + preview/warnings/checklist/PDF

### Database (`lib/db/`)
- `sessions` table: id, form_id, form_name, status, current_step, total_steps, answers (jsonb), completion_percent

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## AI Copilot Features

Powered by OpenAI via Replit AI Integrations (no API key required, billed to Replit credits).

Two AI endpoints in `artifacts/api-server/src/routes/ai.ts`:

- `POST /api/ai/explain` — given a question ID + form context, returns a plain-language explanation, why the government asks it, common mistakes, and a concrete example answer
- `POST /api/ai/interpret` — given a user's free-text input, normalizes it to the expected format (e.g. "around 2 grand a month" → "2000", "born in 85" → asks for clarification), with high/medium/low confidence scoring

The session interview page (`artifacts/queue-cutter/src/pages/session.tsx`) uses both:
- **Help button** (top-right of each question card) — triggers `aiExplain`, expands an AI Copilot panel below the question header
- **"Clean up my answer with AI" link** (below text/number/textarea inputs) — triggers `aiInterpret`, shows interpreted value with confidence badge and accept/reject choice

**Important**: `gpt-5-mini` is a reasoning model. `max_completion_tokens` must be set high (4096 for explain, 2048 for interpret) so reasoning tokens don't exhaust the budget before producing output.

## Non-Goals (MVP)

- No live government system integration
- No auto-filing or submission
- No claim of official legal correctness
- No more than 2 forms in MVP

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

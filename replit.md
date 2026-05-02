# QueueCutter

## Overview

QueueCutter is an AI paperwork copilot for government forms. It turns confusing government paperwork into a guided conversation and produces a ready-to-submit filled PDF, a required document checklist, a step-by-step submission guide, rejection risk scoring, and warnings for missing or inconsistent answers. Supports USA, India, and UK forms.

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

## Supported Forms (MMP — 6 forms, 3 countries)

### 🇺🇸 United States
1. **SNAP Benefits Application** — 15 questions: identity, address, household, income, assets, citizenship
2. **Social Security Card Replacement** — 11 questions: name change, identity, citizenship proof
3. **Change of Address Request** — 15 questions: USPS mail forwarding + voter registration update

### 🇮🇳 India
4. **Income Certificate** — 12 questions: Aadhaar, occupation, annual income, family details
5. **Domicile / Residence Certificate** — 11 questions: Aadhaar, residency years, purpose

### 🇬🇧 United Kingdom
6. **Council Tax Reduction Application** — 12 questions: NI number, income, Universal Credit, savings
7. **Proof of Address Letter for Benefits** — 8 questions: DWP proof of address

## MMP Features

### Country Layer
- Country selector landing page (`/`) with 🇺🇸🇮🇳🇬🇧 cards
- Per-country form catalog at `/catalog/:countryCode`
- All forms have `countryCode` field; DB schema stores `countryCode` + `persona`

### Persona Detection
- 3-question profiling at `/persona/:sessionId` (role, prior experience, paperwork comfort)
- Persona stored in session; propagated to AI simplification, checklist, and risk score
- Users can skip profiling; all features degrade gracefully

### AI Question Simplification
- `POST /api/ai/simplify` — rewrites questions for confused/first-time users based on persona
- Auto-triggers on step load if persona.comfort is "I find it confusing" or "I manage okay"
- Cached per question in memory (no duplicate AI calls)
- Silently falls back to original question text on failure

### Rejection Risk Score
- `GET /api/sessions/:id/risk-score` — scores 0-100 (higher = more rejection risk)
- Factors: missing required fields (+10), cross-field inconsistencies (+15), eligibility warnings (+10), optional blanks (+3), known rejection patterns (+10)
- Displayed on preview page as colored gauge (green/amber/red) with factor list and disclaimer

### Adaptive Checklist
- `rejectionRisk: true` flag on high-risk checklist items (Aadhaar, NI number, originals, SSN, etc.)
- Red "Rejection Risk" badges on flagged items
- Persona-aware notes (extra guidance for confused users, seniors, first-timers, rejected applicants)
- Country-specific document names and requirements
- Trust disclaimer per country at the bottom of checklist

### Before/After Demo Screen
- `/session/:sessionId/compare` — split layout: dark bureaucratic left, clean modern right
- Timer showing "What used to take 3 visits now starts correctly in X minutes"
- Official field codes on left, friendly answers on right

### Hindi Hints (India forms)
- `hintHi` field on all India form questions
- 🇮🇳 EN/हि toggle button appears on India form questions
- Shows Hindi hint text when toggled

### Trust / Disclaimer Layer
- Disclaimer on every country catalog page
- Per-form disclaimer in checklist sidebar
- Country-specific disclaimers (India: Tehsil variance; UK: council variation; US: requirements may vary)
- Risk score disclaimer ("not a guarantee, determined by government authority")
- PDF header marked as DRAFT

## Architecture

### Frontend (`artifacts/queue-cutter/`)
- `/` — Country selector (USA, India, UK)
- `/catalog/:countryCode` — Per-country form listing
- `/forms/:formId` — Form detail + start CTA → redirects to `/persona/:sessionId`
- `/persona/:sessionId` — 3-question persona profiling (skippable)
- `/session/:sessionId` — Guided interview (with Hindi hints + AI simplification)
- `/session/:sessionId/preview` — Field preview + rejection risk score gauge
- `/session/:sessionId/compare` — Before/after split view + timer
- `/session/:sessionId/checklist` — Adaptive checklist with rejection risk badges + disclaimer
- `/session/:sessionId/warnings` — Warnings list

### Backend (`artifacts/api-server/`)
- `src/lib/forms.ts` — All 6 form schemas with `countryCode`, `hintHi`, `commonRejectionReasons`, `submissionMethod`
- `src/lib/warnings.ts` — Warning engine
- `src/lib/checklist.ts` — Persona-aware checklist generator with `rejectionRisk` flags and country disclaimers
- `src/lib/risk-score.ts` — Rejection risk score calculator (0-100)
- `src/lib/pdf-generator.ts` — PDF generation with pdf-lib
- `src/routes/forms.ts` — GET /api/forms?countryCode=, GET /api/forms/:formId
- `src/routes/index.ts` — GET /api/countries inline handler
- `src/routes/sessions.ts` — Full session CRUD + persona PUT + risk-score GET + preview/warnings/checklist/PDF
- `src/routes/ai.ts` — explain, interpret, simplify (persona-aware), inconsistencies

### Database (`lib/db/`)
- `sessions` table: id, form_id, form_name, **country_code**, status, current_step, total_steps, answers (jsonb), **persona (jsonb)**, completion_percent

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## AI Endpoints

Powered by OpenAI via Replit AI Integrations (no API key required).

- `POST /api/ai/explain` — plain-language explanation, why we ask, common mistakes, example
- `POST /api/ai/interpret` — normalize free-text to structured value (high/medium/low confidence)
- `POST /api/ai/simplify` — rewrite question for user persona (comfort level aware)
- `POST /api/ai/inconsistencies` — cross-field logical consistency check

**Important**: `gpt-5-mini` is a reasoning model. `max_completion_tokens` must be ≥ 1024 or reasoning tokens exhaust the budget before producing output (use 4096 for explain, 2048 for others).

## Non-Goals

- No live government system integration
- No auto-filing or submission
- No claim of official legal correctness

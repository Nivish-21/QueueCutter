# QueueCutter

![QueueCutter](https://img.shields.io/badge/Status-Active-success) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Node](https://img.shields.io/badge/Node.js-24-green)

QueueCutter is an AI-powered paperwork copilot designed to simplify government forms. It transforms confusing, bureaucratic government paperwork into a friendly, guided conversation. The application generates a ready-to-submit filled PDF, a required document checklist, a step-by-step submission guide, rejection risk scoring, and warnings for missing or inconsistent answers.

Currently supports forms from the USA, India, and the UK.

## ✨ Features

- **AI Form Discovery**: Free-text search on the home page — describe your situation and the AI routes you directly to the right form, or explains why nothing matched.
- **Country Layer**: Country selector (`/`) for 🇺🇸 USA, 🇮🇳 India, and 🇬🇧 UK forms.
- **Persona Detection**: Profiling to gauge the user's comfort with paperwork and tailor the AI's simplicity.
- **AI Question Simplification**: Automatically rewrites bureaucratic questions for confused or first-time users.
- **Rejection Risk Score**: Calculates a score (0-100) based on missing fields, cross-field inconsistencies, and known rejection patterns.
- **Adaptive Checklist**: Generates a dynamic document checklist flagging high-risk items (e.g., Aadhaar, SSN).
- **Country-specific Escalation**: Step-by-step escalation paths for all 7 forms — US (SNAP appeal, SSA complaint, USPS consumer affairs), IN (DM office, District Collector, DLSA), GB (Valuation Tribunal, Local Government Ombudsman).
- **Before/After Split View**: A demonstration screen comparing the traditional form UI with the QueueCutter UI.
- **Multi-Language Hints**: Native Hindi (हि) translation hints for Indian forms.
- **Trust & Disclaimers**: Context-aware warnings per country highlighting that this is a draft and rules may vary by local authority.

## 📋 Supported Forms

All forms are statically defined server-side in `artifacts/api-server/src/lib/forms.ts`. There is no admin interface for adding forms at runtime.

### 🇺🇸 United States
1. **SNAP Benefits Application** — Identity, address, household, income, assets, citizenship.
2. **Social Security Card Replacement** — Name change, identity, citizenship proof.
3. **Change of Address Request** — USPS mail forwarding + voter registration update.

### 🇮🇳 India
4. **Income Certificate** — Aadhaar, occupation, annual income, family details.
5. **Domicile / Residence Certificate** — Aadhaar, residency years, purpose.

### 🇬🇧 United Kingdom
6. **Council Tax Reduction Application** — NI number, income, Universal Credit, savings.
7. **Proof of Address Letter for Benefits** — DWP proof of address.

## 🏗️ Architecture & Tech Stack

This project is a monorepo managed with **pnpm workspaces**.

- **Frontend (`artifacts/queue-cutter/`)**: React 19, Vite, Tailwind CSS v4, shadcn/ui, wouter (routing), TanStack Query (server state).
- **Backend (`artifacts/api-server/`)**: Express 5, Node.js 24, esbuild (bundles to ESM with CJS compat shims).
- **Database (`lib/db/`)**: PostgreSQL with Drizzle ORM. Only sessions are persisted; forms are statically hardcoded.
- **Validation & API**: Zod (`zod/v4`), Orval (OpenAPI codegen → TanStack Query hooks + Zod validators).
- **PDF Generation**: `pdf-lib` (generated PDFs are cached in-memory per server process — cache is lost on restart).
- **AI Integrations**: OpenAI (`gpt-5-mini`) via four custom endpoints.

## 🚀 Getting Started

### Prerequisites
- Node.js v24+
- pnpm v9+
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/QueueCutter.git
   cd QueueCutter
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your database and AI integration keys.

4. Push the database schema:
   ```bash
   pnpm --filter @workspace/db run push
   ```

5. Start each artifact in a separate terminal:
   ```bash
   # Backend (builds then starts; no hot-reload)
   PORT=3001 DATABASE_URL=postgresql://postgres@localhost:5432/queuecutter pnpm --filter @workspace/api-server run dev

   # Frontend (Vite dev server with HMR — proxies /api to the backend)
   PORT=3000 BASE_PATH=/ VITE_API_PROXY_TARGET=http://localhost:3001 pnpm --filter @workspace/queue-cutter run dev
   ```

   > `PORT` and `BASE_PATH` are required by the Vite config. `VITE_API_PROXY_TARGET` proxies `/api` requests to the API server in dev (not needed in production, where the API server serves the frontend directly).

## 🛠️ Key Commands

- `pnpm run typecheck` — Run full TypeScript typecheck across all packages.
- `pnpm run build` — Typecheck then build all packages.
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API hooks and Zod schemas from the OpenAPI spec (re-run after editing `lib/api-spec/openapi.yaml`).
- `pnpm --filter @workspace/scripts run smoke-test` — Run the full end-to-end API smoke test (session lifecycle, risk score, PDF generation).

## 🧠 AI Endpoints

All endpoints use the `gpt-5-mini` model and parse JSON from the LLM response via an internal `extractJson()` helper.

- `POST /api/ai/discover` — Takes a free-text situation description and returns the best matching form from the catalog, or `null` with a reason if nothing fits.
- `POST /api/ai/explain` — Provides plain-language explanations and common mistakes for specific fields.
- `POST /api/ai/interpret` — Normalises free-text answers into structured formats.
- `POST /api/ai/simplify` — Rewrites questions dynamically based on the user's selected persona. Returns the original question unchanged if the persona is null or comfort level is already high.
- `POST /api/ai/inconsistencies` — Cross-checks fields for logical consistency.

## ⚠️ Disclaimer

- **No live government system integration**: This tool does not interface with actual government portals.
- **No auto-filing**: The output is a filled PDF which the user must submit themselves.
- **No legal guarantee**: Risk scores and forms do not guarantee official legal correctness or acceptance.
- **In-memory PDF cache**: Generated PDFs are held in memory and are lost when the server restarts. Re-submit the session to regenerate.

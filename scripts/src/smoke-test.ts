/**
 * QueueCutter API smoke test
 * Run: pnpm --filter @workspace/scripts run smoke-test
 *
 * Exercises the full session lifecycle end-to-end against the running API.
 * All assertions throw on failure; exits 0 on success.
 */

const BASE = process.env.API_URL ?? "http://localhost:80";

async function get(path: string) {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  return r.json() as Promise<Record<string, unknown>>;
}

async function post(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}: ${await r.text()}`);
  return r.json() as Promise<Record<string, unknown>>;
}

async function put(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PUT ${path} → ${r.status}: ${await r.text()}`);
  return r.json() as Promise<Record<string, unknown>>;
}

async function patch(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${path} → ${r.status}: ${await r.text()}`);
  return r.json() as Promise<Record<string, unknown>>;
}

async function del(path: string) {
  const r = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (r.status !== 204) throw new Error(`DELETE ${path} → ${r.status} (expected 204)`);
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

async function run() {
  console.log(`\nQueueCutter smoke test → ${BASE}\n`);

  // ── Health ──────────────────────────────────────────────────────────────────
  console.log("Health");
  const health = await get("/api/healthz");
  assert(health["status"] === "ok", "healthz.status should be 'ok'");
  ok("GET /api/healthz → ok");

  // ── Form catalog ─────────────────────────────────────────────────────────────
  console.log("\nForm catalog");
  const forms = await get("/api/forms");
  const formList = forms["forms"] as Array<Record<string, unknown>>;
  assert(Array.isArray(formList) && formList.length >= 6, `expected ≥6 forms, got ${formList.length}`);
  ok(`GET /api/forms → ${formList.length} forms`);

  const snapForm = formList.find((f) => f["id"] === "snap-benefits");
  assert(!!snapForm, "snap-benefits form should exist");
  ok("snap-benefits form found");

  // ── Session lifecycle ────────────────────────────────────────────────────────
  console.log("\nSession lifecycle");
  const session = await post("/api/sessions", { formId: "snap-benefits", countryCode: "US" });
  const sessionId = session["id"] as string;
  assert(typeof sessionId === "string" && sessionId.length > 0, "session.id should be a UUID");
  assert(session["status"] === "in_progress", "new session should be in_progress");
  ok(`POST /api/sessions → ${sessionId.slice(0, 8)}… (in_progress)`);

  // Set persona
  const withPersona = await put(`/api/sessions/${sessionId}/persona`, {
    role: "Myself",
    priorExperience: "First time",
    comfort: "I find it confusing",
  });
  assert(withPersona["persona"] !== null, "persona should be set");
  ok("PUT /api/sessions/:id/persona → persona stored");

  // Answer all 16 SNAP questions
  const answers: Record<string, string> = {
    full_name: "Jane Smith",
    ssn: "123-45-6789",
    address: "123 Main St",
    city: "Springfield",
    state_abbr: "IL",
    zip: "62701",
    household_size: "3",
    monthly_income: "1800",
    employment_status: "Part-time employed",
    expenses_deduction: "yes",
    expense_amount: "450",
    expense_type: "Dependent care",
    prior_snap: "no",
    citizenship: "yes",
    authorized_representative: "no",
    signature_consent: "yes",
  };
  const answered = await put(`/api/sessions/${sessionId}/answers`, { answers, step: 16 });
  assert(answered["status"] === "completed", `expected completed, got ${answered["status"]}`);
  ok("PUT /api/sessions/:id/answers (step=16) → completed");

  // ── Risk score ───────────────────────────────────────────────────────────────
  console.log("\nRisk score");
  const risk = await get(`/api/sessions/${sessionId}/risk-score`);
  assert(typeof risk["score"] === "number", "risk.score should be a number");
  const level = risk["level"] as string;
  assert(["low", "medium", "high"].includes(level), `risk.level should be low/medium/high, got ${level}`);
  const components = risk["components"] as unknown[];
  assert(Array.isArray(components) && components.length === 5, "should have 5 risk components");
  ok(`GET /api/sessions/:id/risk-score → ${risk["score"]} (${level}), ${components.length} components`);

  // ── Warnings ─────────────────────────────────────────────────────────────────
  console.log("\nWarnings");
  const warnings = await get(`/api/sessions/${sessionId}/warnings`);
  assert(typeof warnings["errorCount"] === "number", "warnings.errorCount should be a number");
  ok(`GET /api/sessions/:id/warnings → ${warnings["errorCount"]} errors, ${warnings["warningCount"]} warnings`);

  // ── Checklist ────────────────────────────────────────────────────────────────
  console.log("\nChecklist");
  const checklist = await get(`/api/sessions/${sessionId}/checklist`);
  const items = checklist["items"] as unknown[];
  assert(Array.isArray(items) && items.length > 0, "checklist.items should be non-empty");
  ok(`GET /api/sessions/:id/checklist → ${items.length} items`);

  // ── Preview ──────────────────────────────────────────────────────────────────
  console.log("\nPreview");
  const preview = await get(`/api/sessions/${sessionId}/preview`);
  const mappedFields = preview["mappedFields"] as unknown[];
  assert(Array.isArray(mappedFields), "preview.mappedFields should be an array");
  ok(`GET /api/sessions/:id/preview → ${mappedFields.length} fields, ${preview["missingCount"]} missing`);

  // ── Sessions list (DESC order) ────────────────────────────────────────────────
  console.log("\nSessions list");
  const list = await get("/api/sessions");
  const sessions = list["sessions"] as Array<Record<string, unknown>>;
  assert(Array.isArray(sessions) && sessions.length > 0, "sessions list should be non-empty");
  if (sessions.length >= 2) {
    const t0 = new Date(sessions[0]["updatedAt"] as string).getTime();
    const t1 = new Date(sessions[1]["updatedAt"] as string).getTime();
    assert(t0 >= t1, "sessions list should be ordered DESC by updatedAt");
    ok(`GET /api/sessions → ${sessions.length} sessions, correctly ordered newest-first`);
  } else {
    ok(`GET /api/sessions → ${sessions.length} session(s)`);
  }

  // ── PATCH status ─────────────────────────────────────────────────────────────
  console.log("\nStatus patch");
  const patched = await patch(`/api/sessions/${sessionId}/status`, { status: "in_progress" });
  assert(patched["status"] === "in_progress", "patched status should be in_progress");
  ok("PATCH /api/sessions/:id/status → in_progress");

  // ── PDF ──────────────────────────────────────────────────────────────────────
  console.log("\nPDF generation");
  const pdf = await post(`/api/sessions/${sessionId}/pdf`, {});
  assert(typeof pdf["downloadUrl"] === "string", "pdf.downloadUrl should be a string");
  const pdfDownload = await fetch(`${BASE}${pdf["downloadUrl"]}`);
  assert(pdfDownload.status === 200, `PDF download → ${pdfDownload.status}`);
  assert(pdfDownload.headers.get("content-type") === "application/pdf", "PDF content-type should be application/pdf");
  ok(`POST /api/sessions/:id/pdf + download → ${(await pdfDownload.arrayBuffer()).byteLength} bytes`);

  // ── DELETE ───────────────────────────────────────────────────────────────────
  console.log("\nCleanup");
  await del(`/api/sessions/${sessionId}`);
  ok("DELETE /api/sessions/:id → 204");

  const gone = await fetch(`${BASE}/api/sessions/${sessionId}`);
  assert(gone.status === 404, `expected 404 after delete, got ${gone.status}`);
  ok("GET /api/sessions/:id after delete → 404 (confirmed gone)");

  console.log("\n✅  All smoke tests passed\n");
}

run().catch((err: Error) => {
  console.error(`\n❌  ${err.message}\n`);
  process.exit(1);
});

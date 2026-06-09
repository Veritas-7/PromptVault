import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { chromium } from "playwright";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const HOST = "127.0.0.1";
const BRIDGE_PORT = Number.parseInt(process.env.PROMPTVAULT_QA_BRIDGE_PORT ?? "5174", 10);
const APP_PORT = Number.parseInt(process.env.PROMPTVAULT_QA_APP_PORT ?? "5177", 10);
const WORK_SESSION_LIMIT = Number.parseInt(
  process.env.PROMPTVAULT_QA_WORK_SESSION_LIMIT ?? "50",
  10,
);
const DATABASE_PATH = process.env.PROMPTVAULT_QA_DATABASE
  ?? join(mkdtempSync(join(tmpdir(), "promptvault-browser-qa-")), "qa.sqlite");
const SECRET_ENV_DIR = mkdtempSync(join(tmpdir(), "promptvault-browser-qa-env-"));
const SECRET_ENV_PATH = join(SECRET_ENV_DIR, "secrets.env");
const START_TIMEOUT_MS = Number.parseInt(process.env.PROMPTVAULT_QA_START_TIMEOUT_MS ?? "90000", 10);
writeFileSync(SECRET_ENV_PATH, "");

function step(label) {
  console.log(`[qa] ${label}`);
}

function validatePort(value, name) {
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be a TCP port number, got ${value}`);
  }
}

validatePort(BRIDGE_PORT, "PROMPTVAULT_QA_BRIDGE_PORT");
validatePort(APP_PORT, "PROMPTVAULT_QA_APP_PORT");
if (!Number.isInteger(WORK_SESSION_LIMIT) || WORK_SESSION_LIMIT < 1 || WORK_SESSION_LIMIT > 50_000) {
  throw new Error(
    `PROMPTVAULT_QA_WORK_SESSION_LIMIT must be an integer from 1 to 50000, got ${WORK_SESSION_LIMIT}`,
  );
}

function spawnServer(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: PROJECT_ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  child.stdout.on("data", (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${label}] ${chunk}`));
  child.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      process.stderr.write(`[${label}] exited with code ${code}\n`);
    } else if (signal) {
      process.stderr.write(`[${label}] exited by signal ${signal}\n`);
    }
  });
  return child;
}

function bridgeQaEnv() {
  return {
    ...process.env,
    PROMPTVAULT_SECRET_ENV: SECRET_ENV_PATH,
    OPENAI_API_KEY: "",
    GLM_API_KEY: "",
    GLM_API_KEY_2: "",
  };
}

function insertSyntheticApprovedReviewQueueRow() {
  execFileSync("sqlite3", [
    DATABASE_PATH,
    `INSERT OR REPLACE INTO project_work_log_review_queue (
        candidate_id, first_seen_at, last_seen_at, review_state, review_reason,
        provider_route, project, source_path, source_file, candidate_reason,
        excerpt, line_count, char_count, risk_flags_json, modified_at
      ) VALUES (
        'work-log-QA-approved-browser-a1',
        '2026-06-09T00:00:00Z',
        '2026-06-09T00:00:00Z',
        'approved',
        'operator_approved_for_backfill',
        'ai_provider',
        'QAProject',
        '/tmp/QAProject/workingd.md',
        'workingd.md',
        'missing_dated_heading',
        '- 2026-06-09: Verified approved queue browser save',
        1,
        54,
        '[]',
        NULL
      );`,
  ], { stdio: "pipe" });
}

function normalizationReviewQueueFixtureFromItem(item) {
  const now = new Date().toISOString();
  const base = {
    ...item,
    first_seen_at: now,
    last_seen_at: now,
    provider: "local-normalization-rules",
    provider_model: null,
    provider_runtime: "local-normalization-rules",
    used_ai: false,
    accepted: false,
    rejection_reason: "local_fallback_requires_ai_review",
    original_status: "logged",
    normalized_status: "unknown",
    confidence: 0.5,
    risk_flags: [],
  };
  const pending = {
    ...base,
    candidate_id: "work-normalize-QAFixture-pending-a1",
    review_state: "pending_review",
    review_reason: "local_fallback_requires_ai_review",
    project: "QAFixture",
    date: "2026-06-09",
    source_path: "/tmp/QAFixture/working.md",
    source_file: "working.md",
    reason: "no_ai_normalization,no_session_evidence",
    original_title: "QA fixture pending normalization row",
    original_evidence: "A live pending row should keep approve and reject actions.",
    normalized_title: "QA fixture pending normalized row",
    normalized_evidence: "Pending fixture row remains actionable in both directions.",
  };
  const stale = {
    ...pending,
    candidate_id: "work-normalize-QAFixture-stale-a1",
    review_state: "stale",
    review_reason: "proposal_no_longer_live",
    original_title: "QA fixture stale normalization row",
    original_evidence: "A stale row is no longer part of the live proposal set.",
    normalized_title: "QA fixture stale normalized row",
    normalized_evidence: "Stale fixture row should expose reject cleanup only.",
  };
  return {
    generated_at: now,
    database_path: DATABASE_PATH,
    synced_proposal_count: 1,
    stale_proposal_count: 1,
    total_items: 2,
    returned_item_count: 2,
    pending_review_count: 1,
    stale_count: 1,
    approved_count: 0,
    rejected_count: 0,
    accepted_proposal_count: 0,
    rejected_proposal_count: 2,
    items: [pending, stale],
    warnings: [],
  };
}

function rejectedAiNormalizationReviewQueueFixtureFromItem(item) {
  const now = new Date().toISOString();
  const base = {
    ...item,
    first_seen_at: now,
    last_seen_at: now,
    provider: "glm",
    provider_model: "glm-test-model",
    provider_runtime: "glm-chat-completions",
    used_ai: true,
    accepted: false,
    original_status: "logged",
    normalized_status: "current",
    risk_flags: [],
    project: "QAFixture",
    date: "2026-06-09",
    source_path: "/tmp/QAFixture/working.md",
    source_file: "working.md",
    reason: "no_ai_normalization,no_session_evidence,generic_title",
    work_item_count: 2,
    session_evidence_count: 1,
    saved_extraction_count: 0,
    ai_saved_extraction_count: 0,
    best_ai_confidence: null,
  };
  const lowConfidence = {
    ...base,
    candidate_id: "work-normalize-QAFixture-low-confidence-a1",
    review_state: "pending_review",
    review_reason: "low_confidence",
    rejection_reason: "low_confidence",
    original_title: "QA fixture low confidence normalization row",
    original_evidence: "2026-06-09: Low confidence AI normalization evidence.",
    normalized_title: "Low confidence AI normalization evidence",
    normalized_evidence: "2026-06-09: Low confidence AI normalization evidence.",
    confidence: 0.79,
  };
  const evidenceMismatch = {
    ...base,
    candidate_id: "work-normalize-QAFixture-evidence-mismatch-a1",
    review_state: "pending_review",
    review_reason: "evidence_not_in_candidate_evidence",
    rejection_reason: "evidence_not_in_candidate_evidence",
    original_title: "QA fixture evidence mismatch normalization row",
    original_evidence: "2026-06-09: Source-backed normalization evidence.",
    normalized_title: "Invented AI normalization evidence",
    normalized_evidence: "2026-06-09: Invented AI normalization evidence.",
    confidence: 0.95,
  };
  return {
    generated_at: now,
    database_path: DATABASE_PATH,
    synced_proposal_count: 2,
    stale_proposal_count: 0,
    total_items: 2,
    returned_item_count: 2,
    pending_review_count: 2,
    stale_count: 0,
    approved_count: 0,
    rejected_count: 0,
    accepted_proposal_count: 0,
    rejected_proposal_count: 2,
    items: [lowConfidence, evidenceMismatch],
    warnings: [],
  };
}

function unresolvedWorkStatusExportFixture() {
  const now = new Date().toISOString();
  return {
    generated_at: now,
    database_path: DATABASE_PATH,
    markdown: [
      "# PromptVault Project/Day Work Status",
      "",
      "## Project/Day Rows",
      "",
      "- QAFixture · 2026-06-09 · full-index unresolved session evidence",
    ].join("\n"),
    total_row_count: 2,
    row_offset: 0,
    returned_row_count: 2,
    next_row_offset: null,
    rows_truncated: false,
    report_total_items: 4,
    report_project_count: 2,
    report_date_count: 1,
    report_files_seen: 2,
    report_session_scan_prompt_count: 10867,
    report_session_evidence_count: 12,
    report_unique_session_evidence_count: 3,
    report_session_evidence_index_used: true,
    report_session_evidence_index_updated: false,
    report_session_evidence_index_count: 10867,
    report_session_evidence_index_total_count: 10867,
    report_session_evidence_mode: "metadata-first-raw-fallback",
    rows: [{
      date: "2026-06-09",
      project: "QAFixture",
      operational_status: "progress-log-only",
      source_statuses: [{ text: "logged", count: 2 }],
      work_item_count: 2,
      source_file_count: 1,
      source_files: ["working.md"],
      source_file_roles: [{ text: "handoff-log", count: 1 }],
      top_titles: ["Full index unresolved fixture"],
      sample_evidence: "2026-06-09: Full index unresolved fixture evidence.",
      latest_source_path: "/tmp/QAFixture/working.md",
      latest_source_file: "working.md",
      latest_source_role: "handoff-log",
      session_evidence_count: 0,
      unique_session_evidence_count: 0,
      session_sources: [],
      needs_session_evidence: true,
      session_evidence_audit: "unresolved-after-full-index",
      needs_title_normalization: true,
    }, {
      date: "2026-06-09",
      project: "QASupported",
      operational_status: "session-supported",
      source_statuses: [{ text: "done", count: 2 }],
      work_item_count: 2,
      source_file_count: 1,
      source_files: ["working.md"],
      source_file_roles: [{ text: "handoff-log", count: 1 }],
      top_titles: ["Session supported fixture"],
      sample_evidence: "2026-06-09: Supported fixture evidence.",
      latest_source_path: "/tmp/QASupported/working.md",
      latest_source_file: "working.md",
      latest_source_role: "handoff-log",
      session_evidence_count: 12,
      unique_session_evidence_count: 3,
      session_sources: [{ text: "Codex local sessions", count: 12 }],
      needs_session_evidence: false,
      session_evidence_audit: "matched",
      needs_title_normalization: false,
    }],
    warnings: [],
  };
}

function waitForHttp(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    async function attempt() {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await response.arrayBuffer();
          resolve();
          return;
        }
      } catch {
        // Server is not ready yet.
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(attempt, 250);
    }

    attempt();
  });
}

function sourceProcessedFileCount(sourceStateText, sourceLabel) {
  const row = sourceStateText.find((text) => text.includes(sourceLabel));
  const match = row?.match(/파일\s+([\d,]+)\s+\//);
  return match ? Number.parseInt(match[1].replaceAll(",", ""), 10) : 0;
}

function waitForBridgeHealth(timeoutMs) {
  const url = `http://${HOST}:${BRIDGE_PORT}/api/health`;
  const started = Date.now();
  return new Promise((resolve, reject) => {
    async function attempt() {
      try {
        const response = await fetch(url);
        const body = await response.json();
        if (response.ok && body?.ok === true && body?.database_path === DATABASE_PATH) {
          resolve();
          return;
        }
      } catch {
        // Server is not ready yet.
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(attempt, 250);
    }

    attempt();
  });
}

async function waitForEnabled(page, selector, timeout = 120000) {
  await page.waitForFunction((targetSelector) => {
    const element = document.querySelector(targetSelector);
    return Boolean(element && !element.disabled && element.getAttribute("aria-disabled") !== "true");
  }, selector, { timeout });
}

async function bridgeJson(page, path, body = {}) {
  return page.evaluate(
    async ({ path, body, bridgePort }) => {
      const response = await fetch(`http://127.0.0.1:${bridgePort}${path}`, {
        method: path === "/api/health" ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: path === "/api/health" ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`${path} HTTP ${response.status}: ${text}`);
      }
      return JSON.parse(text);
    },
    { path, body, bridgePort: BRIDGE_PORT },
  );
}

async function clickAndWait(page, selector, predicate, timeout = 120000) {
  await page.locator(selector).click();
  await page.waitForFunction(predicate, undefined, { timeout });
}

async function withMockedNormalizationReviewQueue(page, result, callback) {
  const url = `http://${HOST}:${BRIDGE_PORT}/api/work-log-normalization-review-queue`;
  let fulfilled = false;
  await page.route(url, async (route) => {
    if (route.request().method() !== "POST" || fulfilled) {
      await route.continue();
      return;
    }
    fulfilled = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(result),
    });
  });
  try {
    await callback();
  } finally {
    await page.unroute(url);
  }
}

async function withMockedWorkStatusExport(page, result, callback) {
  const url = `http://${HOST}:${BRIDGE_PORT}/api/work-status-export`;
  let fulfilled = false;
  await page.route(url, async (route) => {
    if (route.request().method() !== "POST" || fulfilled) {
      await route.continue();
      return;
    }
    fulfilled = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(result),
    });
  });
  try {
    await callback();
  } finally {
    await page.unroute(url);
  }
}

async function runBrowserQa() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const httpErrors = [];
  let workLogFreezePersistence = "";
  let workManagementMetaAfterFreeze = "";
  let workManagementFilterMeta = "";
  let workManagementFilteredRows = [];
  let workManagementReviewActionRows = [];
  let workManagementMissingConfidenceRows = [];
  let workManagementPersistenceRows = [];
  let workManagementSessionRows = [];
  let workManagementActionRows = [];
  let workManagementDurabilityWarning = "";
  let workManagementSessionBackfillWarning = "";
  let workManagementReadiness = "";
  let workManagementReviewDecisions = "";
  let workManagementReviewBlockers = "";
  let workManagementReviewResolution = "";
  let workManagementNextAction = "";
  let workManagementMeta = "";
  let workStatusExportLimitMeta = "";
  let workStatusExportMeta = "";
  let workStatusExportPageMeta = "";
  let workStatusExportNextPageMeta = "";
  let workStatusExportNextPageRows = [];
  let workStatusExportIndex = "";
  let workStatusExportFullSessionLimitInput = "";
  let workStatusExportFullSessionLimitMeta = "";
  let workStatusExportRows = [];
  let workStatusExportRowDetail = "";
  let workStatusExportFilterMeta = "";
  let workStatusExportFilteredRows = [];
  let workStatusExportFilteredRowDetail = "";
  let workStatusExportBoundedFilterMeta = "";
  let workStatusExportBoundedFilteredRows = [];
  let workStatusExportBoundedFilteredRowDetail = "";
  let workStatusExportUnresolvedFixtureMeta = "";
  let workStatusExportUnresolvedFixtureRows = [];
  let workStatusExportUnresolvedFixtureRowDetail = "";
  let workSessionEvidenceCandidatesMeta = "";
  let workSessionEvidenceCandidateRows = [];
  let workSessionEvidenceProposalsMeta = "";
  let workSessionEvidenceProposalRows = [];
  let workSessionEvidenceProposalsUiMeta = "";
  let workSessionEvidenceProposalsUiRows = [];
  let workSessionEvidenceReviewQueueMeta = "";
  let workSessionEvidenceReviewQueueRows = [];
  let workSessionEvidenceReviewQueueStateAfterApprove = "";
  let workSessionEvidenceReviewQueueUiMeta = "";
  let workSessionEvidenceReviewQueueUiRows = [];
  let workSessionEvidenceReviewQueueFilterMeta = "";
  let workSessionEvidenceReviewQueueFilteredRows = [];
  let workSessionEvidenceReviewQueueUiStateAfterApprove = "";
  let workStatusExportMarkdown = "";
  let workSummaryIndex = "";
  let workSessionIndexBackfill = null;
  let coverageMeta = "";
  let coverageFilterMeta = "";
  let coverageFilteredRows = [];
  let workLogCandidatesMeta = "";
  let workLogCandidateRows = [];
  let workAiProviderStatusMetaAfterManagement = "";
  let workAiProviderStatusMeta = "";
  let workAiProviderStatusRows = [];
  let workLogNormalizationCandidatesMeta = "";
  let workLogNormalizationCandidateRows = [];
  let workLogNormalizationProposalsMeta = "";
  let workLogNormalizationProposalRows = [];
  let workLogNormalizationReviewQueueMeta = "";
  let workLogNormalizationReviewQueueRows = [];
  let workLogNormalizationReviewQueueFilterMeta = "";
  let workLogNormalizationReviewQueueFilteredRows = [];
  let workLogNormalizationReviewQueueStateAfterApprove = "";
  let workLogNormalizationStaleFixtureMeta = "";
  let workLogNormalizationStaleFixtureRows = [];
  let workLogNormalizationStaleFixtureActionState = {};
  let workLogNormalizationRejectedAiFixtureMeta = "";
  let workLogNormalizationRejectedAiFixtureRows = [];
  let workLogNormalizationApplyMeta = "";
  let workManagementMetaAfterNormalizationApply = "";
  let workLogNormalizedRows = [];
  let workLogReviewQueueMeta = "";
  let approvedReviewQueueSaveDisabledWhenEmpty = null;
  let workLogReviewQueueMetaAfterSynthetic = "";
  let workLogReviewQueueFilterMeta = "";
  let workLogReviewQueueFilteredRows = [];
  let approvedReviewQueuePersistence = "";
  let workLogRunsMeta = "";
  let workLogRunRows = [];
  let workLogExtractionProviderWarning = "";
  let workLogItemRows = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      if (message.text().includes("Failed to load resource")) return;
      consoleErrors.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on("response", async (response) => {
    if (response.status() < 400) return;
    let body = "";
    try {
      body = (await response.text()).slice(0, 300);
    } catch {
      body = "<body unavailable>";
    }
    httpErrors.push(`HTTP ${response.status()}: ${response.url()} ${body}`);
  });

  try {
    step("open app");
    await page.goto(`http://${HOST}:${APP_PORT}`, { waitUntil: "networkidle" });

    step("health");
    const health = await bridgeJson(page, "/api/health");
    if (health.database_path !== DATABASE_PATH) {
      throw new Error(`Expected bridge database ${DATABASE_PATH}, got ${health.database_path}`);
    }
    step("work session index");
    await page.locator('[data-work-session-index-batch-files="true"]').fill("25");
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-session-index-batch-files-meta="true"]')?.textContent ?? "";
      return text.includes("source당 25개") && text.includes("클릭당 최대 50개");
    }, undefined, { timeout: 60000 });
    await page.locator('[data-run-work-session-index-backfill="true"]').click();
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-session-index-meta="true"]')?.textContent ?? "";
      const warning = document.querySelector('[data-work-session-index-warning="true"]')?.textContent ?? "";
      const sourceStates = document.querySelector('[data-work-session-index-source-states="true"]')?.textContent ?? "";
      return meta.includes("until-complete")
        && meta.includes("처음부터")
        && meta.includes("배치 2 / 2배치")
        && warning.includes("max_batches")
        && sourceStates.includes("Codex")
        && sourceStates.includes("파일");
    }, undefined, { timeout: 120000 });
    const resetWorkSessionIndexBackfill = {
      meta: (await page.locator('[data-work-session-index-meta="true"]').textContent())?.trim() ?? "",
      warning: (await page.locator('[data-work-session-index-warning="true"]').textContent())?.trim() ?? "",
      sourceStates: await page.locator('[data-work-session-index-source-state="true"]').allTextContents(),
    };
    const resetCodexProcessedFiles = sourceProcessedFileCount(
      resetWorkSessionIndexBackfill.sourceStates,
      "Codex",
    );
    await page.locator('[data-run-work-session-index-continue-backfill="true"]').click();
    await page.waitForFunction((previousCodexProcessedFiles) => {
      const meta = document.querySelector('[data-work-session-index-meta="true"]')?.textContent ?? "";
      const warning = document.querySelector('[data-work-session-index-warning="true"]')?.textContent ?? "";
      const remaining = document.querySelector('[data-work-session-index-remaining="true"]')?.textContent ?? "";
      const planned = document.querySelector('[data-work-session-index-planned-remaining="true"]')?.textContent ?? "";
      const guidance = document.querySelector('[data-work-session-index-checkpoint-guidance="true"]')?.textContent ?? "";
      const sourceStates = Array.from(document.querySelectorAll('[data-work-session-index-source-state="true"]'))
        .map((row) => row.textContent ?? "");
      const codexRow = sourceStates.find((row) => row.includes("Codex")) ?? "";
      const match = codexRow.match(/파일\s+([\d,]+)\s+\//);
      const processedFiles = match ? Number.parseInt(match[1].replaceAll(",", ""), 10) : 0;
      return meta.includes("until-complete")
        && meta.includes("이어가기")
        && meta.includes("배치 2 / 2배치")
        && warning.includes("max_batches")
        && remaining.includes("남은 파일")
        && remaining.includes("클릭당 소스별 최대 50개")
        && remaining.includes("이어 백필 예상")
        && planned.includes("현재 입력 기준")
        && planned.includes("이어 백필 예상")
        && planned.includes("긴 이어 백필 예상")
        && guidance.includes("체크포인트 계획")
        && guidance.includes("권장 다음 실행 긴 이어 백필")
        && guidance.includes("각 실행 후 상태 Export/큐 재확인")
        && processedFiles > previousCodexProcessedFiles;
    }, resetCodexProcessedFiles, { timeout: 120000 });
    workSessionIndexBackfill = {
      reset: resetWorkSessionIndexBackfill,
      continued: {
        meta: (await page.locator('[data-work-session-index-meta="true"]').textContent())?.trim() ?? "",
        warning: (await page.locator('[data-work-session-index-warning="true"]').textContent())?.trim() ?? "",
        remaining: (await page.locator('[data-work-session-index-remaining="true"]').textContent())?.trim() ?? "",
        planned: (await page.locator('[data-work-session-index-planned-remaining="true"]').textContent())?.trim() ?? "",
        guidance: (await page.locator('[data-work-session-index-checkpoint-guidance="true"]').textContent())?.trim() ?? "",
        sourceStates: await page.locator('[data-work-session-index-source-state="true"]').allTextContents(),
      },
    };
    const continuedCodexProcessedFiles = sourceProcessedFileCount(
      workSessionIndexBackfill.continued.sourceStates,
      "Codex",
    );
    await page.locator('[data-work-session-index-long-confirm="true"]').fill("긴 백필");
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-session-index-long-confirm-meta="true"]')?.textContent ?? "";
      return text.includes("긴 백필 확인됨") && text.includes("source당 최대 250개");
    }, undefined, { timeout: 60000 });
    await page.locator('[data-run-work-session-index-long-continue-backfill="true"]').click();
    await page.waitForFunction((previousCodexProcessedFiles) => {
      const meta = document.querySelector('[data-work-session-index-meta="true"]')?.textContent ?? "";
      const warning = document.querySelector('[data-work-session-index-warning="true"]')?.textContent ?? "";
      const remaining = document.querySelector('[data-work-session-index-remaining="true"]')?.textContent ?? "";
      const planned = document.querySelector('[data-work-session-index-planned-remaining="true"]')?.textContent ?? "";
      const guidance = document.querySelector('[data-work-session-index-checkpoint-guidance="true"]')?.textContent ?? "";
      const sourceStates = Array.from(document.querySelectorAll('[data-work-session-index-source-state="true"]'))
        .map((row) => row.textContent ?? "");
      const codexRow = sourceStates.find((row) => row.includes("Codex")) ?? "";
      const match = codexRow.match(/파일\s+([\d,]+)\s+\//);
      const processedFiles = match ? Number.parseInt(match[1].replaceAll(",", ""), 10) : 0;
      return meta.includes("until-complete")
        && meta.includes("이어가기")
        && meta.includes("배치 10 / 10배치")
        && warning.includes("max_batches")
        && remaining.includes("남은 파일")
        && remaining.includes("클릭당 소스별 최대 250개")
        && planned.includes("현재 입력 기준")
        && planned.includes("긴 이어 백필 예상")
        && guidance.includes("체크포인트 계획")
        && guidance.includes("source당 최대 250개")
        && processedFiles > previousCodexProcessedFiles;
    }, continuedCodexProcessedFiles, { timeout: 180000 });
    workSessionIndexBackfill.longContinued = {
      meta: (await page.locator('[data-work-session-index-meta="true"]').textContent())?.trim() ?? "",
      warning: (await page.locator('[data-work-session-index-warning="true"]').textContent())?.trim() ?? "",
      remaining: (await page.locator('[data-work-session-index-remaining="true"]').textContent())?.trim() ?? "",
      planned: (await page.locator('[data-work-session-index-planned-remaining="true"]').textContent())?.trim() ?? "",
      guidance: (await page.locator('[data-work-session-index-checkpoint-guidance="true"]').textContent())?.trim() ?? "",
      sourceStates: await page.locator('[data-work-session-index-source-state="true"]').allTextContents(),
    };
    await page.locator('[data-apply-work-session-index-large-batch="true"]').click();
    await page.waitForFunction(() => {
      const batchInput = document.querySelector('[data-work-session-index-batch-files="true"]');
      const confirmInput = document.querySelector('[data-work-session-index-long-confirm="true"]');
      const batchValue = batchInput instanceof HTMLInputElement ? batchInput.value : "";
      const confirmValue = confirmInput instanceof HTMLInputElement ? confirmInput.value : "";
      const longStatus = document.querySelector('[data-work-session-index-long-confirm-meta="true"]')?.textContent ?? "";
      const planned = document.querySelector('[data-work-session-index-planned-remaining="true"]')?.textContent ?? "";
      const guidance = document.querySelector('[data-work-session-index-checkpoint-guidance="true"]')?.textContent ?? "";
      const impact = document.querySelector('[data-work-session-index-next-run-impact="true"]')?.textContent ?? "";
      const standardMatch = planned.match(/이어 백필 예상\s+([\d,]+)회/);
      const longMatch = planned.match(/긴 이어 백필 예상\s+([\d,]+)회/);
      const standardRuns = standardMatch ? Number.parseInt(standardMatch[1].replaceAll(",", ""), 10) : 0;
      const longRuns = longMatch ? Number.parseInt(longMatch[1].replaceAll(",", ""), 10) : 0;
      return batchValue === "500"
        && confirmValue === "긴 백필"
        && longStatus.includes("긴 백필 확인됨")
        && longStatus.includes("source당 최대 5,000개")
        && standardRuns > 0
        && standardRuns <= 26
        && longRuns > 0
        && longRuns <= 6
        && guidance.includes("source당 최대 5,000개")
        && guidance.includes("예상")
        && impact.includes("다음 실행 효과")
        && impact.includes("긴 이어 백필")
        && impact.includes("source당 최대 5,000개")
        && impact.includes("남은 파일")
        && impact.includes("이후 예상");
    }, undefined, { timeout: 60000 });
    workSessionIndexBackfill.plannedAfterBatch500 =
      (await page.locator('[data-work-session-index-planned-remaining="true"]').textContent())?.trim() ?? "";
    workSessionIndexBackfill.guidanceAfterBatch500 =
      (await page.locator('[data-work-session-index-checkpoint-guidance="true"]').textContent())?.trim() ?? "";
    workSessionIndexBackfill.impactAfterBatch500 =
      (await page.locator('[data-work-session-index-next-run-impact="true"]').textContent())?.trim() ?? "";
    await page.locator('[data-apply-work-session-index-completion-plan="true"]').click();
    await page.waitForFunction(() => {
      const batchInput = document.querySelector('[data-work-session-index-batch-files="true"]');
      const maxBatchesInput = document.querySelector('[data-work-session-index-long-max-batches="true"]');
      const batchValue = batchInput instanceof HTMLInputElement ? batchInput.value : "";
      const maxBatchesValue = maxBatchesInput instanceof HTMLInputElement ? maxBatchesInput.value : "";
      const maxBatches = Number.parseInt(maxBatchesValue, 10);
      const longStatus = document.querySelector('[data-work-session-index-long-confirm-meta="true"]')?.textContent ?? "";
      const planned = document.querySelector('[data-work-session-index-planned-remaining="true"]')?.textContent ?? "";
      const impact = document.querySelector('[data-work-session-index-next-run-impact="true"]')?.textContent ?? "";
      return batchValue === "500"
        && Number.isSafeInteger(maxBatches)
        && maxBatches > 10
        && longStatus.includes(`반복 ${maxBatches.toLocaleString()}배치`)
        && planned.includes("긴 이어 백필 예상 1회")
        && impact.includes("이번 클릭 후 완료 예상");
    }, undefined, { timeout: 60000 });
    workSessionIndexBackfill.completionPlanAfterBatch500 = {
      longMaxBatches: (await page.locator('[data-work-session-index-long-max-batches="true"]').inputValue()).trim(),
      planned: (await page.locator('[data-work-session-index-planned-remaining="true"]').textContent())?.trim() ?? "",
      impact: (await page.locator('[data-work-session-index-next-run-impact="true"]').textContent())?.trim() ?? "",
    };
    await page.locator('[data-browser-bridge-status="connected"]').waitFor({ timeout: 60000 });
    await page.locator('[data-work-summary-session-limit="true"]').fill(String(WORK_SESSION_LIMIT));
    await page.waitForFunction((expectedText) => {
      const text = document.querySelector('[data-work-summary-session-limit-meta="true"]')?.textContent ?? "";
      return text.includes(expectedText);
    }, `세션 스캔 ${new Intl.NumberFormat("ko-KR").format(WORK_SESSION_LIMIT)}개 기준`);

    step("scan");
    await page.locator('[data-scan-limit="true"]').fill("20");
    await clickAndWait(page, '[data-run-scan="true"]', () => {
      const rows = document.querySelectorAll('[data-prompt-row="true"]').length;
      const buttonText = document.querySelector('[data-run-scan="true"]')?.textContent ?? "";
      return rows > 0 && !buttonText.includes("스캔 중") && !buttonText.includes("중지 중");
    });
    const scanPersistence = await bridgeJson(page, "/api/prompt-facets", { options: {} });
    if (scanPersistence.database_path !== DATABASE_PATH || scanPersistence.total_prompts < 1) {
      throw new Error(`Scan did not persist prompts to isolated DB: ${JSON.stringify(scanPersistence)}`);
    }

    step("improve");
    await page.locator('[data-prompt-row="true"]').first().click();
    const localToggle = page.locator('input[aria-label="로컬 규칙 추천만 사용"]');
    if (!(await localToggle.isChecked())) {
      await localToggle.check();
    }
    await clickAndWait(page, '[data-run-improve="true"]', () => {
      return Boolean(document.querySelector('[data-improvement-persistence="true"]'))
        || Boolean(document.querySelector('[data-improvement-run-error="true"]'));
    });
    const improveError = await page.locator('[data-improvement-run-error="true"]').textContent().catch(() => "");
    if (improveError.trim()) {
      throw new Error(`Improve flow failed: ${improveError.trim()}`);
    }
    const improvementPersistence =
      (await page.locator('[data-improvement-persistence="true"]').textContent())?.trim() ?? "";
    if (!improvementPersistence.includes(DATABASE_PATH)) {
      throw new Error(`Improvement persistence did not use isolated DB: ${improvementPersistence}`);
    }

    step("plan and import");
    await page.locator('[data-run-plan="true"]').click();
    await page.locator("button[data-import-source-id]:not([disabled])").first().waitFor({ timeout: 90000 });
    await page.locator("button[data-import-source-id]:not([disabled])").first().click();
    await page.waitForFunction((databasePath) => {
      const text = document.querySelector(".import-panel")?.textContent ?? "";
      return text.includes(databasePath) && !text.includes("가져오는 중");
    }, DATABASE_PATH, { timeout: 120000 });
    const importStates = await bridgeJson(page, "/api/import-states", { options: {} });
    const importEvents = await bridgeJson(page, "/api/import-events", { options: {} });
    if (importStates.database_path !== DATABASE_PATH || importStates.processed_files < 1) {
      throw new Error(`Import states did not use isolated DB: ${JSON.stringify(importStates)}`);
    }
    if (importEvents.database_path !== DATABASE_PATH || importEvents.total_events < 1) {
      throw new Error(`Import events did not use isolated DB: ${JSON.stringify(importEvents)}`);
    }

    step("stored facets and prompts");
    await page.locator('[data-refresh-import-states="true"]').click();
    await page.locator('[data-refresh-import-events="true"]').click();
    await page.locator('[data-refresh-stored-facets="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-stored-facet-summary="true"]')?.textContent ?? "";
      return text.includes("저장됨") || text.includes("저장소 필터 후보");
    });
    await page.locator('[data-load-stored-prompts="true"]').click();
    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-prompt-row="true"]').length > 0
        || Boolean(document.querySelector('[data-empty-prompts="true"]'));
    }, undefined, { timeout: 90000 });

    step("work summary and snapshot");
    await page.locator('[data-load-work-summary="true"]').click();
    await page.locator('[data-work-summary-narrative="true"]').waitFor({ timeout: 120000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-summary-index="true"]')?.textContent ?? "";
      return text.includes("메타데이터 우선") && text.includes("raw fallback");
    }, undefined, { timeout: 120000 });
    workSummaryIndex =
      (await page.locator('[data-work-summary-index="true"]').textContent())?.trim() ?? "";
    await page.locator('[data-work-status-export-limit-input="true"]').fill("25");
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-status-export-limit-meta="true"]')?.textContent ?? "";
      return text.includes("상태 export 표시 25행 기준");
    }, undefined, { timeout: 30000 });
    workStatusExportLimitMeta =
      (await page.locator('[data-work-status-export-limit-meta="true"]').textContent())?.trim() ?? "";
    await page.locator('[data-load-work-status-export="true"]').click();
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-status-export-meta="true"]')?.textContent ?? "";
      const index = document.querySelector('[data-work-status-export-index="true"]')?.textContent ?? "";
      const markdown = document.querySelector('[data-work-status-export-markdown="true"]')?.textContent ?? "";
      return meta.includes("표시 25행")
        && meta.includes("프로젝트")
        && meta.includes("세션 근거")
        && meta.includes("DB")
        && meta.includes("promptvault-browser-qa")
        && index.includes("메타데이터 우선")
        && index.includes("보관")
        && markdown.includes("Project/Day Rows")
        && document.querySelectorAll('[data-work-status-export-row="true"]').length > 0;
    }, undefined, { timeout: 120000 });
    workStatusExportMeta =
      (await page.locator('[data-work-status-export-meta="true"]').textContent())?.trim() ?? "";
    workStatusExportPageMeta =
      (await page.locator('[data-work-status-export-page-meta="true"]').textContent())?.trim() ?? "";
    workStatusExportIndex =
      (await page.locator('[data-work-status-export-index="true"]').textContent())?.trim() ?? "";
    const fullSessionLimitMatch =
      workStatusExportIndex.match(/보관 총\s+([\d,]+)개/)
      ?? workStatusExportIndex.match(/보관\s+([\d,]+)개/);
    if (!fullSessionLimitMatch) {
      throw new Error(`Work status export did not expose the full stored session index: ${workStatusExportIndex}`);
    }
    const fullSessionLimit = fullSessionLimitMatch[1].replaceAll(",", "");
    const formattedFullSessionLimit = new Intl.NumberFormat("ko-KR").format(
      Number.parseInt(fullSessionLimit, 10),
    );
    await page.locator('[data-use-full-session-index-limit="true"]').click();
    await page.waitForFunction((expected) => {
      const input = document.querySelector('[data-work-summary-session-limit="true"]');
      const value = input instanceof HTMLInputElement ? input.value : "";
      const text = document.querySelector('[data-work-summary-session-limit-meta="true"]')?.textContent ?? "";
      const formatted = new Intl.NumberFormat("ko-KR").format(Number.parseInt(expected, 10));
      return value === expected && text.includes(`세션 스캔 ${formatted}개 기준`);
    }, fullSessionLimit, { timeout: 30000 });
    workStatusExportFullSessionLimitInput =
      await page.locator('[data-work-summary-session-limit="true"]').inputValue();
    workStatusExportFullSessionLimitMeta =
      (await page.locator('[data-work-summary-session-limit-meta="true"]').textContent())?.trim() ?? "";
    if (
      workStatusExportFullSessionLimitInput !== fullSessionLimit
      || !workStatusExportFullSessionLimitMeta.includes(`세션 스캔 ${formattedFullSessionLimit}개 기준`)
    ) {
      throw new Error(
        `Full session index limit action failed: ${workStatusExportFullSessionLimitInput} / ${workStatusExportFullSessionLimitMeta}`,
      );
    }
    await page.locator('[data-work-summary-session-limit="true"]').fill(String(WORK_SESSION_LIMIT));
    await page.waitForFunction((expectedText) => {
      const text = document.querySelector('[data-work-summary-session-limit-meta="true"]')?.textContent ?? "";
      return text.includes(expectedText);
    }, `세션 스캔 ${new Intl.NumberFormat("ko-KR").format(WORK_SESSION_LIMIT)}개 기준`, { timeout: 30000 });
    workStatusExportRows = await page.locator('[data-work-status-export-row="true"]').allTextContents();
    await page.locator('[data-work-status-export-page-next="true"]').click();
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-status-export-page-meta="true"]')?.textContent ?? "";
      return meta.includes("상태 row 26-");
    }, undefined, { timeout: 120000 });
    workStatusExportNextPageMeta =
      (await page.locator('[data-work-status-export-page-meta="true"]').textContent())?.trim() ?? "";
    workStatusExportNextPageRows = await page.locator('[data-work-status-export-row="true"]').allTextContents();
    await page.locator('[data-work-status-export-page-prev="true"]').click();
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-status-export-page-meta="true"]')?.textContent ?? "";
      return meta.includes("상태 row 1-25");
    }, undefined, { timeout: 120000 });
    await page.locator('[data-work-status-export-row-toggle="true"]').first().click();
    await page.waitForFunction(() => {
      const detail = document.querySelector('[data-work-status-export-row-detail="true"]')?.textContent ?? "";
      return detail.includes("진행로그")
        && (detail.includes("세션 소스") || detail.includes("매칭된 세션 근거 없음"));
    }, undefined, { timeout: 30000 });
    workStatusExportRowDetail =
      (await page.locator('[data-work-status-export-row-detail="true"]').first().textContent())?.trim() ?? "";
    await page.locator('[data-work-status-export-filter="true"]').selectOption("needs-session-evidence");
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-status-export-filter-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-status-export-row="true"]'));
      return meta.includes("세션 근거 필요")
        && meta.includes("결과")
        && meta.includes("/ 25행")
        && rows.length > 0
        && rows.every((row) => (row.textContent ?? "").includes("세션 근거 필요"));
    }, undefined, { timeout: 30000 });
    workStatusExportFilterMeta =
      (await page.locator('[data-work-status-export-filter-meta="true"]').textContent())?.trim() ?? "";
    workStatusExportFilteredRows = await page.locator('[data-work-status-export-row="true"]').allTextContents();
    await page.locator('[data-work-status-export-row-toggle="true"]').first().click();
    await page.waitForFunction(() => {
      const detail = document.querySelector('[data-work-status-export-row-detail="true"]')?.textContent ?? "";
      return detail.includes("매칭된 세션 근거 없음")
        && (detail.includes("제한된 근거만 사용 중") || detail.includes("전체 인덱스에서도 미해결"));
    }, undefined, { timeout: 30000 });
    workStatusExportFilteredRowDetail =
      (await page.locator('[data-work-status-export-row-detail="true"]').first().textContent())?.trim() ?? "";
    await page.locator('[data-work-status-export-filter="true"]').selectOption("bounded-session-limit");
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-status-export-filter-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-status-export-row="true"]'));
      return meta.includes("근거 limit 영향")
        && meta.includes("근거limit")
        && rows.length > 0
        && rows.every((row) => (row.textContent ?? "").includes("세션 근거 필요"));
    }, undefined, { timeout: 30000 });
    workStatusExportBoundedFilterMeta =
      (await page.locator('[data-work-status-export-filter-meta="true"]').textContent())?.trim() ?? "";
    workStatusExportBoundedFilteredRows =
      await page.locator('[data-work-status-export-row="true"]').allTextContents();
    await page.locator('[data-work-status-export-row-toggle="true"]').first().click();
    await page.waitForFunction(() => {
      const detail = document.querySelector('[data-work-status-export-row-detail="true"]')?.textContent ?? "";
      return detail.includes("매칭된 세션 근거 없음")
        && detail.includes("제한된 근거만 사용 중")
        && detail.includes("로그 유형");
    }, undefined, { timeout: 30000 });
    workStatusExportBoundedFilteredRowDetail =
      (await page.locator('[data-work-status-export-row-detail="true"]').first().textContent())?.trim() ?? "";
    workStatusExportMarkdown =
      (await page.locator('[data-work-status-export-markdown="true"]').textContent())?.trim() ?? "";
    step("work status export unresolved fixture");
    await withMockedWorkStatusExport(page, unresolvedWorkStatusExportFixture(), async () => {
      await page.locator('[data-load-work-status-export="true"]').click();
      await page.waitForFunction(() => {
        const meta = document.querySelector('[data-work-status-export-meta="true"]')?.textContent ?? "";
        const markdown = document.querySelector('[data-work-status-export-markdown="true"]')?.textContent ?? "";
        return meta.includes("표시 2행")
          && meta.includes("2개 프로젝트")
          && markdown.includes("full-index unresolved session evidence");
      }, undefined, { timeout: 30000 });
    });
    await page.locator('[data-work-status-export-filter="true"]').selectOption("unresolved-session-evidence");
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-status-export-filter-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-status-export-row="true"]'));
      return meta.includes("전체 인덱스 미해결")
        && meta.includes("전체미해결 1행")
        && rows.length === 1
        && rows.every((row) => (row.textContent ?? "").includes("세션 근거 필요"));
    }, undefined, { timeout: 30000 });
    workStatusExportUnresolvedFixtureMeta =
      (await page.locator('[data-work-status-export-filter-meta="true"]').textContent())?.trim() ?? "";
    workStatusExportUnresolvedFixtureRows =
      await page.locator('[data-work-status-export-row="true"]').allTextContents();
    await page.locator('[data-work-status-export-row-toggle="true"]').first().click();
    await page.waitForFunction(() => {
      const detail = document.querySelector('[data-work-status-export-row-detail="true"]')?.textContent ?? "";
      return detail.includes("매칭된 세션 근거 없음")
        && detail.includes("전체 인덱스에서도 미해결")
        && detail.includes("핸드오프 로그");
    }, undefined, { timeout: 30000 });
    workStatusExportUnresolvedFixtureRowDetail =
      (await page.locator('[data-work-status-export-row-detail="true"]').first().textContent())?.trim() ?? "";
    step("work session evidence candidates bridge");
    const workSessionEvidenceCandidates = await bridgeJson(page, "/api/work-session-evidence-candidates", {
      options: { limit: 5 },
    });
    if (workSessionEvidenceCandidates.database_path !== DATABASE_PATH) {
      throw new Error(
        `Session evidence candidates did not use isolated DB: ${workSessionEvidenceCandidates.database_path}`,
      );
    }
    if (workSessionEvidenceCandidates.requested_limit !== 5) {
      throw new Error(
        `Session evidence candidate limit mismatch: ${workSessionEvidenceCandidates.requested_limit}`,
      );
    }
    if (
      workSessionEvidenceCandidates.returned_candidate_count
        !== workSessionEvidenceCandidates.candidates.length
      || workSessionEvidenceCandidates.returned_candidate_count
        > workSessionEvidenceCandidates.total_candidate_count
      || workSessionEvidenceCandidates.total_candidate_count
        !== workSessionEvidenceCandidates.unresolved_after_full_index_count
      || workSessionEvidenceCandidates.report_session_evidence_index_count
        > workSessionEvidenceCandidates.report_session_evidence_index_total_count
    ) {
      throw new Error(`Invalid session evidence candidate counters: ${JSON.stringify(workSessionEvidenceCandidates)}`);
    }
    if (
      workSessionEvidenceCandidates.candidates.some(
        (candidate) => candidate.session_evidence_audit !== "unresolved-after-full-index",
      )
    ) {
      throw new Error(`Session evidence candidates included non-unresolved rows: ${JSON.stringify(workSessionEvidenceCandidates.candidates)}`);
    }
    workSessionEvidenceCandidatesMeta = [
      `후보 ${workSessionEvidenceCandidates.returned_candidate_count} / ${workSessionEvidenceCandidates.total_candidate_count}`,
      `세션 ${workSessionEvidenceCandidates.report_session_evidence_index_count} / ${workSessionEvidenceCandidates.report_session_evidence_index_total_count}`,
      `limit ${workSessionEvidenceCandidates.session_limit_used}`,
    ].join(" · ");
    workSessionEvidenceCandidateRows = workSessionEvidenceCandidates.candidates
      .map((candidate) =>
        `${candidate.project} · ${candidate.date} · ${candidate.latest_source_file} · ${candidate.latest_source_role}`
      );
    step("work session evidence proposals bridge");
    const workSessionEvidenceProposals = await bridgeJson(
      page,
      "/api/work-session-evidence-proposals",
      { options: { limit: 5, ai: false } },
    );
    if (workSessionEvidenceProposals.database_path !== DATABASE_PATH) {
      throw new Error(
        `Session evidence proposals did not use isolated DB: ${workSessionEvidenceProposals.database_path}`,
      );
    }
    if (
      workSessionEvidenceProposals.provider !== "local-session-evidence-rules"
      || workSessionEvidenceProposals.used_ai !== false
      || workSessionEvidenceProposals.returned_proposal_count
        !== workSessionEvidenceProposals.proposals.length
      || workSessionEvidenceProposals.returned_proposal_count
        > workSessionEvidenceProposals.total_candidate_count
      || workSessionEvidenceProposals.accepted_count !== 0
      || workSessionEvidenceProposals.rejected_count
        !== workSessionEvidenceProposals.returned_proposal_count
      || workSessionEvidenceProposals.report_session_evidence_index_count
        > workSessionEvidenceProposals.report_session_evidence_index_total_count
    ) {
      throw new Error(`Invalid session evidence proposal counters: ${JSON.stringify(workSessionEvidenceProposals)}`);
    }
    if (
      workSessionEvidenceProposals.proposals.some((proposal) =>
        proposal.accepted
        || proposal.rejection_reason === null
        || proposal.session_evidence_audit !== "unresolved-after-full-index"
        || !proposal.source_trace.trim()
      )
    ) {
      throw new Error(`Invalid local session evidence proposals: ${JSON.stringify(workSessionEvidenceProposals.proposals)}`);
    }
    workSessionEvidenceProposalsMeta = [
      `${workSessionEvidenceProposals.provider_runtime}`,
      `제안 ${workSessionEvidenceProposals.returned_proposal_count} / ${workSessionEvidenceProposals.total_candidate_count}`,
      `검토가능 ${workSessionEvidenceProposals.accepted_count}`,
      `보류 ${workSessionEvidenceProposals.rejected_count}`,
      `세션 ${workSessionEvidenceProposals.report_session_evidence_index_count} / ${workSessionEvidenceProposals.report_session_evidence_index_total_count}`,
    ].join(" · ");
    workSessionEvidenceProposalRows = workSessionEvidenceProposals.proposals
      .map((proposal) =>
        `${proposal.project} · ${proposal.date} · ${proposal.proposal_kind} · ${proposal.rejection_reason} · ${proposal.source_role}`
      );
    step("work session evidence review queue bridge");
    const workSessionEvidenceReviewQueue = await bridgeJson(
      page,
      "/api/work-session-evidence-review-queue",
      { options: { limit: 5, sync_candidates: true } },
    );
    if (workSessionEvidenceReviewQueue.database_path !== DATABASE_PATH) {
      throw new Error(
        `Session evidence review queue did not use isolated DB: ${workSessionEvidenceReviewQueue.database_path}`,
      );
    }
    if (
      workSessionEvidenceReviewQueue.synced_candidate_count
        !== Math.min(workSessionEvidenceCandidates.total_candidate_count, 200)
      || workSessionEvidenceReviewQueue.returned_item_count
        !== workSessionEvidenceReviewQueue.items.length
      || workSessionEvidenceReviewQueue.returned_item_count
        > workSessionEvidenceReviewQueue.total_items
      || workSessionEvidenceReviewQueue.pending_review_count
        + workSessionEvidenceReviewQueue.stale_count
        + workSessionEvidenceReviewQueue.approved_count
        + workSessionEvidenceReviewQueue.rejected_count
        !== workSessionEvidenceReviewQueue.total_items
    ) {
      throw new Error(`Invalid session evidence review queue counters: ${JSON.stringify(workSessionEvidenceReviewQueue)}`);
    }
    if (
      workSessionEvidenceReviewQueue.items.some(
        (item) => item.session_evidence_audit !== "unresolved-after-full-index",
      )
    ) {
      throw new Error(`Session evidence review queue included non-unresolved rows: ${JSON.stringify(workSessionEvidenceReviewQueue.items)}`);
    }
    workSessionEvidenceReviewQueueMeta = [
      `큐 ${workSessionEvidenceReviewQueue.returned_item_count} / ${workSessionEvidenceReviewQueue.total_items}`,
      `동기화 ${workSessionEvidenceReviewQueue.synced_candidate_count}`,
      `검토완료 ${workSessionEvidenceReviewQueue.approved_count}`,
      `대기 ${workSessionEvidenceReviewQueue.pending_review_count}`,
    ].join(" · ");
    workSessionEvidenceReviewQueueRows = workSessionEvidenceReviewQueue.items
      .map((item) =>
        `${item.project} · ${item.date} · ${item.review_state} · ${item.latest_source_file} · ${item.latest_source_role}`
      );
    const firstApprovableItem = workSessionEvidenceReviewQueue.items.find(
      (item) => !item.needs_title_normalization,
    );
    if (firstApprovableItem) {
      const approvedQueue = await bridgeJson(
        page,
        "/api/work-session-evidence-review-queue/update",
        {
          options: {
            candidate_id: firstApprovableItem.candidate_id,
            review_state: "approved",
            review_reason: "browser_qa_approved_session_evidence_review",
            limit: 200,
          },
        },
      );
      if (
        approvedQueue.database_path !== DATABASE_PATH
        || approvedQueue.approved_count < 1
        || !approvedQueue.items.some(
          (item) => item.candidate_id === firstApprovableItem.candidate_id
            && item.review_state === "approved"
            && item.review_reason === "browser_qa_approved_session_evidence_review",
        )
      ) {
        throw new Error(`Session evidence review queue approval failed: ${JSON.stringify(approvedQueue)}`);
      }
      workSessionEvidenceReviewQueueStateAfterApprove =
        `${firstApprovableItem.candidate_id} · approved · ${approvedQueue.approved_count}`;
    } else {
      workSessionEvidenceReviewQueueStateAfterApprove = "no approvable session evidence review candidates";
    }
    step("work session evidence proposals UI");
    await waitForEnabled(page, '[data-load-work-session-evidence-proposals="true"]');
    await page.locator('[data-work-session-evidence-needs-title-only="true"]').check();
    await page.locator('[data-load-work-session-evidence-proposals="true"]').click();
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-session-evidence-proposals-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-session-evidence-proposals="true"] article'));
      return meta.includes("세션인덱스")
        && meta.includes("후보")
        && meta.includes("표시")
        && document.querySelector('[data-work-session-evidence-needs-title-only="true"]')?.checked
        && rows.some((row) => {
          const text = row.textContent ?? "";
          return text.includes("unresolved-after-full-index")
            && text.includes("provider")
            && text.includes("제목 정규화 우선")
            && (text.includes("승인 검토 가능") || text.includes("local_fallback_requires"));
        });
    }, undefined, { timeout: 120000 });
    workSessionEvidenceProposalsUiMeta =
      (await page.locator('[data-work-session-evidence-proposals-meta="true"]').textContent())?.trim() ?? "";
    workSessionEvidenceProposalsUiRows =
      await page.locator('[data-work-session-evidence-proposals="true"] article').allTextContents();
    step("work session evidence review queue UI");
    await waitForEnabled(page, '[data-sync-work-session-evidence-review-queue="true"]');
    await page.locator('[data-sync-work-session-evidence-review-queue="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-session-evidence-review-queue-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-session-evidence-review-queue="true"] article'));
      const titleRows = rows.filter((row) => (row.textContent ?? "").includes("제목 정규화 필요"));
      const titleRowsAreApprovalBlocked = titleRows.every((row) =>
        !row.querySelector("[data-approve-work-session-evidence-review-queue]")
          && row.querySelector("[data-reject-work-session-evidence-review-queue]")
      );
      const titleRowsSafeWhenVisible = titleRows.length === 0 || titleRowsAreApprovalBlocked;
      return text.includes("세션근거 큐 저장")
        && text.includes("표시")
        && text.includes("검토")
        && rows.some((row) => {
          const rowText = row.textContent ?? "";
          return rowText.includes("unresolved-after-full-index") && rowText.includes("로그 유형");
        })
        && titleRowsSafeWhenVisible;
    }, undefined, { timeout: 120000 });
    workSessionEvidenceReviewQueueUiMeta =
      (await page.locator('[data-work-session-evidence-review-queue-meta="true"]').textContent())?.trim() ?? "";
    workSessionEvidenceReviewQueueUiRows =
      await page.locator('[data-work-session-evidence-review-queue="true"] article').allTextContents();
    const firstSessionEvidenceQueueProject =
      (await page
        .locator('[data-work-session-evidence-review-queue="true"] article strong')
        .first()
        .textContent())?.trim() ?? "";
    if (!firstSessionEvidenceQueueProject) {
      throw new Error("Session evidence review queue did not expose a project for filtering");
    }
    await page
      .locator('[data-work-session-evidence-review-queue-project-filter="true"]')
      .fill(firstSessionEvidenceQueueProject);
    await page.locator('[data-apply-work-session-evidence-review-queue-filters="true"]').click();
    await page.waitForFunction((project) => {
      const meta = document.querySelector('[data-work-session-evidence-review-queue-filter-meta="true"]')
        ?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-session-evidence-review-queue="true"] article'));
      return meta.includes("세션근거 큐 필터")
        && meta.includes("필터 1개")
        && rows.length > 0
        && rows.every((row) => row.querySelector("strong")?.textContent?.trim() === project);
    }, firstSessionEvidenceQueueProject, { timeout: 30000 });
    workSessionEvidenceReviewQueueFilterMeta =
      (await page
        .locator('[data-work-session-evidence-review-queue-filter-meta="true"]')
        .textContent())?.trim() ?? "";
    workSessionEvidenceReviewQueueFilteredRows =
      await page.locator('[data-work-session-evidence-review-queue="true"] article').allTextContents();
    await page.locator('[data-clear-work-session-evidence-review-queue-filters="true"]').click();
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-session-evidence-review-queue-filter-meta="true"]')
        ?.textContent ?? "";
      return meta.includes("필터 없음");
    }, undefined, { timeout: 30000 });
    const firstSessionEvidenceApprove = page
      .locator('[data-approve-work-session-evidence-review-queue]')
      .first();
    await firstSessionEvidenceApprove.waitFor({ timeout: 90000 });
    const firstSessionEvidenceCandidateId = await firstSessionEvidenceApprove.getAttribute(
      "data-approve-work-session-evidence-review-queue",
    );
    if (!firstSessionEvidenceCandidateId) {
      throw new Error("Session evidence review queue approve button did not expose candidate id");
    }
    const sessionEvidenceUpdateResponse = page.waitForResponse((response) =>
      response.url().includes("/api/work-session-evidence-review-queue/update")
      && response.request().method() === "POST",
      { timeout: 90000 },
    );
    await firstSessionEvidenceApprove.click();
    await sessionEvidenceUpdateResponse;
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-session-evidence-review-queue-meta="true"]')?.textContent ?? "";
      return text.includes("세션근거 큐 저장")
        && text.includes("검토완료")
        && !text.includes("동기화 중");
    }, undefined, { timeout: 90000 });
    const sessionEvidenceQueueAfterUiApprove = await bridgeJson(
      page,
      "/api/work-session-evidence-review-queue",
      { options: { limit: 200 } },
    );
    const approvedSessionEvidenceRow = sessionEvidenceQueueAfterUiApprove.items.find(
      (item) => item.candidate_id === firstSessionEvidenceCandidateId,
    );
    if (
      !approvedSessionEvidenceRow
      || approvedSessionEvidenceRow.review_state !== "approved"
      || approvedSessionEvidenceRow.review_reason !== "operator_approved_session_evidence"
    ) {
      throw new Error(`Session evidence review queue UI approval did not persist: ${
        JSON.stringify(approvedSessionEvidenceRow ?? null)
      }`);
    }
    workSessionEvidenceReviewQueueUiStateAfterApprove =
      `${approvedSessionEvidenceRow.review_state} · ${approvedSessionEvidenceRow.review_reason}`;
    await page.locator('[data-save-work-summary-snapshot="true"]').click();
    await page.waitForFunction((databasePath) => {
      const text = document.querySelector('[data-work-summary-persistence="true"]')?.textContent ?? "";
      return text.includes(databasePath);
    }, DATABASE_PATH, { timeout: 120000 });
    await page.locator('[data-load-work-summary-snapshots="true"]').click();
    await page.waitForFunction(() => {
      return Boolean(document.querySelector('[data-work-summary-snapshots="true"] article'))
        || Boolean(document.querySelector('[data-empty-work-summary-snapshots="true"]'));
    }, undefined, { timeout: 90000 });
    const snapshots = await bridgeJson(page, "/api/work-summary-snapshots", { options: {} });
    if (snapshots.database_path !== DATABASE_PATH || snapshots.total_snapshots < 1) {
      throw new Error(`Snapshot flow did not use isolated DB: ${JSON.stringify(snapshots)}`);
    }

    step("work log management");
    step("work management overview");
    await page.locator('[data-refresh-work-management-overview="true"]').click();
    await page.locator('[data-work-management-overview-meta="true"]').waitFor({ timeout: 120000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-overview-meta="true"]')?.textContent ?? "";
      return text.includes("저장관리")
        && text.includes("라이브만")
        && text.includes("상태행")
        && text.includes("세션매칭")
        && text.includes("세션미해결")
        && text.includes("제목정규화");
    }, undefined, { timeout: 120000 });
    workManagementMeta =
      (await page.locator('[data-work-management-overview-meta="true"]').textContent())?.trim() ?? "";
    await page.waitForFunction(() => {
      return [...document.querySelectorAll('[data-work-management-row-session="true"]')]
        .some((element) => {
          const text = element.textContent ?? "";
          return text.includes("세션 매칭")
            || text.includes("전체 인덱스 미해결")
            || text.includes("근거 limit 영향");
        });
    }, undefined, { timeout: 120000 });
    workManagementSessionRows =
      await page.locator('[data-work-management-row-session="true"]').allTextContents();
    await page.waitForFunction(() => {
      const actions = [...document.querySelectorAll('[data-work-management-row-action="true"]')]
        .map((element) => element.textContent ?? "");
      return actions.length > 0
        && actions.every((text) => text.includes("다음 조치"))
        && actions.some((text) =>
          text.includes("세션근거 큐 검토")
          || text.includes("제목 정규화 큐 검토")
          || text.includes("진행로그 추출 저장")
          || text.includes("AI 제목 정규화 검토")
          || text.includes("관리 완료")
        );
    }, undefined, { timeout: 120000 });
    workManagementActionRows =
      await page.locator('[data-work-management-row-action="true"]').allTextContents();
    await page.waitForFunction(() => {
      return [...document.querySelectorAll('[data-work-management-row-persistence="true"]')]
        .some((element) => (element.textContent ?? "").includes("저장관리"));
    }, undefined, { timeout: 120000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-durability-warning="true"]')?.textContent ?? "";
      return text.includes("라이브만") && text.includes("저장관리");
    }, undefined, { timeout: 120000 });
    workManagementDurabilityWarning =
      (await page.locator('[data-work-management-durability-warning="true"]').textContent())?.trim() ?? "";
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-session-backfill-warning="true"]')?.textContent ?? "";
      return text.includes("세션 백필 미완료")
        && text.includes("남은 파일")
        && text.includes("상태 Export/요약/큐는 현재 인덱스 기준");
    }, undefined, { timeout: 120000 });
    workManagementSessionBackfillWarning =
      (await page.locator('[data-work-management-session-backfill-warning="true"]').textContent())?.trim() ?? "";
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-readiness="true"]')?.textContent ?? "";
      const providerText = document.querySelector('[data-work-ai-provider-status-meta="true"]')?.textContent ?? "";
      return text.includes("관리 준비도")
        && text.includes("진행로그 parsed")
        && text.includes("세션 백필 미완료")
        && text.includes("AI provider")
        && !text.includes("AI provider 미확인")
        && providerText.includes("OpenAI")
        && providerText.includes("GLM")
        && providerText.includes("Codex")
        && providerText.includes("fallback");
    }, undefined, { timeout: 120000 });
    workManagementReadiness =
      (await page.locator('[data-work-management-readiness="true"]').textContent())?.trim() ?? "";
    workAiProviderStatusMetaAfterManagement =
      (await page.locator('[data-work-ai-provider-status-meta="true"]').textContent())?.trim() ?? "";
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-review-decisions="true"]')?.textContent ?? "";
      const blockers = document.querySelector('[data-work-management-review-blockers="true"]')?.textContent ?? "";
      const resolution = document.querySelector('[data-work-management-review-resolution="true"]')?.textContent ?? "";
      return text.includes("검토 결정")
        && text.includes("저장 row")
        && text.includes("대기")
        && text.includes("stale")
        && text.includes("승인")
        && text.includes("거절")
        && (
          text.includes("추출")
          || text.includes("정규화")
          || text.includes("세션")
        )
        && blockers.includes("검토 차단")
        && (blockers.includes("정규화") || blockers.includes("세션"))
        && resolution.includes("검토 해소 경로")
        && (resolution.includes("정규화") || resolution.includes("세션"));
    }, undefined, { timeout: 120000 });
    workManagementReviewDecisions =
      (await page.locator('[data-work-management-review-decisions="true"]').textContent())?.trim() ?? "";
    workManagementReviewBlockers =
      (await page.locator('[data-work-management-review-blockers="true"]').textContent())?.trim() ?? "";
    workManagementReviewResolution =
      (await page.locator('[data-work-management-review-resolution="true"]').textContent())?.trim() ?? "";
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-next-action="true"]')?.textContent ?? "";
      return text.includes("다음 조치")
        && text.includes("긴 이어 백필")
        && text.includes("예상")
        && !text.includes("대용량 적용 후")
        && (
          text.includes("백필큐")
          || text.includes("긴 이어 백필")
          || text.includes("세션 근거 큐")
          || text.includes("AI provider")
        );
    }, undefined, { timeout: 120000 });
    workManagementNextAction =
      (await page.locator('[data-work-management-next-action="true"]').textContent())?.trim() ?? "";
    step("work management review action sort");
    await waitForEnabled(page, '[data-work-management-sort="true"]');
    await page.locator('[data-work-management-sort="true"]').selectOption("review_action_first");
    await page.waitForFunction(() => {
      const firstRow = document.querySelector('[data-work-management-overview="true"] article');
      const text = firstRow?.textContent ?? "";
      return text.includes("다음 조치")
        && (
          text.includes("세션근거 큐 검토")
          || text.includes("제목 정규화 큐 검토")
          || text.includes("세션 백필 후 재검증")
          || text.includes("진행로그 추출 저장")
          || text.includes("라이브 고정 저장")
        );
    }, undefined, { timeout: 120000 });
    workManagementReviewActionRows =
      await page.locator('[data-work-management-overview="true"] article').allTextContents();
    step("work management missing confidence sort");
    await waitForEnabled(page, '[data-work-management-sort="true"]');
    await page.locator('[data-work-management-sort="true"]').selectOption("missing_confidence_first");
    await page.waitForFunction(() => {
      const rows = [...document.querySelectorAll('[data-work-management-overview="true"] article')];
      return rows.some((row) => (row.textContent ?? "").includes("confidence 없음"));
    }, undefined, { timeout: 120000 });
    workManagementMissingConfidenceRows =
      await page.locator('[data-work-management-overview="true"] article').allTextContents();
    step("work management freeze live rows");
    await waitForEnabled(page, '[data-freeze-work-management-live-rows="true"]');
    await page.locator('[data-freeze-work-management-live-rows="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-extraction-persistence="true"]')?.textContent ?? "";
      return text.includes("accepted 제안") && text.includes("저장");
    }, undefined, { timeout: 120000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-overview-meta="true"]')?.textContent ?? "";
      return text.includes("라이브만 0") && text.includes("저장관리");
    }, undefined, { timeout: 120000 });
    await page.waitForFunction(() => {
      return !document.querySelector('[data-work-management-durability-warning="true"]');
    }, undefined, { timeout: 120000 });
    workManagementDurabilityWarning = "";
    workLogFreezePersistence =
      (await page.locator('[data-work-log-extraction-persistence="true"]').textContent())?.trim() ?? "";
    workManagementMetaAfterFreeze =
      (await page.locator('[data-work-management-overview-meta="true"]').textContent())?.trim() ?? "";
    step("work management saved extraction filter");
    await waitForEnabled(page, '[data-work-management-project-filter="true"]');
    await page.locator('[data-work-management-project-filter="true"]').fill("notebooklm-llm-wiki-flow");
    await waitForEnabled(page, '[data-work-management-source-filter="true"]');
    await page.locator('[data-work-management-source-filter="true"]').selectOption("saved_extraction");
    await waitForEnabled(page, '[data-work-management-min-confidence-filter="true"]');
    await page.locator('[data-work-management-min-confidence-filter="true"]').fill("0.99");
    await page.locator('[data-apply-work-management-filters="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-filter-meta="true"]')?.textContent ?? "";
      const rows = [...document.querySelectorAll('[data-work-management-overview="true"] article')];
      return text.includes("관리 감사 필터 3개")
        && rows.some((row) => (row.textContent ?? "").includes("notebooklm-llm-wiki-flow"));
    }, undefined, { timeout: 120000 });
    workManagementFilterMeta =
      (await page.locator('[data-work-management-filter-meta="true"]').textContent())?.trim() ?? "";
    workManagementFilteredRows =
      await page.locator('[data-work-management-overview="true"] article').allTextContents();
    await page.locator('[data-clear-work-management-filters="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-filter-meta="true"]')?.textContent ?? "";
      return text.includes("관리 감사 필터 없음");
    }, undefined, { timeout: 120000 });
    workManagementMeta =
      (await page.locator('[data-work-management-overview-meta="true"]').textContent())?.trim() ?? "";
    workManagementPersistenceRows =
      await page.locator('[data-work-management-row-persistence="true"]').allTextContents();
    step("work log coverage");
    await page.locator('[data-load-work-log-coverage="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-coverage-meta="true"]')?.textContent ?? "";
      return text.includes("개 로그")
        && text.includes("parsed")
        && text.includes("unparsed")
        && text.includes("개 프로젝트");
    }, undefined, { timeout: 120000 });
    coverageMeta =
      (await page.locator('[data-work-log-coverage-meta="true"]').textContent())?.trim() ?? "";
    await page.locator('[data-work-log-coverage-status-filter="true"]').selectOption("needs_review");
    await page.locator('[data-apply-work-log-coverage-filters="true"]').click();
    await page.waitForFunction(() => {
      const metaText = document.querySelector('[data-work-log-coverage-filter-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-coverage="true"] article'));
      const emptyText = document.querySelector('[data-empty-work-log-coverage="true"]')?.textContent ?? "";
      const rowsAreGapLogs = rows.length > 0 && rows.every((row) => {
        const text = row.textContent ?? "";
        return text.includes("unparsed") || text.includes("unreadable");
      });
      return metaText.includes("작업로그 필터")
        && metaText.includes("필터 1개")
        && (rowsAreGapLogs || emptyText.includes("필터에 맞는 프로젝트 작업 로그 없음"));
    }, undefined, { timeout: 90000 });
    coverageFilterMeta =
      (await page.locator('[data-work-log-coverage-filter-meta="true"]').textContent())?.trim() ?? "";
    coverageFilteredRows =
      await page.locator('[data-work-log-coverage="true"] article').allTextContents();
    await page.locator('[data-clear-work-log-coverage-filters="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-coverage-filter-meta="true"]')?.textContent ?? "";
      return text.includes("작업로그 필터") && text.includes("필터 없음");
    }, undefined, { timeout: 90000 });
    step("work log candidates");
    await page.locator('[data-load-work-log-candidates="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-candidates-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-candidates="true"] article'));
      const emptyQueue = text.includes("백필큐 비어 있음")
        && text.includes("이유 unparsed 없음")
        && text.includes("AI 전송가능 0개")
        && text.includes("위험차단 0개");
      const reviewQueue = text.includes("백필큐 검토 필요")
        && text.includes("pending")
        && text.includes("AI 전송가능")
        && text.includes("위험차단")
        && rows.length > 0;
      return emptyQueue || reviewQueue;
    }, undefined, { timeout: 90000 });
    workLogCandidatesMeta =
      (await page.locator('[data-work-log-candidates-meta="true"]').textContent())?.trim() ?? "";
    workLogCandidateRows =
      await page.locator('[data-work-log-candidates="true"] article').allTextContents();
    step("work AI provider status");
    await waitForEnabled(page, '[data-load-work-ai-provider-status="true"]');
    await page.locator('[data-load-work-ai-provider-status="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-ai-provider-status-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-ai-provider-status="true"] article'));
      const rowText = rows.map((row) => row.textContent ?? "").join("\n");
      const usableProviderShowsCapabilities = !rowText.includes("work-management 사용 가능")
        || (
          rowText.includes("capabilities")
          && rowText.includes("작업 요약")
          && rowText.includes("진행로그 추출")
          && rowText.includes("제목 정규화")
          && rowText.includes("세션근거 제안")
        );
      return text.includes("OpenAI")
        && text.includes("GLM")
        && text.includes("Codex")
        && text.includes("fallback")
        && rowText.includes("openai-responses")
        && rowText.includes("glm-chat-completions")
        && (rowText.includes("codex-sdk") || rowText.includes("codex-cli-exec"))
        && usableProviderShowsCapabilities;
    }, undefined, { timeout: 90000 });
    workAiProviderStatusMeta =
      (await page.locator('[data-work-ai-provider-status-meta="true"]').textContent())?.trim() ?? "";
    workAiProviderStatusRows =
      await page.locator('[data-work-ai-provider-status="true"] article').allTextContents();
    step("work log normalization candidates");
    await page.locator('[data-work-log-normalization-needs-title-only="true"]').check();
    await page.waitForFunction(() => {
      const input = document.querySelector('[data-work-log-normalization-needs-title-only="true"]');
      return Boolean(input && input.checked);
    }, undefined, { timeout: 30000 });
    await waitForEnabled(page, '[data-load-work-log-normalization-candidates="true"]');
    await page.locator('[data-load-work-log-normalization-candidates="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-normalization-candidates-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-normalization-candidates="true"] article'));
      return text.includes("정규화 후보")
        && text.includes("원본 작업")
        && rows.some((row) => {
          const rowText = row.textContent ?? "";
          return rowText.includes("AI 저장") && rowText.includes("generic_title");
        });
    }, undefined, { timeout: 120000 });
    workLogNormalizationCandidatesMeta =
      (await page.locator('[data-work-log-normalization-candidates-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizationCandidateRows =
      await page.locator('[data-work-log-normalization-candidates="true"] article').allTextContents();
    step("work log normalization proposals");
    await waitForEnabled(page, '[data-load-work-log-normalization-proposals="true"]');
    await page.locator('[data-load-work-log-normalization-proposals="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-normalization-proposals-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-normalization-proposals="true"] article'));
      const providerAttemptVisible = text.includes("경고")
        || rows.some((row) => /provider (glm-chat-completions|openai-responses)/.test(row.textContent ?? ""));
      return text.includes("정규화 제안")
        && text.includes("review")
        && providerAttemptVisible
        && rows.some((row) => {
          const rowText = row.textContent ?? "";
          return rowText.includes("AI 검토 필요") && rowText.includes("generic_title");
        });
    }, undefined, { timeout: 120000 });
    workLogNormalizationProposalsMeta =
      (await page.locator('[data-work-log-normalization-proposals-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizationProposalRows =
      await page.locator('[data-work-log-normalization-proposals="true"] article').allTextContents();
    step("work log normalization review queue");
    await waitForEnabled(page, '[data-sync-work-log-normalization-review-queue="true"]');
    await page.locator('[data-sync-work-log-normalization-review-queue="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-normalization-review-queue-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-normalization-review-queue="true"] article'));
      const providerAttemptVisible = text.includes("경고")
        || rows.some((row) => /provider (glm-chat-completions|openai-responses)/.test(row.textContent ?? ""));
      return text.includes("정규화 큐 저장")
        && text.includes("표시")
        && providerAttemptVisible
        && rows.some((row) => (row.textContent ?? "").includes("confidence"));
    }, undefined, { timeout: 120000 });
    workLogNormalizationReviewQueueMeta =
      (await page.locator('[data-work-log-normalization-review-queue-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizationReviewQueueRows =
      await page.locator('[data-work-log-normalization-review-queue="true"] article').allTextContents();
    const firstNormalizationQueueProject =
      (await page
        .locator('[data-work-log-normalization-review-queue="true"] article strong')
        .first()
        .textContent())?.trim() ?? "";
    if (!firstNormalizationQueueProject) {
      throw new Error("Normalization review queue did not expose a project for filtering");
    }
    await page
      .locator('[data-work-log-normalization-review-queue-project-filter="true"]')
      .fill(firstNormalizationQueueProject);
    await page.locator('[data-apply-work-log-normalization-review-queue-filters="true"]').click();
    await page.waitForFunction((project) => {
      const meta = document.querySelector('[data-work-log-normalization-review-queue-filter-meta="true"]')
        ?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-normalization-review-queue="true"] article'));
      return meta.includes("정규화 큐 필터")
        && meta.includes("필터 1개")
        && rows.length > 0
        && rows.every((row) => row.querySelector("strong")?.textContent?.trim() === project);
    }, firstNormalizationQueueProject, { timeout: 30000 });
    workLogNormalizationReviewQueueFilterMeta =
      (await page
        .locator('[data-work-log-normalization-review-queue-filter-meta="true"]')
        .textContent())?.trim() ?? "";
    workLogNormalizationReviewQueueFilteredRows =
      await page.locator('[data-work-log-normalization-review-queue="true"] article').allTextContents();
    await page.locator('[data-clear-work-log-normalization-review-queue-filters="true"]').click();
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-log-normalization-review-queue-filter-meta="true"]')
        ?.textContent ?? "";
      return meta.includes("필터 없음");
    }, undefined, { timeout: 30000 });
    const firstNormalizationApprove = page
      .locator('[data-approve-work-log-normalization-review-queue]')
      .first();
    await firstNormalizationApprove.waitFor({ timeout: 90000 });
    const firstNormalizationCandidateId = await firstNormalizationApprove.getAttribute(
      "data-approve-work-log-normalization-review-queue",
    );
    if (!firstNormalizationCandidateId) {
      throw new Error("Normalization review queue approve button did not expose candidate id");
    }
    await firstNormalizationApprove.click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-normalization-review-queue-meta="true"]')?.textContent ?? "";
      return text.includes("승인 1개");
    }, undefined, { timeout: 90000 });
    const normalizationQueueAfterApprove = await bridgeJson(
      page,
      "/api/work-log-normalization-review-queue",
      { options: { limit: 200 } },
    );
    const approvedNormalizationRow = normalizationQueueAfterApprove.items.find(
      (item) => item.candidate_id === firstNormalizationCandidateId,
    );
    if (
      !approvedNormalizationRow
      || approvedNormalizationRow.review_state !== "approved"
      || approvedNormalizationRow.review_reason !== "operator_approved_normalization"
    ) {
      throw new Error(`Normalization review queue approval did not persist: ${
        JSON.stringify(approvedNormalizationRow ?? null)
      }`);
    }
    workLogNormalizationReviewQueueStateAfterApprove =
      `${approvedNormalizationRow.review_state} · ${approvedNormalizationRow.review_reason}`;
    step("work log normalization apply");
    await waitForEnabled(page, '[data-apply-work-log-normalization-review-queue="true"]');
    await page.locator('[data-apply-work-log-normalization-review-queue="true"]').click();
    await page.waitForFunction((candidateId) => {
      const meta = document.querySelector('[data-work-log-normalization-apply-meta="true"]')
        ?.textContent ?? "";
      const managementMeta = document.querySelector('[data-work-management-overview-meta="true"]')
        ?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-normalized-items="true"] article'));
      return meta.includes("적용 1개")
        && meta.includes("저장 총 1개")
        && managementMeta.includes("정규화 1")
        && rows.some((row) => (row.textContent ?? "").includes(candidateId));
    }, firstNormalizationCandidateId, { timeout: 90000 });
    workLogNormalizationApplyMeta =
      (await page.locator('[data-work-log-normalization-apply-meta="true"]').textContent())?.trim() ?? "";
    workManagementMetaAfterNormalizationApply =
      (await page.locator('[data-work-management-overview-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizedRows =
      await page.locator('[data-work-log-normalized-items="true"] article').allTextContents();
    step("work log normalization stale fixture");
    const staleFixture = normalizationReviewQueueFixtureFromItem(approvedNormalizationRow);
    const staleFixtureCandidateId = "work-normalize-QAFixture-stale-a1";
    await withMockedNormalizationReviewQueue(page, staleFixture, async () => {
      await waitForEnabled(page, '[data-sync-work-log-normalization-review-queue="true"]');
      await page.locator('[data-sync-work-log-normalization-review-queue="true"]').click();
      await page.waitForFunction((candidateId) => {
        const rejectButton = document.querySelector(
          `[data-reject-work-log-normalization-review-queue="${candidateId}"]`,
        );
        const staleRow = rejectButton?.closest("article") ?? null;
        if (!staleRow) return false;
        const text = staleRow.textContent ?? "";
        return text.includes("stale")
          && text.includes("proposal_no_longer_live")
          && !staleRow.querySelector(`[data-approve-work-log-normalization-review-queue="${candidateId}"]`)
          && Boolean(rejectButton);
      }, staleFixtureCandidateId, { timeout: 90000 });
    });
    const staleApproveButtonCount = await page
      .locator(`[data-approve-work-log-normalization-review-queue="${staleFixtureCandidateId}"]`)
      .count();
    const staleRejectButtonCount = await page
      .locator(`[data-reject-work-log-normalization-review-queue="${staleFixtureCandidateId}"]`)
      .count();
    if (staleApproveButtonCount !== 0 || staleRejectButtonCount !== 1) {
      throw new Error(
        `Stale normalization fixture action state mismatch: approve=${staleApproveButtonCount}, reject=${staleRejectButtonCount}`,
      );
    }
    workLogNormalizationStaleFixtureMeta =
      (await page.locator('[data-work-log-normalization-review-queue-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizationStaleFixtureRows =
      await page.locator('[data-work-log-normalization-review-queue="true"] article').allTextContents();
    workLogNormalizationStaleFixtureActionState = {
      candidateId: staleFixtureCandidateId,
      approveButtonCount: staleApproveButtonCount,
      rejectButtonCount: staleRejectButtonCount,
    };
    step("work log normalization rejected AI fixture labels");
    const rejectedAiFixture = rejectedAiNormalizationReviewQueueFixtureFromItem(approvedNormalizationRow);
    const lowConfidenceFixtureCandidateId = "work-normalize-QAFixture-low-confidence-a1";
    const evidenceMismatchFixtureCandidateId = "work-normalize-QAFixture-evidence-mismatch-a1";
    await withMockedNormalizationReviewQueue(page, rejectedAiFixture, async () => {
      await waitForEnabled(page, '[data-sync-work-log-normalization-review-queue="true"]');
      await page.locator('[data-sync-work-log-normalization-review-queue="true"]').click();
      await page.waitForFunction(([lowConfidenceId, evidenceMismatchId]) => {
        const lowRow = document
          .querySelector(`[data-reject-work-log-normalization-review-queue="${lowConfidenceId}"]`)
          ?.closest("article");
        const evidenceRow = document
          .querySelector(`[data-reject-work-log-normalization-review-queue="${evidenceMismatchId}"]`)
          ?.closest("article");
        const lowText = lowRow?.textContent ?? "";
        const evidenceText = evidenceRow?.textContent ?? "";
        return lowText.includes("검증 실패 · confidence 낮음")
          && lowText.includes("glm-test-model")
          && evidenceText.includes("검증 실패 · 근거가 후보 원문에 없음")
          && evidenceText.includes("glm-test-model");
      }, [lowConfidenceFixtureCandidateId, evidenceMismatchFixtureCandidateId], { timeout: 90000 });
    });
    workLogNormalizationRejectedAiFixtureMeta =
      (await page.locator('[data-work-log-normalization-review-queue-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizationRejectedAiFixtureRows =
      await page.locator('[data-work-log-normalization-review-queue="true"] article').allTextContents();
    step("work log review queue");
    await page.locator('[data-sync-work-log-review-queue="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-review-queue-meta="true"]')?.textContent ?? "";
      return text.includes("큐 저장")
        && text.includes("동기화")
        && text.includes("AI 대기")
        && text.includes("위험차단")
        && text.includes("승인 0개");
    }, undefined, { timeout: 90000 });
    workLogReviewQueueMeta =
      (await page.locator('[data-work-log-review-queue-meta="true"]').textContent())?.trim() ?? "";
    approvedReviewQueueSaveDisabledWhenEmpty = await page
      .locator('[data-save-approved-work-log-review-queue="true"]')
      .evaluate((button) => button.disabled);
    if (!approvedReviewQueueSaveDisabledWhenEmpty) {
      throw new Error("Approved review queue save button should be disabled when approved queue count is zero");
    }
    step("work log approved review queue save");
    insertSyntheticApprovedReviewQueueRow();
    await waitForEnabled(page, '[data-sync-work-log-review-queue="true"]');
    await page.locator('[data-sync-work-log-review-queue="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-review-queue-meta="true"]')?.textContent ?? "";
      return text.includes("큐 저장") && text.includes("승인 1개");
    }, undefined, { timeout: 90000 });
    workLogReviewQueueMetaAfterSynthetic =
      (await page.locator('[data-work-log-review-queue-meta="true"]').textContent())?.trim() ?? "";
    const workLogReviewQueueProject =
      (await page.locator('[data-work-log-review-queue="true"] article strong').first().textContent())?.trim()
      ?? "";
    if (!workLogReviewQueueProject) {
      throw new Error("Work log review queue project should be visible before filter QA");
    }
    await page.locator('[data-work-log-review-queue-project-filter="true"]').fill(workLogReviewQueueProject);
    await page.locator('[data-apply-work-log-review-queue-filters="true"]').click();
    await page.waitForFunction((project) => {
      const metaText = document.querySelector('[data-work-log-review-queue-filter-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-review-queue="true"] article'));
      return metaText.includes("백필큐 필터")
        && metaText.includes("필터 1개")
        && rows.length > 0
        && rows.every((row) => row.querySelector("strong")?.textContent?.trim() === project);
    }, workLogReviewQueueProject, { timeout: 90000 });
    workLogReviewQueueFilterMeta =
      (await page.locator('[data-work-log-review-queue-filter-meta="true"]').textContent())?.trim() ?? "";
    workLogReviewQueueFilteredRows =
      await page.locator('[data-work-log-review-queue="true"] article').allTextContents();
    await page.locator('[data-clear-work-log-review-queue-filters="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-review-queue-filter-meta="true"]')?.textContent ?? "";
      return text.includes("백필큐 필터") && text.includes("필터 없음");
    }, undefined, { timeout: 90000 });
    await waitForEnabled(page, '[data-save-approved-work-log-review-queue="true"]');
    await page.locator('[data-save-approved-work-log-review-queue="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-extraction-persistence="true"]')?.textContent ?? "";
      return text.includes("accepted 제안 1개 저장");
    }, undefined, { timeout: 90000 });
    approvedReviewQueuePersistence =
      (await page.locator('[data-work-log-extraction-persistence="true"]').textContent())?.trim() ?? "";
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-runs-meta="true"]')?.textContent ?? "";
      return text.includes("실행 1개")
        && text.includes("approved_review_queue")
        && text.includes("saved 1개");
    }, undefined, { timeout: 90000 });
    workLogRunsMeta =
      (await page.locator('[data-work-log-runs-meta="true"]').textContent())?.trim() ?? "";
    await waitForEnabled(page, '[data-load-work-log-runs="true"]');
    step("work log extraction run history");
    await page.locator('[data-load-work-log-runs="true"]').click();
    await page.waitForFunction(() => {
      const rows = Array.from(document.querySelectorAll('[data-work-log-runs="true"] article'));
      return rows.some((row) => {
        const text = row.textContent ?? "";
        return text.includes("approved_review_queue")
          && text.includes("completed")
          && text.includes("work-log-QA-approved-browser-a1");
      });
    }, undefined, { timeout: 90000 });
    workLogRunRows = await page.locator('[data-work-log-runs="true"] article').allTextContents();
    step("work log extraction local provider guard");
    await page.locator('[data-load-work-log-extraction="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-extraction-meta="true"]')?.textContent ?? "";
      return text.includes("후보")
        && text.includes("accepted")
        && text.includes("rejected");
    }, undefined, { timeout: 90000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-extraction-provider-warning="true"]')?.textContent ?? "";
      return text.includes("경고")
        && (
          (text.includes("후보가 0개") && text.includes("provider 호출을 생략"))
          || (text.includes("위험") && text.includes("외부 AI provider"))
        );
    }, undefined, { timeout: 90000 });
    workLogExtractionProviderWarning =
      (await page.locator('[data-work-log-extraction-provider-warning="true"]').textContent())?.trim() ?? "";
    step("work log saved items");
    await page.locator('[data-load-work-log-items="true"]').click();
    await page.waitForFunction(() => {
      return Boolean(document.querySelector('[data-work-log-items-meta="true"]'));
    }, undefined, { timeout: 90000 });
    await page.waitForFunction(() => {
      const rows = Array.from(document.querySelectorAll('[data-work-log-items="true"] article'));
      return rows.some((row) => (row.textContent ?? "").includes("progress-log-freeze"));
    }, undefined, { timeout: 90000 });
    workLogItemRows = await page.locator('[data-work-log-items="true"] article').allTextContents();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-review-decisions="true"]')?.textContent ?? "";
      const blockers = document.querySelector('[data-work-management-review-blockers="true"]')?.textContent ?? "";
      const resolution = document.querySelector('[data-work-management-review-resolution="true"]')?.textContent ?? "";
      return text.includes("검토 결정")
        && text.includes("저장 row")
        && text.includes("대기")
        && text.includes("stale")
        && text.includes("승인")
        && text.includes("거절")
        && text.includes("추출")
        && text.includes("정규화")
        && text.includes("세션")
        && blockers.includes("검토 차단")
        && blockers.includes("정규화")
        && blockers.includes("세션")
        && resolution.includes("검토 해소 경로")
        && resolution.includes("정규화")
        && resolution.includes("세션");
    }, undefined, { timeout: 90000 });
    workManagementReviewDecisions =
      (await page.locator('[data-work-management-review-decisions="true"]').textContent())?.trim() ?? "";
    workManagementReviewBlockers =
      (await page.locator('[data-work-management-review-blockers="true"]').textContent())?.trim() ?? "";
    workManagementReviewResolution =
      (await page.locator('[data-work-management-review-resolution="true"]').textContent())?.trim() ?? "";

    if (consoleErrors.length > 0) {
      throw new Error(`Browser console errors:\n${consoleErrors.join("\n")}`);
    }
    if (httpErrors.length > 0) {
      throw new Error(`Browser HTTP errors:\n${httpErrors.join("\n")}`);
    }

    const result = {
      databasePath: DATABASE_PATH,
      prompts: scanPersistence.total_prompts,
      importProcessedFiles: importStates.processed_files,
      importEvents: importEvents.total_events,
      snapshots: snapshots.total_snapshots,
      workSessionLimit: WORK_SESSION_LIMIT,
      workSessionIndexBackfill,
      workSummaryIndex,
      workStatusExportLimitMeta,
      workStatusExportMeta,
      workStatusExportPageMeta,
      workStatusExportNextPageMeta,
      workStatusExportNextPageRows,
      workStatusExportIndex,
      workStatusExportFullSessionLimitInput,
      workStatusExportFullSessionLimitMeta,
      workStatusExportRows,
      workStatusExportRowDetail,
      workStatusExportFilterMeta,
      workStatusExportFilteredRows,
      workStatusExportFilteredRowDetail,
      workStatusExportBoundedFilterMeta,
      workStatusExportBoundedFilteredRows,
      workStatusExportBoundedFilteredRowDetail,
      workStatusExportUnresolvedFixtureMeta,
      workStatusExportUnresolvedFixtureRows,
      workStatusExportUnresolvedFixtureRowDetail,
      workSessionEvidenceCandidatesMeta,
      workSessionEvidenceCandidateRows,
      workSessionEvidenceProposalsMeta,
      workSessionEvidenceProposalRows,
      workSessionEvidenceProposalsUiMeta,
      workSessionEvidenceProposalsUiRows,
      workSessionEvidenceReviewQueueMeta,
      workSessionEvidenceReviewQueueRows,
      workSessionEvidenceReviewQueueStateAfterApprove,
      workSessionEvidenceReviewQueueUiMeta,
      workSessionEvidenceReviewQueueUiRows,
      workSessionEvidenceReviewQueueFilterMeta,
      workSessionEvidenceReviewQueueFilteredRows,
      workSessionEvidenceReviewQueueUiStateAfterApprove,
      workStatusExportMarkdownPreview: workStatusExportMarkdown.slice(0, 240),
      workManagementMeta,
      workManagementReadiness,
      workManagementReviewDecisions,
      workManagementReviewBlockers,
      workManagementReviewResolution,
      workManagementNextAction,
      workManagementDurabilityWarning,
      workManagementSessionBackfillWarning,
      workManagementMetaAfterFreeze,
      workLogFreezePersistence,
      workManagementFilterMeta,
      workManagementFilteredRows,
      workManagementReviewActionRows,
      workManagementMissingConfidenceRows,
      workManagementPersistenceRows,
      workManagementSessionRows,
      workManagementActionRows,
      coverageMeta,
      coverageFilterMeta,
      coverageFilteredRows,
      workLogCandidatesMeta,
      workLogCandidateRows,
      workAiProviderStatusMetaAfterManagement,
      workAiProviderStatusMeta,
      workAiProviderStatusRows,
      workLogNormalizationCandidatesMeta,
      workLogNormalizationCandidateRows,
      workLogNormalizationProposalsMeta,
      workLogNormalizationProposalRows,
      workLogNormalizationReviewQueueMeta,
      workLogNormalizationReviewQueueRows,
      workLogNormalizationReviewQueueFilterMeta,
      workLogNormalizationReviewQueueFilteredRows,
      workLogNormalizationReviewQueueStateAfterApprove,
      workLogNormalizationStaleFixtureMeta,
      workLogNormalizationStaleFixtureRows,
      workLogNormalizationStaleFixtureActionState,
      workLogNormalizationRejectedAiFixtureMeta,
      workLogNormalizationRejectedAiFixtureRows,
      workLogNormalizationApplyMeta,
      workManagementMetaAfterNormalizationApply,
      workLogNormalizedRows,
      workLogReviewQueueMeta,
      approvedReviewQueueSaveDisabledWhenEmpty,
      workLogReviewQueueMetaAfterSynthetic,
      workLogReviewQueueFilterMeta,
      workLogReviewQueueFilteredRows,
      approvedReviewQueuePersistence,
      workLogRunsMeta,
      workLogRunRows,
      workLogExtractionProviderWarning,
      workLogItemRows,
    };
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

function stopServer(child) {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
  setTimeout(() => {
    if (!child.killed) child.kill("SIGKILL");
  }, 3000).unref();
}

const bridge = spawnServer("bridge", "cargo", [
  "run",
  "--quiet",
  "--bin",
  "promptvault-cli",
  "--",
  "serve",
  "--addr",
  `${HOST}:${BRIDGE_PORT}`,
  "--database",
  DATABASE_PATH,
], { cwd: join(PROJECT_ROOT, "src-tauri"), env: bridgeQaEnv() });
const app = spawnServer("vite", "npm", ["run", "dev", "--", "--host", HOST, "--port", String(APP_PORT)]);

try {
  step(`wait for bridge http://${HOST}:${BRIDGE_PORT}/api/health`);
  await waitForBridgeHealth(START_TIMEOUT_MS);
  step(`wait for app http://${HOST}:${APP_PORT}`);
  await waitForHttp(`http://${HOST}:${APP_PORT}`, START_TIMEOUT_MS);
  await runBrowserQa();
} finally {
  stopServer(app);
  stopServer(bridge);
  if (!process.env.PROMPTVAULT_QA_DATABASE) {
    rmSync(DATABASE_PATH, { force: true });
  }
  rmSync(SECRET_ENV_DIR, { force: true, recursive: true });
}

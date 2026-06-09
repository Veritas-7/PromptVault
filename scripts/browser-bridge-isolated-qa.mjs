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
if (!Number.isInteger(WORK_SESSION_LIMIT) || WORK_SESSION_LIMIT < 1 || WORK_SESSION_LIMIT > 1000) {
  throw new Error(
    `PROMPTVAULT_QA_WORK_SESSION_LIMIT must be an integer from 1 to 1000, got ${WORK_SESSION_LIMIT}`,
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

async function runBrowserQa() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const httpErrors = [];
  let workLogFreezePersistence = "";
  let workManagementMetaAfterFreeze = "";
  let workManagementFilterMeta = "";
  let workManagementFilteredRows = [];
  let workManagementMissingConfidenceRows = [];
  let workManagementPersistenceRows = [];
  let workManagementDurabilityWarning = "";
  let workManagementMeta = "";
  let workStatusExportMeta = "";
  let workStatusExportIndex = "";
  let workStatusExportRows = [];
  let workStatusExportMarkdown = "";
  let workSummaryIndex = "";
  let workSessionIndexBackfill = null;
  let coverageMeta = "";
  let workLogCandidatesMeta = "";
  let workLogNormalizationCandidatesMeta = "";
  let workLogNormalizationCandidateRows = [];
  let workLogNormalizationProposalsMeta = "";
  let workLogNormalizationProposalRows = [];
  let workLogNormalizationReviewQueueMeta = "";
  let workLogNormalizationReviewQueueRows = [];
  let workLogNormalizationReviewQueueStateAfterApprove = "";
  let workLogNormalizationApplyMeta = "";
  let workManagementMetaAfterNormalizationApply = "";
  let workLogNormalizedRows = [];
  let workLogReviewQueueMeta = "";
  let approvedReviewQueueSaveDisabledWhenEmpty = null;
  let workLogReviewQueueMetaAfterSynthetic = "";
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
        && processedFiles > previousCodexProcessedFiles;
    }, resetCodexProcessedFiles, { timeout: 120000 });
    workSessionIndexBackfill = {
      reset: resetWorkSessionIndexBackfill,
      continued: {
        meta: (await page.locator('[data-work-session-index-meta="true"]').textContent())?.trim() ?? "",
        warning: (await page.locator('[data-work-session-index-warning="true"]').textContent())?.trim() ?? "",
        remaining: (await page.locator('[data-work-session-index-remaining="true"]').textContent())?.trim() ?? "",
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
        && processedFiles > previousCodexProcessedFiles;
    }, continuedCodexProcessedFiles, { timeout: 180000 });
    workSessionIndexBackfill.longContinued = {
      meta: (await page.locator('[data-work-session-index-meta="true"]').textContent())?.trim() ?? "",
      warning: (await page.locator('[data-work-session-index-warning="true"]').textContent())?.trim() ?? "",
      remaining: (await page.locator('[data-work-session-index-remaining="true"]').textContent())?.trim() ?? "",
      sourceStates: await page.locator('[data-work-session-index-source-state="true"]').allTextContents(),
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
    const localToggle = page.locator(".local-recommendation-toggle input");
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
    await page.locator('[data-load-work-status-export="true"]').click();
    await page.waitForFunction(() => {
      const meta = document.querySelector('[data-work-status-export-meta="true"]')?.textContent ?? "";
      const index = document.querySelector('[data-work-status-export-index="true"]')?.textContent ?? "";
      const markdown = document.querySelector('[data-work-status-export-markdown="true"]')?.textContent ?? "";
      return meta.includes("프로젝트")
        && meta.includes("세션 근거")
        && index.includes("메타데이터 우선")
        && markdown.includes("Project/Day Rows")
        && document.querySelectorAll('[data-work-status-export-row="true"]').length > 0;
    }, undefined, { timeout: 120000 });
    workStatusExportMeta =
      (await page.locator('[data-work-status-export-meta="true"]').textContent())?.trim() ?? "";
    workStatusExportIndex =
      (await page.locator('[data-work-status-export-index="true"]').textContent())?.trim() ?? "";
    workStatusExportRows = await page.locator('[data-work-status-export-row="true"]').allTextContents();
    workStatusExportMarkdown =
      (await page.locator('[data-work-status-export-markdown="true"]').textContent())?.trim() ?? "";
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
    await page.locator('[data-refresh-work-management-overview="true"]').click();
    await page.locator('[data-work-management-overview-meta="true"]').waitFor({ timeout: 120000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-management-overview-meta="true"]')?.textContent ?? "";
      return text.includes("저장관리") && text.includes("라이브만");
    }, undefined, { timeout: 120000 });
    workManagementMeta =
      (await page.locator('[data-work-management-overview-meta="true"]').textContent())?.trim() ?? "";
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
    await waitForEnabled(page, '[data-work-management-sort="true"]');
    await page.locator('[data-work-management-sort="true"]').selectOption("missing_confidence_first");
    await page.waitForFunction(() => {
      const rows = [...document.querySelectorAll('[data-work-management-overview="true"] article')];
      return rows.some((row) => (row.textContent ?? "").includes("confidence 없음"));
    }, undefined, { timeout: 120000 });
    workManagementMissingConfidenceRows =
      await page.locator('[data-work-management-overview="true"] article').allTextContents();
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
    await page.locator('[data-load-work-log-coverage="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-coverage-meta="true"]')?.textContent ?? "";
      return text.includes("unparsed 0개");
    }, undefined, { timeout: 120000 });
    coverageMeta =
      (await page.locator('[data-work-log-coverage-meta="true"]').textContent())?.trim() ?? "";
    await page.locator('[data-load-work-log-candidates="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-candidates-meta="true"]')?.textContent ?? "";
      return text.includes("백필큐 비어 있음")
        && text.includes("이유 unparsed 없음")
        && text.includes("AI 전송가능 0개")
        && text.includes("위험차단 0개");
    }, undefined, { timeout: 90000 });
    workLogCandidatesMeta =
      (await page.locator('[data-work-log-candidates-meta="true"]').textContent())?.trim() ?? "";
    await waitForEnabled(page, '[data-load-work-log-normalization-candidates="true"]');
    await page.locator('[data-load-work-log-normalization-candidates="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-normalization-candidates-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-normalization-candidates="true"] article'));
      return text.includes("정규화 후보")
        && text.includes("원본 작업")
        && rows.some((row) => (row.textContent ?? "").includes("AI 저장"));
    }, undefined, { timeout: 120000 });
    workLogNormalizationCandidatesMeta =
      (await page.locator('[data-work-log-normalization-candidates-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizationCandidateRows =
      await page.locator('[data-work-log-normalization-candidates="true"] article').allTextContents();
    await waitForEnabled(page, '[data-load-work-log-normalization-proposals="true"]');
    await page.locator('[data-load-work-log-normalization-proposals="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-normalization-proposals-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-normalization-proposals="true"] article'));
      return text.includes("정규화 제안")
        && text.includes("review")
        && rows.some((row) => (row.textContent ?? "").includes("AI 검토 필요"));
    }, undefined, { timeout: 120000 });
    workLogNormalizationProposalsMeta =
      (await page.locator('[data-work-log-normalization-proposals-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizationProposalRows =
      await page.locator('[data-work-log-normalization-proposals="true"] article').allTextContents();
    await waitForEnabled(page, '[data-sync-work-log-normalization-review-queue="true"]');
    await page.locator('[data-sync-work-log-normalization-review-queue="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-normalization-review-queue-meta="true"]')?.textContent ?? "";
      const rows = Array.from(document.querySelectorAll('[data-work-log-normalization-review-queue="true"] article'));
      return text.includes("정규화 큐 저장")
        && text.includes("표시")
        && rows.some((row) => (row.textContent ?? "").includes("confidence"));
    }, undefined, { timeout: 120000 });
    workLogNormalizationReviewQueueMeta =
      (await page.locator('[data-work-log-normalization-review-queue-meta="true"]').textContent())?.trim() ?? "";
    workLogNormalizationReviewQueueRows =
      await page.locator('[data-work-log-normalization-review-queue="true"] article').allTextContents();
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
    await page.locator('[data-sync-work-log-review-queue="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-review-queue-meta="true"]')?.textContent ?? "";
      return text.includes("큐 저장 0개")
        && text.includes("동기화 0개")
        && text.includes("AI 대기 0개")
        && text.includes("위험차단 0개");
    }, undefined, { timeout: 90000 });
    workLogReviewQueueMeta =
      (await page.locator('[data-work-log-review-queue-meta="true"]').textContent())?.trim() ?? "";
    approvedReviewQueueSaveDisabledWhenEmpty = await page
      .locator('[data-save-approved-work-log-review-queue="true"]')
      .evaluate((button) => button.disabled);
    if (!approvedReviewQueueSaveDisabledWhenEmpty) {
      throw new Error("Approved review queue save button should be disabled when approved queue count is zero");
    }
    insertSyntheticApprovedReviewQueueRow();
    await waitForEnabled(page, '[data-sync-work-log-review-queue="true"]');
    await page.locator('[data-sync-work-log-review-queue="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-review-queue-meta="true"]')?.textContent ?? "";
      return text.includes("큐 저장 1개") && text.includes("승인 1개");
    }, undefined, { timeout: 90000 });
    workLogReviewQueueMetaAfterSynthetic =
      (await page.locator('[data-work-log-review-queue-meta="true"]').textContent())?.trim() ?? "";
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
    await page.locator('[data-load-work-log-extraction="true"]').click();
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-extraction-meta="true"]')?.textContent ?? "";
      return text.includes("후보 0개") || text.includes("제안 0개");
    }, undefined, { timeout: 90000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-work-log-extraction-provider-warning="true"]')?.textContent ?? "";
      return text.includes("후보가 0개") && text.includes("provider 호출을 생략");
    }, undefined, { timeout: 90000 });
    workLogExtractionProviderWarning =
      (await page.locator('[data-work-log-extraction-provider-warning="true"]').textContent())?.trim() ?? "";
    await page.locator('[data-load-work-log-items="true"]').click();
    await page.waitForFunction(() => {
      return Boolean(document.querySelector('[data-work-log-items-meta="true"]'));
    }, undefined, { timeout: 90000 });
    await page.waitForFunction(() => {
      const rows = Array.from(document.querySelectorAll('[data-work-log-items="true"] article'));
      return rows.some((row) => (row.textContent ?? "").includes("progress-log-freeze"));
    }, undefined, { timeout: 90000 });
    workLogItemRows = await page.locator('[data-work-log-items="true"] article').allTextContents();

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
      workStatusExportMeta,
      workStatusExportIndex,
      workStatusExportRows,
      workStatusExportMarkdownPreview: workStatusExportMarkdown.slice(0, 240),
      workManagementMeta,
      workManagementDurabilityWarning,
      workManagementMetaAfterFreeze,
      workLogFreezePersistence,
      workManagementFilterMeta,
      workManagementFilteredRows,
      workManagementMissingConfidenceRows,
      workManagementPersistenceRows,
      coverageMeta,
      workLogCandidatesMeta,
      workLogNormalizationCandidatesMeta,
      workLogNormalizationCandidateRows,
      workLogNormalizationProposalsMeta,
      workLogNormalizationProposalRows,
      workLogNormalizationReviewQueueMeta,
      workLogNormalizationReviewQueueRows,
      workLogNormalizationReviewQueueStateAfterApprove,
      workLogNormalizationApplyMeta,
      workManagementMetaAfterNormalizationApply,
      workLogNormalizedRows,
      workLogReviewQueueMeta,
      approvedReviewQueueSaveDisabledWhenEmpty,
      workLogReviewQueueMetaAfterSynthetic,
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

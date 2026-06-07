import assert from "node:assert/strict";
import test from "node:test";
import {
  importProgressDisplay,
  importProgressLabel,
  importProgressPercent,
  importStateProgressPercent,
  importProgressValueText,
  importStopNoticeText,
  importRunFailureText,
  importStatusLabel,
  importStopActionLabel,
  type ImportRunState,
} from "../src/importProgress.ts";
import type { ImportBatchResult, ImportState } from "../src/types.ts";

function importResult(
  processedFiles: number,
  totalFiles: number,
  completed = false,
  batchFileCount = 1,
  batchPromptCount = 0,
): ImportBatchResult {
  return {
    generated_at: "2026-06-06T00:00:00Z",
    source: {
      id: "source-a",
      label: "Source A",
      root_path: "/tmp/source-a",
      status: "ok",
      file_count: totalFiles,
      byte_count: 0,
      large_file_count: 0,
      largest_file_bytes: 0,
      newest_modified_at: null,
      notes: [],
    },
    state: {
      source_id: "source-a",
      source_label: "Source A",
      root_path: "/tmp/source-a",
      total_files: totalFiles,
      total_bytes: 0,
      next_file_index: processedFiles,
      processed_files: processedFiles,
      imported_prompt_count: 0,
      completed,
      updated_at: "2026-06-06T00:00:00Z",
    },
    batch_start_index: Math.max(0, processedFiles - 1),
    batch_file_count: batchFileCount,
    batch_prompt_count: batchPromptCount,
    returned_prompt_count: 0,
    prompts: [],
    stats: {
      total_prompts: 0,
      total_files: 0,
      total_words: 0,
      average_words: 0,
      average_quality: 0,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [],
    },
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 0,
      inserted_prompt_count: 0,
      updated_prompt_count: 0,
      date_count: 0,
    },
    warnings: [],
  };
}

function importState(
  processedFiles: number,
  totalFiles: number,
  completed = false,
  sourceLabel = "Source A",
): ImportState {
  return {
    source_id: "source-a",
    source_label: sourceLabel,
    root_path: "/tmp/source-a",
    total_files: totalFiles,
    total_bytes: 0,
    next_file_index: processedFiles,
    processed_files: processedFiles,
    imported_prompt_count: 0,
    completed,
    updated_at: "2026-06-06T00:00:00Z",
  };
}

test("import progress is bounded and rounded", () => {
  assert.equal(importProgressPercent(importResult(3, 10)), 30);
  assert.equal(importProgressPercent(importResult(15, 10)), 100);
  assert.equal(importProgressPercent(importResult(0, 0, true)), 100);
});

test("saved import progress is bounded and rounded", () => {
  assert.equal(importStateProgressPercent(importState(81, 144)), 56);
  assert.equal(importStateProgressPercent(importState(200, 144)), 100);
  assert.equal(importStateProgressPercent(importState(0, 0, true)), 100);
  assert.equal(importStateProgressPercent(null), 0);
});

test("import progress display uses saved cursor before first batch result", () => {
  const display = importProgressDisplay(
    null,
    importState(81, 144, false, "Gemini temporary chats"),
    "Gemini temporary chats",
    144,
    5,
  );

  assert.deepEqual(display, {
    batchSummary: "배치당 5개 파일",
    percent: 56,
    processedFiles: 81,
    sourceLabel: "Gemini temporary chats",
    totalFiles: 144,
  });
});

test("import progress display prefers the latest batch result", () => {
  const display = importProgressDisplay(
    importResult(86, 144, false, 1, 1),
    importState(81, 144, false, "Saved source"),
    "Plan source",
    144,
    5,
  );

  assert.deepEqual(display, {
    batchSummary: "1개 파일 · 1개 프롬프트",
    percent: 60,
    processedFiles: 86,
    sourceLabel: "Source A",
    totalFiles: 144,
  });
});

test("import progress display falls back to active source metadata", () => {
  const display = importProgressDisplay(null, null, "  Plan source  ", 12, 5);

  assert.deepEqual(display, {
    batchSummary: "배치당 5개 파일",
    percent: 0,
    processedFiles: 0,
    sourceLabel: "Plan source",
    totalFiles: 12,
  });
});

test("import progress display pluralizes fallback batch size", () => {
  assert.equal(importProgressDisplay(null, null, "Plan source", 12, 1).batchSummary, "배치당 1개 파일");
  assert.equal(importProgressDisplay(null, null, "Plan source", 12, 2).batchSummary, "배치당 2개 파일");
});

test("import progress value text mirrors processed file counts", () => {
  assert.equal(importProgressValueText(86, 144), "86 / 144개 파일");
  assert.equal(importProgressValueText(1, 1), "1 / 1개 파일");
  assert.equal(importProgressValueText(1_200, 2_000), "1,200 / 2,000개 파일");
});

test("import progress label names the source in Korean", () => {
  assert.equal(importProgressLabel("Codex"), "Codex 가져오기 진행");
  assert.equal(importProgressLabel("  "), "선택한 소스 가져오기 진행");
  assert.equal(importProgressLabel(null), "선택한 소스 가져오기 진행");
});

test("import status explains continuous stop requests", () => {
  assert.equal(importStatusLabel(importResult(5, 10), "importing", "continuous", false), "실행 중");
  assert.equal(
    importStatusLabel(importResult(5, 10), "importing", "continuous", true),
    "현재 배치 후 중지 중",
  );
});

test("import status differentiates stopped and complete states", () => {
  assert.equal(importStatusLabel(importResult(5, 10), "stopped", "continuous", false), "중지됨");
  assert.equal(importStatusLabel(importResult(10, 10, true), "ready", "continuous", false), "완료");
});

test("import status reports failed state first", () => {
  const failed: ImportRunState = "failed";

  assert.equal(importStatusLabel(importResult(10, 10, true), failed, "single", false), "실패");
});

test("import stop action label explains continuous and queue stop targets", () => {
  assert.equal(importStopActionLabel("continuous", false), "현재 배치 후 가져오기 중지");
  assert.equal(importStopActionLabel("continuous", true), "현재 배치 후 가져오기 중지 중");
  assert.equal(importStopActionLabel("queue", false), "현재 소스 후 가져오기 대기열 중지");
  assert.equal(importStopActionLabel("queue", true), "현재 소스 후 가져오기 대기열 중지 중");
});

test("import failure text keeps a failed no-result run visible", () => {
  assert.equal(
    importRunFailureText("failed", "Gemini temporary chats"),
    "Gemini temporary chats 가져오기에 실패했습니다. 위 오류를 확인한 뒤 가져오기 계획에서 다시 시도하세요.",
  );
  assert.equal(
    importRunFailureText("failed", "  "),
    "선택한 소스를 가져오지 못했습니다. 위 오류를 확인한 뒤 가져오기 계획에서 다시 시도하세요.",
  );
  assert.equal(importRunFailureText("ready", "Gemini temporary chats"), null);
});

test("import stop notice explains continuous resume path", () => {
  assert.equal(
    importStopNoticeText("stopped", "continuous", "Gemini temporary chats"),
    "Gemini temporary chats 가져오기가 현재 배치 후 중지되었습니다. 저장된 커서에서 재개하려면 끝까지 실행을 다시 누르세요.",
  );
  assert.equal(
    importStopNoticeText("stopped", "continuous", "  "),
    "가져오기가 현재 배치 후 중지되었습니다. 저장된 커서에서 재개하려면 끝까지 실행을 다시 누르세요.",
  );
});

test("import stop notice explains partial queue resume path", () => {
  assert.equal(
    importStopNoticeText("stopped", "queue", null, 1, 3),
    "가져오기 대기열이 현재 소스 후 중지되었습니다. 3개 소스 중 1개 완료. 계속하려면 선택 실행을 다시 누르세요.",
  );
  assert.equal(
    importStopNoticeText("stopped", "queue", null, 5, 3),
    "가져오기 대기열이 현재 소스 후 중지되었습니다. 3개 소스 중 3개 완료. 계속하려면 선택 실행을 다시 누르세요.",
  );
  assert.equal(
    importStopNoticeText("stopped", "queue", null, 1, 1),
    "가져오기 대기열이 현재 소스 후 중지되었습니다. 1개 소스 중 1개 완료. 계속하려면 선택 실행을 다시 누르세요.",
  );
});

test("import stop notice is scoped to stopped imports", () => {
  assert.equal(importStopNoticeText("ready", "continuous", "Gemini temporary chats"), null);
  assert.equal(importStopNoticeText("failed", "queue", null, 1, 3), null);
});

import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  workSummaryActionLabel,
  workSummaryFailureText,
  workSummaryIndexStatusText,
  workSummaryMetaText,
  type WorkSummaryState,
} from "../src/workSummaryStatus.ts";
import type { ProjectWorkSummaryResult } from "../src/types.ts";

function lockState(overrides: Partial<ActionLockState> = {}): ActionLockState {
  return {
    importRunning: false,
    improvementRunning: false,
    planRunning: false,
    scanRunning: false,
    storedLoadRunning: false,
    workSummaryRunning: false,
    ...overrides,
  };
}

function summaryResult(overrides: Partial<ProjectWorkSummaryResult> = {}): ProjectWorkSummaryResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    provider: "local-citation-rules",
    used_ai: false,
    narrative_markdown: "- 2026-06-09 PromptVault: 요약",
    summaries: [],
    report: {
      generated_at: "2026-06-09T00:00:00Z",
      total_items: 3532,
      project_count: 14,
      date_count: 16,
      files_seen: 32,
      items_by_date: [],
      items_by_project: [],
      session_scan_prompt_count: 20,
      session_scan_sources: [],
      session_evidence_count: 541,
      session_sources: [],
      session_evidence_unique_count: 11,
      session_evidence_unique_sources: [],
      session_evidence_index_used: true,
      session_evidence_index_updated: false,
      session_evidence_index_count: 20,
      items: [],
      warnings: [],
    },
    warnings: [],
    ...overrides,
  };
}

test("work summary action label explains ready, loading, and locked states", () => {
  assert.equal(workSummaryActionLabel("idle", false, lockState()), "작업 요약 생성");
  assert.equal(workSummaryActionLabel("ready", true, lockState()), "작업 요약 새로고침");
  assert.equal(
    workSummaryActionLabel("loading", true, lockState({ workSummaryRunning: true })),
    "작업 요약 생성 중",
  );
  assert.equal(
    workSummaryActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 작업 요약을 새로고침할 수 없습니다",
  );
});

test("work summary status text uses report counts and index state", () => {
  const result = summaryResult();
  assert.equal(
    workSummaryMetaText("ready", result),
    "14개 프로젝트 · 16일 · 3,532개 작업 · 세션 근거 541건",
  );
  assert.equal(workSummaryMetaText("loading", result), "작업 요약 생성 중");
  assert.equal(workSummaryMetaText("failed", null), "작업 요약을 사용할 수 없음");
  assert.equal(
    workSummaryIndexStatusText(result),
    "세션 인덱스 사용 · 20개 근거 보관 · 고유 근거 11건",
  );
  assert.equal(
    workSummaryIndexStatusText(summaryResult({
      report: {
        ...result.report,
        session_evidence_index_used: false,
        session_evidence_index_updated: true,
      },
    })),
    "세션 인덱스 갱신 · 20개 근거 보관 · 고유 근거 11건",
  );
});

test("work summary failure text is only shown after failed loads", () => {
  const failed: WorkSummaryState = "failed";
  assert.equal(
    workSummaryFailureText(failed),
    "프로젝트 작업 요약을 불러오지 못했습니다. 브리지 상태나 진행 로그 스캔 범위를 확인하세요.",
  );
  assert.equal(workSummaryFailureText("ready"), null);
});

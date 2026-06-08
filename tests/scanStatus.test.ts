import assert from "node:assert/strict";
import test from "node:test";
import {
  scanLimitChangedAfterFailure,
  scanProgressLabel,
  scanResultTimestampText,
  scanRunFailureText,
  scanStopFailureText,
} from "../src/scanStatus.ts";
import type { ScanProgress } from "../src/types.ts";

function scanProgress(overrides: Partial<ScanProgress> = {}): ScanProgress {
  return {
    run_id: "scan-1",
    active: true,
    canceled: false,
    source_id: "source-a",
    source_label: "Source A",
    source_index: 1,
    source_count: 2,
    files_seen: 1,
    source_files_seen: 1,
    source_files_discovered: 1,
    source_file_count: 1,
    prompts_found: 1,
    limit: 10,
    updated_at: "2026-06-07T00:00:00Z",
    ...overrides,
  };
}

test("scan progress label handles missing progress", () => {
  assert.equal(scanProgressLabel(null), "스캔 진행 상황을 준비 중입니다.");
});

test("scan progress label pluralizes file and prompt counts", () => {
  assert.equal(
    scanProgressLabel(scanProgress()),
    "Source A: 1 / 1개 파일 · 1개 프롬프트 · 소스 1 / 2 · 제한 10",
  );
  assert.equal(
    scanProgressLabel(scanProgress({
      source_files_seen: 2,
      source_file_count: 3,
      prompts_found: 4,
      limit: null,
    })),
    "Source A: 2 / 3개 파일 · 4개 프롬프트 · 소스 1 / 2",
  );
});

test("scan progress label explains file discovery state", () => {
  assert.equal(
    scanProgressLabel(scanProgress({
      source_file_count: null,
      source_files_discovered: 1,
      prompts_found: 1,
      source_count: 0,
    })),
    "Source A: 파일 찾는 중 · 1개 파일 발견 · 1개 프롬프트 · 소스 대기 중 · 제한 10",
  );
  assert.equal(
    scanProgressLabel(scanProgress({
      source_file_count: null,
      source_files_discovered: 2,
      prompts_found: 2,
      source_count: 0,
    })),
    "Source A: 파일 찾는 중 · 2개 파일 발견 · 2개 프롬프트 · 소스 대기 중 · 제한 10",
  );
});

test("scan progress label redacts secret-like source names", () => {
  const apiFlag = ["--api", "key"].join("-");
  const secretValue = ["scan", "label", "secret"].join("-");
  const label = scanProgressLabel(scanProgress({
    source_label: `Codex ${apiFlag} ${secretValue}`,
  }));

  assert.equal(label, "Codex [REDACTED_POSSIBLE_SECRET]: 1 / 1개 파일 · 1개 프롬프트 · 소스 1 / 2 · 제한 10");
  assert.ok(!label.includes(apiFlag));
  assert.ok(!label.includes(secretValue));
});

test("scan result timestamp text uses guarded date display", () => {
  const generatedAt = "2026-06-06T00:00:00Z";
  const tokenName = ["access", "token"].join("_");
  const secretValue = ["scan", "result", "timestamp", "secret"].join("-");
  const invalidGeneratedAt = `not-a-date?${tokenName}=${secretValue}`;

  assert.equal(scanResultTimestampText(generatedAt), new Date(generatedAt).toLocaleString());
  assert.notEqual(scanResultTimestampText(generatedAt), generatedAt);
  assert.equal(scanResultTimestampText(null), "아직 스캔 안 함");
  assert.equal(scanResultTimestampText(undefined), "아직 스캔 안 함");

  const displayText = scanResultTimestampText(invalidGeneratedAt);

  assert.match(displayText, /\[REDACTED_POSSIBLE_SECRET\]/);
  assert.doesNotMatch(displayText, new RegExp(`${tokenName}|${secretValue}`));
});

test("scan failure text is hidden outside failed scans", () => {
  assert.equal(scanRunFailureText("idle", false), null);
  assert.equal(scanRunFailureText("scanning", false), null);
  assert.equal(scanRunFailureText("canceling", true), null);
  assert.equal(scanRunFailureText("ready", true), null);
});

test("scan failure text explains a failed first scan", () => {
  assert.equal(
    scanRunFailureText("failed", false),
    "프롬프트를 스캔하지 못했습니다. 위 오류를 확인하고 제한값을 조정하거나 다시 시도하세요.",
  );
});

test("scan failure text preserves stale results context", () => {
  assert.equal(
    scanRunFailureText("failed", true),
    "스캔 결과를 새로고침하지 못했습니다. 기존 결과를 계속 표시합니다. 위 오류를 확인하고 제한값을 조정하거나 다시 시도하세요.",
  );
});

test("scan stop failure text explains failed stop requests", () => {
  assert.equal(
    scanStopFailureText("request_failed"),
    "실행 중인 스캔을 중지하지 못했습니다. 아직 실행 중이므로 위 오류를 확인하거나 중지를 다시 시도하세요.",
  );
  assert.equal(
    scanStopFailureText("not_active"),
    "중지할 실행 중 스캔을 찾지 못했습니다. 스캔이 이미 끝났을 수 있습니다.",
  );
  assert.equal(scanStopFailureText(null), null);
});

test("scan limit changes clear matching scan errors", () => {
  assert.deepEqual(scanLimitChangedAfterFailure("failed", "invalid limit", "invalid limit", true), {
    error: null,
    failureErrorText: null,
    state: "ready",
  });
});

test("scan limit changes preserve unrelated global errors", () => {
  assert.deepEqual(scanLimitChangedAfterFailure("failed", "stored failed", "scan failed", true), {
    error: "stored failed",
    failureErrorText: null,
    state: "ready",
  });
});

test("scan limit changes return to idle without prior results", () => {
  assert.deepEqual(scanLimitChangedAfterFailure("failed", null, "scan failed", false), {
    error: null,
    failureErrorText: null,
    state: "idle",
  });
  assert.deepEqual(scanLimitChangedAfterFailure("ready", "scan failed", "scan failed", true), {
    error: "scan failed",
    failureErrorText: "scan failed",
    state: "ready",
  });
});

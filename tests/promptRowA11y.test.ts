import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import { promptRowAriaLabel, selectedPromptMetaLabel } from "../src/promptRowA11y.ts";
import type { PromptRecord } from "../src/types.ts";

function promptRecord(overrides: Partial<PromptRecord> = {}): PromptRecord {
  return {
    id: "prompt-1",
    source: "Codex",
    session_id: "session-1",
    path: "/tmp/session.jsonl",
    timestamp: "2026-06-06T12:00:00Z",
    cwd: "/Users/wj",
    text: "Return exactly OK",
    word_count: 3,
    char_count: 17,
    hash: "abc123",
    risk_flags: [],
    quality: {
      score: 36,
      band: "weak",
      missing: [],
      suggestions: [],
    },
    ...overrides,
  };
}

function lockState(overrides: Partial<ActionLockState> = {}): ActionLockState {
  return {
    importRunning: false,
    improvementRunning: false,
    planRunning: false,
    scanRunning: false,
    storedLoadRunning: false,
    ...overrides,
  };
}

test("prompt row labels distinguish duplicate prompt text by list position", () => {
  const first = promptRowAriaLabel(promptRecord(), 0, 2);
  const second = promptRowAriaLabel(promptRecord({ id: "prompt-2" }), 1, 2);

  assert.notEqual(first, second);
  assert.match(first, /^프롬프트 1 \/ 2:/);
  assert.match(second, /^프롬프트 2 \/ 2:/);
  assert.match(first, /Return exactly OK$/);
});

test("prompt row labels compact whitespace and include quality metadata", () => {
  assert.equal(
    promptRowAriaLabel(promptRecord({ text: "  Improve\n\nthis\tprompt  ", word_count: 3 }), 0, 1),
    "프롬프트 1 / 1: Codex, 2026-06-06T12:00:00Z, 3개 단어, 품질 36 weak, Improve this prompt",
  );
});

test("prompt row labels avoid unbounded prompt text", () => {
  const label = promptRowAriaLabel(promptRecord({ text: "x ".repeat(200), word_count: 200 }), 0, 1);

  assert.ok(label.endsWith("..."));
  assert.ok(label.length < 230);
});

test("prompt row labels handle missing timestamps and empty prompts", () => {
  assert.equal(
    promptRowAriaLabel(promptRecord({ timestamp: null, text: "   ", word_count: 0 }), 0, 1),
    "프롬프트 1 / 1: Codex, 시간 없음, 0개 단어, 품질 36 weak, 빈 프롬프트",
  );
});

test("prompt row labels explain active-work selection locks", () => {
  assert.equal(
    promptRowAriaLabel(promptRecord(), 0, 1, lockState({ improvementRunning: true })),
    "프롬프트 1 / 1: Codex, 2026-06-06T12:00:00Z, 3개 단어, 품질 36 weak, Return exactly OK. 프롬프트 추천 생성 중에는 다른 프롬프트를 선택할 수 없습니다",
  );
});

test("selected prompt metadata label separates visual chips", () => {
  assert.equal(
    selectedPromptMetaLabel(promptRecord()),
    "선택한 프롬프트 메타데이터: Codex, 2026-06-06T12:00:00Z, /Users/wj, 품질 36 weak",
  );
});

test("selected prompt metadata label handles missing values", () => {
  assert.equal(
    selectedPromptMetaLabel(promptRecord({ cwd: null, timestamp: null })),
    "선택한 프롬프트 메타데이터: Codex, 시간 없음, 작업공간 없음, 품질 36 weak",
  );
});

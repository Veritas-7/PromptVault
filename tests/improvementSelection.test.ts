import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import type { PromptRecord } from "../src/types.ts";
import {
  activeImprovementForSelection,
  buildImprovePromptRequest,
  improvementActionLabel,
  improvementFailureText,
  improvementRequestStarted,
  improvementSelectionChanged,
  shouldClearImprovementOnPromptSelect,
} from "../src/improvementSelection.ts";

const improvement = { revised_prompt: "better" };

function promptRecord(overrides: Partial<PromptRecord> = {}): PromptRecord {
  return {
    id: "prompt-a",
    source: "Codex",
    session_id: "session-a",
    path: "/tmp/prompt.md",
    timestamp: "2026-06-08T04:00:00Z",
    cwd: "/tmp/project",
    text: "Improve this prompt",
    word_count: 3,
    char_count: 19,
    hash: "hash-a",
    risk_flags: [],
    quality: {
      score: 74,
      band: "good",
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

test("active improvement is hidden when selection changed", () => {
  assert.equal(activeImprovementForSelection(improvement, "prompt-a", "prompt-b"), null);
});

test("active improvement is shown for its selected prompt", () => {
  assert.equal(activeImprovementForSelection(improvement, "prompt-a", "prompt-a"), improvement);
});

test("active improvement is empty without a selected prompt", () => {
  assert.equal(activeImprovementForSelection(improvement, "prompt-a", null), null);
});

test("starting an improvement clears the prior recommendation", () => {
  const state = improvementRequestStarted("prompt-a");

  assert.deepEqual(state, {
    improvement: null,
    improvementPromptId: "prompt-a",
  });
});

test("same selected prompt keeps its recommendation state", () => {
  assert.equal(shouldClearImprovementOnPromptSelect("prompt-a", "prompt-a"), false);
});

test("different or empty selection clears recommendation state", () => {
  assert.equal(shouldClearImprovementOnPromptSelect("prompt-b", "prompt-a"), true);
  assert.equal(shouldClearImprovementOnPromptSelect("prompt-a", null), true);
});

test("improvement failure text is scoped to the selected prompt", () => {
  assert.equal(
    improvementFailureText("prompt-a", "prompt-a"),
    "이 프롬프트 추천을 생성하지 못했습니다. 위 오류를 확인한 뒤 다시 시도하세요.",
  );
  assert.equal(improvementFailureText("prompt-a", "prompt-b"), null);
  assert.equal(improvementFailureText(null, "prompt-a"), null);
});

test("improvement action label explains disabled and active states", () => {
  assert.equal(improvementActionLabel(false, false, lockState()), "추천을 생성하기 전에 프롬프트를 선택하세요");
  assert.equal(
    improvementActionLabel(true, true, lockState({ improvementRunning: true })),
    "선택한 프롬프트 추천 생성 중",
  );
  assert.equal(
    improvementActionLabel(true, false, lockState({ scanRunning: true })),
    "스캔 실행 중에는 선택한 프롬프트 추천을 생성할 수 없습니다",
  );
  assert.equal(
    improvementActionLabel(true, false, lockState({ storedLoadRunning: true })),
    "저장된 프롬프트 불러오는 중에는 선택한 프롬프트 추천을 생성할 수 없습니다",
  );
  assert.equal(improvementActionLabel(true, false, lockState()), "선택한 프롬프트 추천 생성");
});

test("local improvement request includes force local only when enabled", () => {
  assert.deepEqual(buildImprovePromptRequest(promptRecord(), "/tmp/promptvault.sqlite", true), {
    prompt: "Improve this prompt",
    context: "Codex · /tmp/project",
    prompt_id: "prompt-a",
    source: "Codex",
    persist: true,
    database_path: "/tmp/promptvault.sqlite",
    force_local: true,
  });

  assert.deepEqual(buildImprovePromptRequest(promptRecord({ cwd: null }), null, false), {
    prompt: "Improve this prompt",
    context: "Codex · 작업공간 없음",
    prompt_id: "prompt-a",
    source: "Codex",
    persist: true,
  });
});

test("improvement request redacts secret-like source context metadata", () => {
  const sourceFlag = ["--api", "key"].join("-");
  const sourceSecret = ["improve", "source", "secret"].join("-");
  const cwdFlag = ["--cookie"].join("");
  const cwdSecret = ["improve", "cwd", "secret"].join("-");

  const request = buildImprovePromptRequest(
    promptRecord({
      source: `Codex ${sourceFlag} ${sourceSecret}`,
      cwd: `/tmp/project ${cwdFlag} session=${cwdSecret}`,
    }),
    "/tmp/promptvault.sqlite",
    false,
  );

  assert.equal(
    request.context,
    "Codex [REDACTED_POSSIBLE_SECRET] · /tmp/project [REDACTED_POSSIBLE_SECRET]",
  );
  assert.doesNotMatch(request.context ?? "", new RegExp(`${sourceFlag}|${sourceSecret}|${cwdSecret}`));
  assert.equal(request.prompt, "Improve this prompt");
  assert.equal(request.source, `Codex ${sourceFlag} ${sourceSecret}`);
});

test("selection change clears recommendation state and matching improve error", () => {
  assert.deepEqual(improvementSelectionChanged("improve failed", "improve failed"), {
    error: null,
    improvement: null,
    improvementFailureErrorText: null,
    improvementFailurePromptId: null,
    improvementPromptId: null,
  });
});

test("selection change preserves unrelated global errors", () => {
  assert.deepEqual(improvementSelectionChanged("facet refresh failed", "improve failed"), {
    error: "facet refresh failed",
    improvement: null,
    improvementFailureErrorText: null,
    improvementFailurePromptId: null,
    improvementPromptId: null,
  });
});

test("selection change preserves errors without a tracked improve failure", () => {
  assert.deepEqual(improvementSelectionChanged("network failed", null), {
    error: "network failed",
    improvement: null,
    improvementFailureErrorText: null,
    improvementFailurePromptId: null,
    improvementPromptId: null,
  });
});

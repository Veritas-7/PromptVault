import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  activeImprovementForSelection,
  improvementActionLabel,
  improvementFailureText,
  improvementRequestStarted,
  improvementSelectionChanged,
} from "../src/improvementSelection.ts";

const improvement = { revised_prompt: "better" };

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

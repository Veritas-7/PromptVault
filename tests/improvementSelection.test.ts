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
    "Could not improve this prompt. Check the error above and retry.",
  );
  assert.equal(improvementFailureText("prompt-a", "prompt-b"), null);
  assert.equal(improvementFailureText(null, "prompt-a"), null);
});

test("improvement action label explains disabled and active states", () => {
  assert.equal(improvementActionLabel(false, false, lockState()), "Select a prompt before improving");
  assert.equal(
    improvementActionLabel(true, true, lockState({ improvementRunning: true })),
    "Improving selected prompt",
  );
  assert.equal(
    improvementActionLabel(true, false, lockState({ scanRunning: true })),
    "Cannot improve selected prompt while a scan is running",
  );
  assert.equal(
    improvementActionLabel(true, false, lockState({ storedLoadRunning: true })),
    "Cannot improve selected prompt while stored prompts are loading",
  );
  assert.equal(improvementActionLabel(true, false, lockState()), "Improve selected prompt");
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

import assert from "node:assert/strict";
import test from "node:test";
import {
  activeImprovementForSelection,
  improvementFailureText,
  improvementRequestStarted,
  improvementSelectionChanged,
} from "../src/improvementSelection.ts";

const improvement = { revised_prompt: "better" };

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

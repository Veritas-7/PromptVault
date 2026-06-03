import assert from "node:assert/strict";
import test from "node:test";
import {
  activeImprovementForSelection,
  improvementRequestStarted,
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

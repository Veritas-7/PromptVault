import assert from "node:assert/strict";
import test from "node:test";
import { activeImprovementForSelection } from "../src/improvementSelection.ts";

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

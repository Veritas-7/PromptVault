import assert from "node:assert/strict";
import test from "node:test";
import { selectedPromptForView } from "../src/selection.ts";

const visible = { id: "visible" };
const hidden = { id: "hidden" };

test("selected prompt stays inside the current filtered view", () => {
  assert.equal(selectedPromptForView([visible], hidden.id), visible);
});

test("selected prompt is preserved when it remains visible", () => {
  assert.equal(selectedPromptForView([hidden, visible], hidden.id), hidden);
});

test("selection is empty when no prompts are visible", () => {
  assert.equal(selectedPromptForView([], hidden.id), null);
});

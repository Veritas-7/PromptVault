import assert from "node:assert/strict";
import test from "node:test";
import { promptListEmptyText, selectedPromptEmptyText } from "../src/promptEmptyState.ts";

test("prompt list stays blank before data is loaded", () => {
  assert.equal(promptListEmptyText(false, ""), null);
});

test("prompt list explains empty loaded data", () => {
  assert.equal(promptListEmptyText(true, " "), "No prompts were loaded.");
});

test("prompt list explains filter misses", () => {
  assert.equal(promptListEmptyText(true, "missing"), "No prompts match the current filter.");
});

test("selected prompt empty state preserves load guidance before data exists", () => {
  assert.equal(selectedPromptEmptyText(false, "missing"), "Run a scan or load stored prompts.");
});

test("selected prompt empty state explains filtered-out selections", () => {
  assert.equal(
    selectedPromptEmptyText(true, "missing"),
    "No prompt is visible with the current filter.",
  );
});

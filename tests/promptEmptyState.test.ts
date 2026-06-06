import assert from "node:assert/strict";
import test from "node:test";
import {
  promptListEmptyText,
  recommendationEmptyText,
  selectedPromptEmptyText,
} from "../src/promptEmptyState.ts";

test("prompt list stays blank before data is loaded", () => {
  assert.equal(promptListEmptyText(false, ""), null);
});

test("prompt list explains empty loaded data", () => {
  assert.equal(promptListEmptyText(true, " "), "No prompts were loaded.");
});

test("prompt list explains filter misses", () => {
  assert.equal(promptListEmptyText(true, "missing"), "No prompts match the current filter.");
});

test("prompt list explains stored filter misses", () => {
  assert.equal(
    promptListEmptyText(true, "", 2),
    "No stored prompts match the current Stored Vault filters.",
  );
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

test("selected prompt empty state explains stored filter misses", () => {
  assert.equal(
    selectedPromptEmptyText(true, "", 1),
    "No prompt matches the current Stored Vault filters.",
  );
});

test("recommendation empty state prompts improvement for a selected prompt", () => {
  assert.equal(
    recommendationEmptyText(true, true, ""),
    "Run improvement for the selected prompt.",
  );
});

test("recommendation empty state explains filter-hidden selections", () => {
  assert.equal(
    recommendationEmptyText(false, true, "missing"),
    "Clear the prompt filter or select a visible prompt before improving.",
  );
});

test("recommendation empty state explains stored filter misses", () => {
  assert.equal(
    recommendationEmptyText(false, true, "", 1),
    "Adjust or reset Stored Vault filters before improving.",
  );
});

test("recommendation empty state keeps selection guidance before data exists", () => {
  assert.equal(recommendationEmptyText(false, false, ""), "Select a prompt and run improvement.");
});

import assert from "node:assert/strict";
import test from "node:test";
import { frequencyEmptyText, sourceSummariesEmptyText } from "../src/analysisEmptyState.ts";

test("source summaries empty state explains the pre-load state", () => {
  assert.equal(
    sourceSummariesEmptyText(false),
    "Run a scan or load stored prompts to see source coverage.",
  );
});

test("source summaries empty state explains loaded results without summaries", () => {
  assert.equal(sourceSummariesEmptyText(true), "No source summaries are available for this result.");
});

test("frequency empty state explains the pre-load state", () => {
  assert.equal(
    frequencyEmptyText(false, "Words"),
    "Run a scan or load stored prompts to see frequency data.",
  );
});

test("frequency empty state names the empty loaded column", () => {
  assert.equal(frequencyEmptyText(true, "Quality gaps"), "No quality gaps data in this result.");
});

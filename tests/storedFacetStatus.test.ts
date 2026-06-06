import assert from "node:assert/strict";
import test from "node:test";
import {
  storedFacetSummaryText,
  storedFacetsFailureText,
  type StoredFacetsState,
} from "../src/storedFacetStatus.ts";

const readyResult = {
  dates: [{ text: "2026-06-06", count: 3 }],
  sources: [{ text: "Codex", count: 200 }],
  total_prompts: 362,
  workspaces: [{ text: "PromptVault", count: 12 }],
};

test("stored facet failure text is only shown after failed refreshes", () => {
  const failed: StoredFacetsState = "failed";
  assert.equal(
    storedFacetsFailureText(failed),
    "Could not refresh stored facets. Filter suggestions may be stale.",
  );
  assert.equal(storedFacetsFailureText("ready"), null);
});

test("stored facet summary uses live facet result when available", () => {
  assert.equal(
    storedFacetSummaryText("ready", 0, readyResult),
    "362 stored, 1 source, 1 date, 1 workspace",
  );
  assert.equal(
    storedFacetSummaryText("ready", 0, {
      dates: [],
      sources: [{ text: "Codex", count: 200 }, { text: "Claude", count: 20 }],
      total_prompts: 220,
      workspaces: [{ text: "PromptVault", count: 12 }, { text: "Other", count: 2 }],
    }),
    "220 stored, 2 sources, 0 dates, 2 workspaces",
  );
});

test("stored facet summary distinguishes loading and failed states without data", () => {
  assert.equal(storedFacetSummaryText("loading", 0, null), "loading stored facets");
  assert.equal(storedFacetSummaryText("failed", 0, null), "stored facets unavailable");
  assert.equal(
    storedFacetSummaryText("failed", 2, null),
    "facet refresh failed, 2 filters active",
  );
});

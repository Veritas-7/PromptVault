import assert from "node:assert/strict";
import test from "node:test";
import {
  activeStoredPromptFilterCount,
  emptyStoredPromptFilters,
  storedPromptLoadOptions,
  type StoredPromptFilters,
} from "../src/storedFilters.ts";

const emptyFilters: StoredPromptFilters = {
  date: "",
  query: "",
  source: "",
  workspace: "",
};

test("stored prompt options trim and omit empty filters", () => {
  assert.deepEqual(storedPromptLoadOptions(emptyFilters, "latest", 1000), {
    date: undefined,
    limit: 1000,
    preview_sort: "latest",
    query: undefined,
    source: undefined,
    workspace: undefined,
  });
});

test("empty stored prompt filters use the full unfiltered shape", () => {
  assert.deepEqual(emptyStoredPromptFilters(), emptyFilters);
});

test("stored prompt options preserve exact source and date filters", () => {
  const options = storedPromptLoadOptions(
    {
      date: "2026-06-06",
      query: " cmux ",
      source: "Codex",
      workspace: " PromptVault ",
    },
    "weakest",
    25,
  );

  assert.deepEqual(options, {
    date: "2026-06-06",
    limit: 25,
    preview_sort: "quality_asc",
    query: "cmux",
    source: "Codex",
    workspace: "PromptVault",
  });
});

test("active stored prompt filter count ignores whitespace", () => {
  assert.equal(activeStoredPromptFilterCount(emptyFilters), 0);
  assert.equal(
    activeStoredPromptFilterCount({
      date: "2026-06-06",
      query: " ",
      source: "Codex",
      workspace: "PromptVault",
    }),
    3,
  );
});

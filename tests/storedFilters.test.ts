import assert from "node:assert/strict";
import test from "node:test";
import {
  activeStoredPromptFilterCount,
  emptyStoredPromptFilters,
  storedFilterResetLabel,
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

test("stored filter reset label explains disabled and active states", () => {
  assert.equal(storedFilterResetLabel(0, false), "No stored filters to reset");
  assert.equal(
    storedFilterResetLabel(2, true),
    "Cannot reset stored filters while another action is running",
  );
  assert.equal(storedFilterResetLabel(1, false), "Reset 1 stored filter");
  assert.equal(storedFilterResetLabel(3, false), "Reset 3 stored filters");
});

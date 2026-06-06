import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  activeStoredPromptFilterCount,
  emptyStoredPromptFilters,
  storedFilterApplyLabel,
  storedFilterInputLabel,
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

function lockState(overrides: Partial<ActionLockState> = {}): ActionLockState {
  return {
    importRunning: false,
    improvementRunning: false,
    planRunning: false,
    scanRunning: false,
    storedLoadRunning: false,
    ...overrides,
  };
}

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
  assert.equal(storedFilterResetLabel(0, lockState()), "No stored filters to reset");
  assert.equal(
    storedFilterResetLabel(2, lockState({ importRunning: true })),
    "Cannot reset stored filters while an import is running",
  );
  assert.equal(storedFilterResetLabel(1, lockState()), "Reset 1 stored filter");
  assert.equal(storedFilterResetLabel(3, lockState()), "Reset 3 stored filters");
});

test("stored filter apply label explains unfiltered, active, and locked states", () => {
  assert.equal(storedFilterApplyLabel(0, lockState()), "Load stored prompts without filters");
  assert.equal(storedFilterApplyLabel(1, lockState()), "Apply 1 stored filter");
  assert.equal(storedFilterApplyLabel(3, lockState()), "Apply 3 stored filters");
  assert.equal(
    storedFilterApplyLabel(2, lockState({ scanRunning: true })),
    "Cannot apply stored filters while a scan is running",
  );
});

test("stored filter input labels explain field and locked state", () => {
  assert.equal(storedFilterInputLabel("text", lockState()), "Stored Vault text filter");
  assert.equal(storedFilterInputLabel("source", lockState()), "Stored Vault source filter");
  assert.equal(storedFilterInputLabel("date", lockState()), "Stored Vault date filter");
  assert.equal(storedFilterInputLabel("workspace", lockState()), "Stored Vault workspace filter");
  assert.equal(
    storedFilterInputLabel("text", lockState({ storedLoadRunning: true })),
    "Cannot edit Stored Vault text filter while stored prompts are loading",
  );
  assert.equal(
    storedFilterInputLabel("workspace", lockState({ improvementRunning: true })),
    "Cannot edit Stored Vault workspace filter while an improvement is running",
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { panelRefreshActionLabel, refreshGlobalErrorAfterSuccess } from "../src/panelRefresh.ts";

const lockState = (overrides = {}) => ({
  importRunning: false,
  improvementRunning: false,
  planRunning: false,
  scanRunning: false,
  storedLoadRunning: false,
  ...overrides,
});

test("manual panel refresh success clears stale global errors", () => {
  assert.equal(refreshGlobalErrorAfterSuccess(false, "previous failure"), null);
});

test("quiet panel refresh success preserves existing global errors", () => {
  assert.equal(
    refreshGlobalErrorAfterSuccess(true, "import failed"),
    "import failed",
  );
});

test("panel refresh labels explain ready, loading, and locked states", () => {
  assert.equal(
    panelRefreshActionLabel("saved import progress", "ready", lockState()),
    "Refresh saved import progress",
  );
  assert.equal(
    panelRefreshActionLabel("saved import progress", "loading", lockState()),
    "Refreshing saved import progress",
  );
  assert.equal(
    panelRefreshActionLabel("recent import activity", "failed", lockState({ scanRunning: true })),
    "Cannot refresh recent import activity while a scan is running",
  );
});

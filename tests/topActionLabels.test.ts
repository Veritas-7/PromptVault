import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  activeActionLockReason,
  planActionLabel,
  previewModeActionLabel,
  scanActionLabel,
  scanLimitInputLabel,
  scanStopActionLabel,
  storedLoadActionLabel,
} from "../src/topActionLabels.ts";

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

test("active action lock reason names the blocking operation", () => {
  assert.equal(activeActionLockReason(lockState()), null);
  assert.equal(activeActionLockReason(lockState({ scanRunning: true })), "a scan is running");
  assert.equal(activeActionLockReason(lockState({ planRunning: true })), "an import plan is running");
  assert.equal(activeActionLockReason(lockState({ importRunning: true })), "an import is running");
  assert.equal(
    activeActionLockReason(lockState({ storedLoadRunning: true })),
    "stored prompts are loading",
  );
  assert.equal(
    activeActionLockReason(lockState({ improvementRunning: true })),
    "an improvement is running",
  );
});

test("scan action label explains running and locked states", () => {
  assert.equal(scanActionLabel("idle", lockState()), "Scan prompts");
  assert.equal(scanActionLabel("scanning", lockState({ scanRunning: true })), "Scanning prompts");
  assert.equal(scanActionLabel("canceling", lockState({ scanRunning: true })), "Stopping active scan");
  assert.equal(
    scanActionLabel("idle", lockState({ importRunning: true })),
    "Cannot scan prompts while an import is running",
  );
});

test("scan stop action label explains the canceling state", () => {
  assert.equal(scanStopActionLabel("scanning"), "Stop active scan");
  assert.equal(scanStopActionLabel("canceling"), "Stopping active scan");
});

test("stored load action label explains loading and locked states", () => {
  assert.equal(storedLoadActionLabel("idle", lockState()), "Load stored prompts");
  assert.equal(storedLoadActionLabel("loading", lockState({ storedLoadRunning: true })), "Loading stored prompts");
  assert.equal(
    storedLoadActionLabel("idle", lockState({ improvementRunning: true })),
    "Cannot load stored prompts while an improvement is running",
  );
});

test("plan action label explains planning, failed, and locked states", () => {
  assert.equal(planActionLabel("idle", lockState()), "Plan import sources");
  assert.equal(planActionLabel("ready", lockState()), "Plan import sources");
  assert.equal(planActionLabel("failed", lockState()), "Retry import source plan");
  assert.equal(planActionLabel("planning", lockState({ planRunning: true })), "Planning import sources");
  assert.equal(
    planActionLabel("ready", lockState({ storedLoadRunning: true })),
    "Cannot plan import sources while stored prompts are loading",
  );
});

test("preview mode action label explains selected, switch, and locked states", () => {
  assert.equal(previewModeActionLabel("latest", "latest", lockState()), "Latest prompt preview selected");
  assert.equal(previewModeActionLabel("weakest", "latest", lockState()), "Switch to weakest prompt preview");
  assert.equal(
    previewModeActionLabel("weakest", "latest", lockState({ scanRunning: true })),
    "Cannot switch to weakest prompt preview while a scan is running",
  );
});

test("scan limit input label explains locked states", () => {
  assert.equal(scanLimitInputLabel(lockState()), "Scan prompt limit");
  assert.equal(
    scanLimitInputLabel(lockState({ planRunning: true })),
    "Cannot edit scan prompt limit while an import plan is running",
  );
});

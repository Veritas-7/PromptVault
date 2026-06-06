import assert from "node:assert/strict";
import test from "node:test";
import {
  type ActionLockState,
  claimExclusiveAction,
  importActionLocked,
  releaseExclusiveAction,
  topLevelActionLocked,
} from "../src/actionLocks.ts";

function lockState(overrides: Partial<ActionLockState> = {}): ActionLockState {
  return {
    importRunning: false,
    improvementRunning: false,
    scanRunning: false,
    storedLoadRunning: false,
    ...overrides,
  };
}

test("top-level actions lock for long-running work", () => {
  assert.equal(topLevelActionLocked(lockState()), false);
  assert.equal(topLevelActionLocked(lockState({ importRunning: true })), true);
  assert.equal(topLevelActionLocked(lockState({ improvementRunning: true })), true);
  assert.equal(topLevelActionLocked(lockState({ scanRunning: true })), true);
  assert.equal(topLevelActionLocked(lockState({ storedLoadRunning: true })), true);
});

test("import write actions also lock for long-running work", () => {
  assert.equal(importActionLocked(lockState()), false);
  assert.equal(importActionLocked(lockState({ importRunning: true })), true);
  assert.equal(importActionLocked(lockState({ improvementRunning: true })), true);
  assert.equal(importActionLocked(lockState({ scanRunning: true })), true);
  assert.equal(importActionLocked(lockState({ storedLoadRunning: true })), true);
});

test("exclusive action claims reject overlapping starts until released", () => {
  const claim = { current: false };

  assert.equal(claimExclusiveAction(claim), true);
  assert.equal(claim.current, true);
  assert.equal(claimExclusiveAction(claim), false);

  releaseExclusiveAction(claim);

  assert.equal(claim.current, false);
  assert.equal(claimExclusiveAction(claim), true);
});

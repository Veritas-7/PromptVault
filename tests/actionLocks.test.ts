import assert from "node:assert/strict";
import test from "node:test";
import { importActionLocked, topLevelActionLocked } from "../src/actionLocks.ts";

test("top-level actions lock for scan, import, and stored-load work", () => {
  assert.equal(topLevelActionLocked({ importRunning: false, scanRunning: false, storedLoadRunning: false }), false);
  assert.equal(topLevelActionLocked({ importRunning: true, scanRunning: false, storedLoadRunning: false }), true);
  assert.equal(topLevelActionLocked({ importRunning: false, scanRunning: true, storedLoadRunning: false }), true);
  assert.equal(topLevelActionLocked({ importRunning: false, scanRunning: false, storedLoadRunning: true }), true);
});

test("import write actions also lock while scans are active", () => {
  assert.equal(importActionLocked({ importRunning: false, scanRunning: false, storedLoadRunning: false }), false);
  assert.equal(importActionLocked({ importRunning: true, scanRunning: false, storedLoadRunning: false }), true);
  assert.equal(importActionLocked({ importRunning: false, scanRunning: true, storedLoadRunning: false }), true);
  assert.equal(importActionLocked({ importRunning: false, scanRunning: false, storedLoadRunning: true }), true);
});

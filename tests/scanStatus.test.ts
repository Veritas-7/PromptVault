import assert from "node:assert/strict";
import test from "node:test";
import {
  scanLimitChangedAfterFailure,
  scanRunFailureText,
  scanStopFailureText,
} from "../src/scanStatus.ts";

test("scan failure text is hidden outside failed scans", () => {
  assert.equal(scanRunFailureText("idle", false), null);
  assert.equal(scanRunFailureText("scanning", false), null);
  assert.equal(scanRunFailureText("canceling", true), null);
  assert.equal(scanRunFailureText("ready", true), null);
});

test("scan failure text explains a failed first scan", () => {
  assert.equal(
    scanRunFailureText("failed", false),
    "Could not scan prompts. Check the error above, adjust the limit, or retry.",
  );
});

test("scan failure text preserves stale results context", () => {
  assert.equal(
    scanRunFailureText("failed", true),
    "Could not refresh scan results. Existing results are still shown. Check the error above, adjust the limit, or retry.",
  );
});

test("scan stop failure text explains failed stop requests", () => {
  assert.equal(
    scanStopFailureText("request_failed"),
    "Could not stop the active scan. It is still running; check the error above or try Stop again.",
  );
  assert.equal(
    scanStopFailureText("not_active"),
    "No active scan was found to stop. The scan may have already finished.",
  );
  assert.equal(scanStopFailureText(null), null);
});

test("scan limit changes clear matching scan errors", () => {
  assert.deepEqual(scanLimitChangedAfterFailure("failed", "invalid limit", "invalid limit", true), {
    error: null,
    failureErrorText: null,
    state: "ready",
  });
});

test("scan limit changes preserve unrelated global errors", () => {
  assert.deepEqual(scanLimitChangedAfterFailure("failed", "stored failed", "scan failed", true), {
    error: "stored failed",
    failureErrorText: null,
    state: "ready",
  });
});

test("scan limit changes return to idle without prior results", () => {
  assert.deepEqual(scanLimitChangedAfterFailure("failed", null, "scan failed", false), {
    error: null,
    failureErrorText: null,
    state: "idle",
  });
  assert.deepEqual(scanLimitChangedAfterFailure("ready", "scan failed", "scan failed", true), {
    error: "scan failed",
    failureErrorText: "scan failed",
    state: "ready",
  });
});

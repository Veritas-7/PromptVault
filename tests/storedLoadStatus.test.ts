import assert from "node:assert/strict";
import test from "node:test";
import {
  storedFilterChangedAfterFailure,
  storedLoadFailureText,
  type StoredLoadState,
} from "../src/storedLoadStatus.ts";

test("stored load failure text is only shown for failed loads", () => {
  const failed: StoredLoadState = "failed";

  assert.equal(
    storedLoadFailureText(failed, 0),
    "Could not load stored prompts. Check the error above and retry.",
  );
  assert.equal(storedLoadFailureText("ready", 0), null);
});

test("stored load failure text accounts for active filters", () => {
  assert.equal(
    storedLoadFailureText("failed", 2),
    "Could not load stored prompts with the current filters. Check the error above, adjust filters, or retry.",
  );
});

test("stored filter changes clear matching stored load errors", () => {
  assert.deepEqual(
    storedFilterChangedAfterFailure("failed", "bridge failed", "bridge failed", true),
    {
      error: null,
      failureErrorText: null,
      state: "ready",
    },
  );
});

test("stored filter changes preserve unrelated global errors", () => {
  assert.deepEqual(
    storedFilterChangedAfterFailure("failed", "scan failed", "stored failed", true),
    {
      error: "scan failed",
      failureErrorText: null,
      state: "ready",
    },
  );
});

test("stored filter changes return to idle without prior results", () => {
  assert.deepEqual(storedFilterChangedAfterFailure("failed", null, "stored failed", false), {
    error: null,
    failureErrorText: null,
    state: "idle",
  });
  assert.deepEqual(storedFilterChangedAfterFailure("ready", "stored failed", "stored failed", true), {
    error: "stored failed",
    failureErrorText: "stored failed",
    state: "ready",
  });
});

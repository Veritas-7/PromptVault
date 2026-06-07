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
    "저장된 프롬프트를 불러오지 못했습니다. 위 오류를 확인한 뒤 다시 시도하세요.",
  );
  assert.equal(storedLoadFailureText("ready", 0), null);
});

test("stored load failure text accounts for active filters", () => {
  assert.equal(
    storedLoadFailureText("failed", 2),
    "현재 필터로 저장된 프롬프트를 불러오지 못했습니다. 위 오류를 확인하고 필터를 조정하거나 다시 시도하세요.",
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

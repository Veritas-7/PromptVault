import assert from "node:assert/strict";
import test from "node:test";
import {
  scanLimitChangedAfterFailure,
  scanProgressLabel,
  scanRunFailureText,
  scanStopFailureText,
} from "../src/scanStatus.ts";
import type { ScanProgress } from "../src/types.ts";

function scanProgress(overrides: Partial<ScanProgress> = {}): ScanProgress {
  return {
    run_id: "scan-1",
    active: true,
    canceled: false,
    source_id: "source-a",
    source_label: "Source A",
    source_index: 1,
    source_count: 2,
    files_seen: 1,
    source_files_seen: 1,
    source_files_discovered: 1,
    source_file_count: 1,
    prompts_found: 1,
    limit: 10,
    updated_at: "2026-06-07T00:00:00Z",
    ...overrides,
  };
}

test("scan progress label handles missing progress", () => {
  assert.equal(scanProgressLabel(null), "Preparing scan progress.");
});

test("scan progress label pluralizes file and prompt counts", () => {
  assert.equal(
    scanProgressLabel(scanProgress()),
    "Source A: 1 / 1 file · 1 prompt · source 1 / 2 · limit 10",
  );
  assert.equal(
    scanProgressLabel(scanProgress({
      source_files_seen: 2,
      source_file_count: 3,
      prompts_found: 4,
      limit: null,
    })),
    "Source A: 2 / 3 files · 4 prompts · source 1 / 2",
  );
});

test("scan progress label explains file discovery state", () => {
  assert.equal(
    scanProgressLabel(scanProgress({
      source_file_count: null,
      source_files_discovered: 1,
      prompts_found: 1,
      source_count: 0,
    })),
    "Source A: discovering files · 1 found · 1 prompt · source pending · limit 10",
  );
});

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

import assert from "node:assert/strict";
import test from "node:test";
import { scanRunFailureText } from "../src/scanStatus.ts";

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

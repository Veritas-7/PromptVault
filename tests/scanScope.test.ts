import assert from "node:assert/strict";
import test from "node:test";
import { QUICK_SCAN_SOURCE_IDS, quickScanSourceIds } from "../src/scanScope.ts";

test("quick scan uses responsive prompt sources before the large Codex tree", () => {
  assert.deepEqual(quickScanSourceIds(), [
    "codex-cx",
    "claude-code-history",
    "antigravity-cli-history",
    "gemini-tmp-chat",
  ]);
  assert.equal(QUICK_SCAN_SOURCE_IDS.includes("codex"), false);
});

test("quick scan source ids return a defensive copy", () => {
  const ids = quickScanSourceIds();
  ids.push("codex");

  assert.deepEqual(quickScanSourceIds(), [
    "codex-cx",
    "claude-code-history",
    "antigravity-cli-history",
    "gemini-tmp-chat",
  ]);
});

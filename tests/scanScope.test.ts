import assert from "node:assert/strict";
import test from "node:test";
import {
  QUICK_SCAN_SOURCE_IDS,
  QUICK_SCAN_SOURCE_LIMIT,
  quickScanSourceIds,
} from "../src/scanScope.ts";

const expectedQuickSourceIds = [
  "antigravity-cli-conversation-db",
  "antigravity-ide-conversation-db",
  "gemini-tmp-chat",
  "antigravity-cli-history",
  "claude-code-history",
  "codex-cx",
];

test("quick scan uses responsive prompt sources before the large Codex tree", () => {
  assert.deepEqual(quickScanSourceIds(), [
    ...expectedQuickSourceIds,
  ]);
  assert.equal(QUICK_SCAN_SOURCE_IDS.includes("codex"), false);
});

test("quick scan source ids return a defensive copy", () => {
  const ids = quickScanSourceIds();
  ids.push("codex");

  assert.deepEqual(quickScanSourceIds(), [
    ...expectedQuickSourceIds,
  ]);
});

test("quick scan caps each source to keep the preview representative", () => {
  assert.equal(QUICK_SCAN_SOURCE_LIMIT, 5);
});

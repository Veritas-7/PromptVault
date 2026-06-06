import assert from "node:assert/strict";
import test from "node:test";
import { refreshGlobalErrorAfterSuccess } from "../src/panelRefresh.ts";

test("manual panel refresh success clears stale global errors", () => {
  assert.equal(refreshGlobalErrorAfterSuccess(false, "previous failure"), null);
});

test("quiet panel refresh success preserves existing global errors", () => {
  assert.equal(
    refreshGlobalErrorAfterSuccess(true, "import failed"),
    "import failed",
  );
});

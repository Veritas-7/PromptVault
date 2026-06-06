import assert from "node:assert/strict";
import test from "node:test";
import {
  importRefreshFailureText,
  importRefreshUnavailableText,
  type ImportRefreshState,
} from "../src/importRefreshState.ts";

test("import refresh failure text is only shown for failed refreshes", () => {
  assert.equal(
    importRefreshFailureText("failed", "saved import progress"),
    "Could not refresh saved import progress. Existing data may be stale.",
  );
  assert.equal(importRefreshFailureText("ready", "saved import progress"), null);
});

test("import refresh unavailable text differentiates loading and failed states", () => {
  const loading: ImportRefreshState = "loading";
  const failed: ImportRefreshState = "failed";

  assert.equal(importRefreshUnavailableText(loading, "import activity"), "Loading import activity.");
  assert.equal(
    importRefreshUnavailableText(failed, "import activity"),
    "import activity is unavailable. Use Refresh to try again.",
  );
});

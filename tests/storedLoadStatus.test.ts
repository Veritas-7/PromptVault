import assert from "node:assert/strict";
import test from "node:test";
import {
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

import assert from "node:assert/strict";
import test from "node:test";
import { textListItemKey } from "../src/textListKey.ts";

test("text list item keys distinguish duplicate strings by position", () => {
  const first = textListItemKey("Repeated guidance.", 0);
  const second = textListItemKey("Repeated guidance.", 1);

  assert.equal(first, textListItemKey("Repeated guidance.", 0));
  assert.notEqual(first, second);
});

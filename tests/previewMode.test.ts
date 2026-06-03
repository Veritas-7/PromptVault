import assert from "node:assert/strict";
import test from "node:test";
import { effectivePromptListMode, previewSortForMode } from "../src/previewMode.ts";

test("loaded prompt mode follows the backend preview sort", () => {
  assert.equal(effectivePromptListMode("latest", "weakest"), "latest");
  assert.equal(effectivePromptListMode("quality_asc", "latest"), "weakest");
});

test("prompt mode falls back to the pending control before a result exists", () => {
  assert.equal(effectivePromptListMode(null, "weakest"), "weakest");
});

test("scan request sort follows the pending control", () => {
  assert.equal(previewSortForMode("latest"), "latest");
  assert.equal(previewSortForMode("weakest"), "quality_asc");
});

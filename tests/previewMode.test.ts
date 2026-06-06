import assert from "node:assert/strict";
import test from "node:test";
import {
  effectivePromptListMode,
  pendingPreviewModeNotice,
  previewSortForMode,
  shouldReloadStoredPreview,
} from "../src/previewMode.ts";

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

test("stored previews reload when the user changes preview mode", () => {
  assert.equal(shouldReloadStoredPreview("stored", true, "latest", "weakest"), true);
  assert.equal(shouldReloadStoredPreview("stored", true, "latest", "latest"), false);
  assert.equal(shouldReloadStoredPreview("scan", true, "latest", "weakest"), false);
  assert.equal(shouldReloadStoredPreview(null, true, "latest", "weakest"), false);
  assert.equal(shouldReloadStoredPreview("stored", false, "latest", "weakest"), false);
});

test("pending preview notice explains loaded sort mismatches", () => {
  assert.equal(
    pendingPreviewModeNotice("latest", "weakest", true),
    "Weakest preview is selected. Run Scan or Load Stored to refresh the loaded prompt list; it is still showing the latest preview.",
  );
  assert.equal(pendingPreviewModeNotice("quality_asc", "weakest", true), null);
  assert.equal(pendingPreviewModeNotice("latest", "weakest", false), null);
  assert.equal(pendingPreviewModeNotice(null, "weakest", true), null);
});

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
    "개선 우선 미리보기가 선택되었습니다. 불러온 프롬프트 목록을 갱신하려면 스캔 또는 저장소 불러오기를 실행하세요. 현재 목록은 아직 최신순 미리보기입니다.",
  );
  assert.equal(pendingPreviewModeNotice("quality_asc", "weakest", true), null);
  assert.equal(pendingPreviewModeNotice("latest", "weakest", false), null);
  assert.equal(pendingPreviewModeNotice(null, "weakest", true), null);
});

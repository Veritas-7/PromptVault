import assert from "node:assert/strict";
import test from "node:test";
import { qualityBandClass, qualityBandLabel } from "../src/qualityLabels.ts";

test("quality band labels use Korean UI copy for known bands", () => {
  assert.equal(qualityBandLabel("weak"), "약함");
  assert.equal(qualityBandLabel("workable"), "보통");
  assert.equal(qualityBandLabel("medium"), "보통");
  assert.equal(qualityBandLabel("strong"), "강함");
});

test("quality band labels handle legacy and fallback values", () => {
  assert.equal(qualityBandLabel("GOOD"), "좋음");
  assert.equal(qualityBandLabel("excellent"), "우수");
  assert.equal(qualityBandLabel("custom"), "custom");
  assert.equal(qualityBandLabel("  "), "알 수 없음");
});

test("quality band labels redact secret-like unknown values", () => {
  const apiFlag = ["--api", "key"].join("-");
  const secretValue = ["quality", "band", "secret"].join("-");
  const label = qualityBandLabel(`custom ${apiFlag} ${secretValue}`);

  assert.equal(label, "custom [REDACTED_POSSIBLE_SECRET]");
  assert.doesNotMatch(label, new RegExp(`${apiFlag}|${secretValue}`));
});

test("quality band classes normalize known and legacy values", () => {
  assert.equal(qualityBandClass("weak"), "weak");
  assert.equal(qualityBandClass("workable"), "workable");
  assert.equal(qualityBandClass("medium"), "workable");
  assert.equal(qualityBandClass("strong"), "strong");
  assert.equal(qualityBandClass("GOOD"), "good");
  assert.equal(qualityBandClass("excellent"), "excellent");
  assert.equal(qualityBandClass("custom"), "unknown");
  assert.equal(qualityBandClass("  "), "unknown");
});

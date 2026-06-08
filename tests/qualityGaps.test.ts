import assert from "node:assert/strict";
import test from "node:test";
import { qualityGapLabel, qualityGapSummary } from "../src/qualityGaps.ts";

test("quality gap labels localize backend gap identifiers", () => {
  assert.equal(qualityGapLabel("action_verb"), "작업 동사");
  assert.equal(qualityGapLabel("context"), "맥락");
  assert.equal(qualityGapLabel("constraints"), "제약");
  assert.equal(qualityGapLabel("output_format"), "출력 형식");
  assert.equal(qualityGapLabel("sensitive_content_risk"), "민감정보 위험");
  assert.equal(qualityGapLabel("specific_goal"), "구체적 목표");
  assert.equal(qualityGapLabel("too_long"), "과도한 길이");
  assert.equal(qualityGapLabel("verification"), "검증");
});

test("quality gap labels normalize common bridge aliases", () => {
  assert.equal(qualityGapLabel(" success criteria "), "성공 기준");
  assert.equal(qualityGapLabel("success_criteria"), "성공 기준");
  assert.equal(qualityGapLabel("success-criteria"), "성공 기준");
  assert.equal(qualityGapLabel("Output Format"), "출력 형식");
});

test("quality gap labels preserve trimmed unknown values", () => {
  assert.equal(qualityGapLabel(" custom gap "), "custom gap");
  assert.equal(qualityGapLabel(""), "알 수 없음");
  assert.equal(qualityGapLabel("   "), "알 수 없음");
});

test("quality gap labels redact secret-like unknown values", () => {
  const flagName = ["api", "key"].join("-");
  const syntheticValue = ["quality", "gap", "token", "value"].join("-");

  const label = qualityGapLabel(`custom --${flagName} ${syntheticValue}`);

  assert.equal(label, "custom [REDACTED_POSSIBLE_SECRET]");
  assert.doesNotMatch(label, new RegExp(flagName));
  assert.doesNotMatch(label, new RegExp(syntheticValue));
});

test("quality gap summaries cap visible gaps", () => {
  assert.equal(
    qualityGapSummary([
      "specific_goal",
      "context",
      "constraints",
      "verification",
      "output_format",
    ]),
    "구체적 목표, 맥락, 제약, 검증 외 1개",
  );
});

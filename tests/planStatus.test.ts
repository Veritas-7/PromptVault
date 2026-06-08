import assert from "node:assert/strict";
import test from "node:test";
import {
  planPanelTimestampText,
  planFailureText,
  planUnavailableText,
  type PlanRunState,
} from "../src/planStatus.ts";

test("plan failure text distinguishes missing and stale plans", () => {
  const failed: PlanRunState = "failed";

  assert.equal(
    planFailureText(failed, false),
    "가져오기 계획을 만들지 못했습니다. 위 오류를 확인한 뒤 계획을 다시 실행하세요.",
  );
  assert.equal(
    planFailureText(failed, true),
    "가져오기 계획을 새로고침하지 못했습니다. 기존 계획 데이터가 오래되었을 수 있습니다.",
  );
  assert.equal(planFailureText("ready", true), null);
});

test("plan unavailable text explains loading and failed states", () => {
  assert.equal(planUnavailableText("planning"), "소스 목록을 만드는 중입니다.");
  assert.equal(planUnavailableText("failed"), "가져오기 계획을 사용할 수 없습니다. 계획을 다시 실행하세요.");
  assert.equal(planUnavailableText("idle"), "사용 가능한 프롬프트 소스를 보려면 계획을 실행하세요.");
});

test("plan panel timestamp text uses guarded date display", () => {
  const generatedAt = "2026-06-06T00:00:00Z";
  const tokenName = ["access", "token"].join("_");
  const secretValue = ["plan", "timestamp", "secret"].join("-");
  const invalidGeneratedAt = `not-a-date?${tokenName}=${secretValue}`;

  assert.equal(planPanelTimestampText(generatedAt, "ready"), new Date(generatedAt).toLocaleString());
  assert.notEqual(planPanelTimestampText(generatedAt, "ready"), generatedAt);
  assert.equal(planPanelTimestampText(null, "planning"), "계획 중");
  assert.equal(planPanelTimestampText(undefined, "failed"), "실패");

  const displayText = planPanelTimestampText(invalidGeneratedAt, "ready");

  assert.match(displayText, /\[REDACTED_POSSIBLE_SECRET\]/);
  assert.doesNotMatch(displayText, new RegExp(`${tokenName}|${secretValue}`));
});

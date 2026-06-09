import assert from "node:assert/strict";
import test from "node:test";
import {
  parseWorkSummarySessionLimit,
  WORK_SUMMARY_DEFAULT_SESSION_LIMIT,
  WORK_SUMMARY_MAX_SESSION_LIMIT,
  workSummarySessionLimitStatusText,
} from "../src/workSummarySessionLimit.ts";

test("work summary session limit parser accepts bounded positive integers", () => {
  assert.equal(parseWorkSummarySessionLimit("1"), 1);
  assert.equal(parseWorkSummarySessionLimit(" 200 "), 200);
  assert.equal(
    parseWorkSummarySessionLimit(String(WORK_SUMMARY_MAX_SESSION_LIMIT)),
    WORK_SUMMARY_MAX_SESSION_LIMIT,
  );
  assert.equal(
    parseWorkSummarySessionLimit(String(WORK_SUMMARY_DEFAULT_SESSION_LIMIT)),
    WORK_SUMMARY_DEFAULT_SESSION_LIMIT,
  );
});

test("work summary session limit parser rejects unsafe or ambiguous values", () => {
  assert.equal(parseWorkSummarySessionLimit(""), null);
  assert.equal(parseWorkSummarySessionLimit("0"), null);
  assert.equal(parseWorkSummarySessionLimit("-1"), null);
  assert.equal(parseWorkSummarySessionLimit("20.5"), null);
  assert.equal(parseWorkSummarySessionLimit("20 sessions"), null);
  assert.equal(parseWorkSummarySessionLimit(String(WORK_SUMMARY_MAX_SESSION_LIMIT + 1)), null);
});

test("work summary session limit status text exposes the active scan depth", () => {
  assert.equal(workSummarySessionLimitStatusText("200"), "세션 스캔 200개 기준");
  assert.equal(
    workSummarySessionLimitStatusText("x"),
    "세션 스캔 범위는 1-1,000 사이 숫자",
  );
});

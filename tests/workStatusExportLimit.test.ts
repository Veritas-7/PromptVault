import assert from "node:assert/strict";
import test from "node:test";
import {
  parseWorkStatusExportLimit,
  WORK_STATUS_EXPORT_DEFAULT_LIMIT,
  WORK_STATUS_EXPORT_MAX_LIMIT,
  workStatusExportLimitStatusText,
} from "../src/workStatusExportLimit.ts";

test("work status export limit parser accepts bounded positive integers", () => {
  assert.equal(parseWorkStatusExportLimit("1"), 1);
  assert.equal(parseWorkStatusExportLimit(" 25 "), 25);
  assert.equal(
    parseWorkStatusExportLimit(String(WORK_STATUS_EXPORT_DEFAULT_LIMIT)),
    WORK_STATUS_EXPORT_DEFAULT_LIMIT,
  );
  assert.equal(
    parseWorkStatusExportLimit(String(WORK_STATUS_EXPORT_MAX_LIMIT)),
    WORK_STATUS_EXPORT_MAX_LIMIT,
  );
});

test("work status export limit parser rejects unsafe or ambiguous values", () => {
  assert.equal(parseWorkStatusExportLimit(""), null);
  assert.equal(parseWorkStatusExportLimit("0"), null);
  assert.equal(parseWorkStatusExportLimit("-1"), null);
  assert.equal(parseWorkStatusExportLimit("12.5"), null);
  assert.equal(parseWorkStatusExportLimit("25 rows"), null);
  assert.equal(parseWorkStatusExportLimit(String(WORK_STATUS_EXPORT_MAX_LIMIT + 1)), null);
});

test("work status export limit status text explains active and invalid scopes", () => {
  assert.equal(workStatusExportLimitStatusText("25"), "상태 export 표시 25행 기준");
  assert.equal(
    workStatusExportLimitStatusText("x"),
    "상태 export 표시 행은 1-100 사이 숫자",
  );
});

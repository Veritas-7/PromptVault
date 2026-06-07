import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_SCAN_LIMIT,
  RECOMMENDED_SCAN_LIMIT,
  parseRequiredScanLimit,
  recommendedInitialScanLimit,
} from "../src/scanLimit.ts";

test("scan limit requires an explicit value", () => {
  assert.throws(
    () => parseRequiredScanLimit(" "),
    /스캔 전에 제한값을 입력하세요/,
  );
});

test("scan limit accepts positive whole numbers", () => {
  assert.equal(parseRequiredScanLimit("100"), 100);
  assert.equal(parseRequiredScanLimit(" 25 "), 25);
});

test("scan limit starts with a recommended value users can edit", () => {
  const recommended = recommendedInitialScanLimit();

  assert.equal(recommended, String(RECOMMENDED_SCAN_LIMIT));
  assert.equal(parseRequiredScanLimit(recommended), RECOMMENDED_SCAN_LIMIT);
  assert.equal(parseRequiredScanLimit("250"), 250);
});

test("scan limit rejects invalid and oversized values", () => {
  assert.throws(() => parseRequiredScanLimit("1.5"), /양의 정수/);
  assert.throws(() => parseRequiredScanLimit("0"), /1부터/);
  assert.throws(
    () => parseRequiredScanLimit(String(MAX_SCAN_LIMIT + 1)),
    /1부터/,
  );
});

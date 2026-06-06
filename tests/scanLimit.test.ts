import assert from "node:assert/strict";
import test from "node:test";
import { MAX_SCAN_LIMIT, parseRequiredScanLimit } from "../src/scanLimit.ts";

test("scan limit requires an explicit value", () => {
  assert.throws(
    () => parseRequiredScanLimit(" "),
    /Enter a scan limit before scanning/,
  );
});

test("scan limit accepts positive whole numbers", () => {
  assert.equal(parseRequiredScanLimit("100"), 100);
  assert.equal(parseRequiredScanLimit(" 25 "), 25);
});

test("scan limit rejects invalid and oversized values", () => {
  assert.throws(() => parseRequiredScanLimit("1.5"), /positive whole number/);
  assert.throws(() => parseRequiredScanLimit("0"), /between 1/);
  assert.throws(
    () => parseRequiredScanLimit(String(MAX_SCAN_LIMIT + 1)),
    /between 1/,
  );
});

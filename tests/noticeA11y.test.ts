import assert from "node:assert/strict";
import test from "node:test";
import { ALERT_NOTICE_PROPS, STATUS_NOTICE_PROPS } from "../src/noticeA11y.ts";

test("alert notices announce urgent failures", () => {
  assert.deepEqual(ALERT_NOTICE_PROPS, { role: "alert" });
});

test("status notices announce non-urgent updates politely", () => {
  assert.deepEqual(STATUS_NOTICE_PROPS, {
    "aria-live": "polite",
    role: "status",
  });
});

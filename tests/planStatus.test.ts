import assert from "node:assert/strict";
import test from "node:test";
import {
  planFailureText,
  planUnavailableText,
  type PlanRunState,
} from "../src/planStatus.ts";

test("plan failure text distinguishes missing and stale plans", () => {
  const failed: PlanRunState = "failed";

  assert.equal(
    planFailureText(failed, false),
    "Could not create an import plan. Check the error above and use Plan to retry.",
  );
  assert.equal(
    planFailureText(failed, true),
    "Could not refresh the import plan. Existing plan data may be stale.",
  );
  assert.equal(planFailureText("ready", true), null);
});

test("plan unavailable text explains loading and failed states", () => {
  assert.equal(planUnavailableText("planning"), "Building source inventory.");
  assert.equal(planUnavailableText("failed"), "Import plan is unavailable. Use Plan to retry.");
  assert.equal(planUnavailableText("idle"), "Run Plan to inspect available prompt sources.");
});

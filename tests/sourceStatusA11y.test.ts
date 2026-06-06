import assert from "node:assert/strict";
import test from "node:test";
import {
  planSourceStatusLabel,
  sourceSummaryStatusLabel,
} from "../src/sourceStatusA11y.ts";

test("plan source status labels include availability, file count, and size", () => {
  assert.equal(
    planSourceStatusLabel("Codex", "ok", 25105, "32.8 GiB"),
    "Codex source available: 25,105 files, 32.8 GiB",
  );
});

test("plan source status labels include empty-source notes", () => {
  assert.equal(
    planSourceStatusLabel("Antigravity IDE alt transcripts", "empty", 0, "0 B", [
      "No matching prompt files were found.",
    ]),
    "Antigravity IDE alt transcripts source empty: 0 files, 0 B. No matching prompt files were found.",
  );
});

test("source summary status labels include stored prompt counts", () => {
  assert.equal(
    sourceSummaryStatusLabel("Codex", "stored", 925),
    "Codex source stored: 925 prompts found",
  );
});

test("source summary status labels preserve unknown backend statuses", () => {
  assert.equal(
    sourceSummaryStatusLabel("Claude", "degraded", 12),
    "Claude source degraded: 12 prompts found",
  );
});

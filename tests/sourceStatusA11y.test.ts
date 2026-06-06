import assert from "node:assert/strict";
import test from "node:test";
import {
  planSourceActionLabel,
  planSourceSelectionLabel,
  planSourceStatusLabel,
  sourceSummaryStatusLabel,
} from "../src/sourceStatusA11y.ts";
import type { ActionLockState } from "../src/actionLocks.ts";

function lockState(overrides: Partial<ActionLockState> = {}): ActionLockState {
  return {
    importRunning: false,
    improvementRunning: false,
    planRunning: false,
    scanRunning: false,
    storedLoadRunning: false,
    ...overrides,
  };
}

test("plan source status labels include availability, file count, and size", () => {
  assert.equal(
    planSourceStatusLabel("Codex", "ok", 25105, "32.8 GiB"),
    "Codex source available: 25,105 files, 32.8 GiB",
  );
  assert.equal(
    planSourceStatusLabel("Small source", "ok", 1, "8 KiB"),
    "Small source source available: 1 file, 8 KiB",
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

test("plan source selection labels include source status context", () => {
  assert.equal(
    planSourceSelectionLabel("Codex", "ok", 25105, "32.8 GiB"),
    "Import queue selection for Codex source available: 25,105 files, 32.8 GiB",
  );
});

test("plan source selection labels include disabled empty-source reason", () => {
  assert.equal(
    planSourceSelectionLabel("Antigravity IDE alt transcripts", "empty", 0, "0 B", [
      "No matching prompt files were found.",
    ]),
    "Import queue selection for Antigravity IDE alt transcripts source empty: 0 files, 0 B. No matching prompt files were found.",
  );
});

test("plan source selection labels explain top-level lock reasons", () => {
  assert.equal(
    planSourceSelectionLabel("Codex", "ok", 25105, "32.8 GiB", [], lockState({ scanRunning: true })),
    "Cannot change import queue selection for Codex source available: 25,105 files, 32.8 GiB while a scan is running",
  );
});

test("plan source action labels include enabled source status context", () => {
  assert.equal(
    planSourceActionLabel("batch", "Codex", "ok", 25105, "32.8 GiB"),
    "Import one batch for Codex source available: 25,105 files, 32.8 GiB",
  );
});

test("plan source action labels include disabled empty-source reason", () => {
  assert.equal(
    planSourceActionLabel("continuous", "Antigravity IDE alt transcripts", "empty", 0, "0 B", [
      "No matching prompt files were found.",
    ]),
    "Cannot run import until done for Antigravity IDE alt transcripts source empty: 0 files, 0 B. No matching prompt files were found.",
  );
});

test("plan source action labels explain top-level lock reasons", () => {
  assert.equal(
    planSourceActionLabel(
      "batch",
      "Codex",
      "ok",
      25105,
      "32.8 GiB",
      [],
      lockState({ importRunning: true }),
    ),
    "Cannot import one batch for Codex source available: 25,105 files, 32.8 GiB while an import is running",
  );
  assert.equal(
    planSourceActionLabel(
      "continuous",
      "Claude Code projects",
      "ok",
      1722,
      "714.2 MiB",
      [],
      lockState({ storedLoadRunning: true }),
    ),
    "Cannot run import until done for Claude Code projects source available: 1,722 files, 714.2 MiB while stored prompts are loading",
  );
});

test("plan source action labels keep empty-source reasons before lock reasons", () => {
  assert.equal(
    planSourceActionLabel("batch", "Empty", "empty", 0, "0 B", [], lockState({ scanRunning: true })),
    "Cannot import one batch for Empty source empty: 0 files, 0 B",
  );
});

test("source summary status labels include stored prompt counts", () => {
  assert.equal(
    sourceSummaryStatusLabel("Codex", "stored", 925),
    "Codex source stored: 925 prompts found",
  );
  assert.equal(
    sourceSummaryStatusLabel("Small source", "stored", 1),
    "Small source source stored: 1 prompt found",
  );
});

test("source summary status labels preserve unknown backend statuses", () => {
  assert.equal(
    sourceSummaryStatusLabel("Claude", "degraded", 12),
    "Claude source degraded: 12 prompts found",
  );
});

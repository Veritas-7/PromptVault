import assert from "node:assert/strict";
import test from "node:test";
import { importEventBatchSummary, importEventStatusLabel } from "../src/importEvents.ts";
import type { ImportEvent } from "../src/types.ts";

function event(overrides: Partial<ImportEvent> = {}): ImportEvent {
  return {
    id: 1,
    generated_at: "2026-06-06T00:00:00Z",
    source_id: "source-a",
    source_label: "Source A",
    root_path: "/tmp/source-a",
    batch_start_index: 0,
    batch_file_count: 5,
    batch_prompt_count: 12,
    processed_files: 5,
    total_files: 10,
    completed: false,
    warnings: [],
    ...overrides,
  };
}

test("import event status distinguishes resumable, empty, and complete batches", () => {
  assert.equal(importEventStatusLabel(event()), "resumable");
  assert.equal(importEventStatusLabel(event({ batch_file_count: 0 })), "no files");
  assert.equal(importEventStatusLabel(event({ completed: true })), "complete");
});

test("import event batch summary formats files and prompts", () => {
  assert.equal(
    importEventBatchSummary(event({ batch_file_count: 1234, batch_prompt_count: 5678 })),
    "1,234 files · 5,678 prompts",
  );
});

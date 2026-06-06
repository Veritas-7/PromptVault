import assert from "node:assert/strict";
import test from "node:test";
import {
  importProgressPercent,
  importStopNoticeText,
  importRunFailureText,
  importStatusLabel,
  type ImportRunState,
} from "../src/importProgress.ts";
import type { ImportBatchResult } from "../src/types.ts";

function importResult(processedFiles: number, totalFiles: number, completed = false): ImportBatchResult {
  return {
    generated_at: "2026-06-06T00:00:00Z",
    source: {
      id: "source-a",
      label: "Source A",
      root_path: "/tmp/source-a",
      status: "ok",
      file_count: totalFiles,
      byte_count: 0,
      large_file_count: 0,
      largest_file_bytes: 0,
      newest_modified_at: null,
      notes: [],
    },
    state: {
      source_id: "source-a",
      source_label: "Source A",
      root_path: "/tmp/source-a",
      total_files: totalFiles,
      total_bytes: 0,
      next_file_index: processedFiles,
      processed_files: processedFiles,
      imported_prompt_count: 0,
      completed,
      updated_at: "2026-06-06T00:00:00Z",
    },
    batch_start_index: Math.max(0, processedFiles - 1),
    batch_file_count: 1,
    batch_prompt_count: 0,
    returned_prompt_count: 0,
    prompts: [],
    stats: {
      total_prompts: 0,
      total_files: 0,
      total_words: 0,
      average_words: 0,
      average_quality: 0,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [],
    },
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 0,
      inserted_prompt_count: 0,
      updated_prompt_count: 0,
      date_count: 0,
    },
    warnings: [],
  };
}

test("import progress is bounded and rounded", () => {
  assert.equal(importProgressPercent(importResult(3, 10)), 30);
  assert.equal(importProgressPercent(importResult(15, 10)), 100);
  assert.equal(importProgressPercent(importResult(0, 0, true)), 100);
});

test("import status explains continuous stop requests", () => {
  assert.equal(importStatusLabel(importResult(5, 10), "importing", "continuous", false), "Running");
  assert.equal(
    importStatusLabel(importResult(5, 10), "importing", "continuous", true),
    "Stopping after current batch",
  );
});

test("import status differentiates stopped and complete states", () => {
  assert.equal(importStatusLabel(importResult(5, 10), "stopped", "continuous", false), "Stopped");
  assert.equal(importStatusLabel(importResult(10, 10, true), "ready", "continuous", false), "Complete");
});

test("import status reports failed state first", () => {
  const failed: ImportRunState = "failed";

  assert.equal(importStatusLabel(importResult(10, 10, true), failed, "single", false), "Failed");
});

test("import failure text keeps a failed no-result run visible", () => {
  assert.equal(
    importRunFailureText("failed", "Gemini temporary chats"),
    "Could not import Gemini temporary chats. Check the error above and retry from the import plan.",
  );
  assert.equal(
    importRunFailureText("failed", "  "),
    "Could not import the selected source. Check the error above and retry from the import plan.",
  );
  assert.equal(importRunFailureText("ready", "Gemini temporary chats"), null);
});

test("import stop notice explains continuous resume path", () => {
  assert.equal(
    importStopNoticeText("stopped", "continuous", "Gemini temporary chats"),
    "Stopped importing Gemini temporary chats after the current batch. Run Until Done again to resume from the saved cursor.",
  );
  assert.equal(
    importStopNoticeText("stopped", "continuous", "  "),
    "Stopped importing after the current batch. Run Until Done again to resume from the saved cursor.",
  );
});

test("import stop notice explains partial queue resume path", () => {
  assert.equal(
    importStopNoticeText("stopped", "queue", null, 1, 3),
    "Import queue stopped after the current source. 1 of 3 sources completed. Run Selected again to continue.",
  );
  assert.equal(
    importStopNoticeText("stopped", "queue", null, 5, 3),
    "Import queue stopped after the current source. 3 of 3 sources completed. Run Selected again to continue.",
  );
});

test("import stop notice is scoped to stopped imports", () => {
  assert.equal(importStopNoticeText("ready", "continuous", "Gemini temporary chats"), null);
  assert.equal(importStopNoticeText("failed", "queue", null, 1, 3), null);
});

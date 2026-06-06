import assert from "node:assert/strict";
import test from "node:test";
import { selectedQueueSourceIds, toggleSourceSelection } from "../src/importQueue.ts";
import type { SourcePlan } from "../src/types.ts";

function source(id: string, fileCount: number): SourcePlan {
  return {
    id,
    label: id,
    root_path: `/tmp/${id}`,
    status: fileCount > 0 ? "ok" : "missing",
    file_count: fileCount,
    byte_count: 0,
    large_file_count: 0,
    largest_file_bytes: 0,
    newest_modified_at: null,
    notes: [],
  };
}

test("source selection toggles without duplicates", () => {
  assert.deepEqual(toggleSourceSelection([], "a", true), ["a"]);
  assert.deepEqual(toggleSourceSelection(["a"], "a", true), ["a"]);
  assert.deepEqual(toggleSourceSelection(["a", "b"], "a", false), ["b"]);
});

test("queue keeps selected order and skips unavailable sources", () => {
  const sources = [source("a", 10), source("b", 0), source("c", 2)];

  assert.deepEqual(selectedQueueSourceIds(["c", "b", "a", "missing"], sources), ["c", "a"]);
});

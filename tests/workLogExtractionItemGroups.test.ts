import assert from "node:assert/strict";
import test from "node:test";
import {
  groupWorkLogExtractionItemsByProjectDate,
} from "../src/workLogExtractionItemGroups.ts";
import type { ProjectWorkLogExtractionItem } from "../src/types.ts";

function item(overrides: Partial<ProjectWorkLogExtractionItem> = {}): ProjectWorkLogExtractionItem {
  return {
    id: 1,
    saved_at: "2026-06-09T05:00:00+09:00",
    run_generated_at: "2026-06-09T05:00:00+09:00",
    provider: "local-extraction-rules",
    used_ai: false,
    candidate_id: "work-log-CareVault-a1",
    project: "CareVault",
    source_path: "/tmp/CareVault/working.md",
    source_file: "working.md",
    date: "2026-06-09",
    title: "Verify source sentence",
    status: "proposed",
    evidence: "2026-06-09: Verify source sentence.",
    confidence: 0.78,
    warnings: [],
    ...overrides,
  };
}

test("work log extraction item groups preserve first project/day order", () => {
  const groups = groupWorkLogExtractionItemsByProjectDate([
    item({ id: 1, project: "CareVault", date: "2026-06-09" }),
    item({ id: 2, project: "PromptVault", date: "2026-06-09" }),
    item({ id: 3, project: "CareVault", date: "2026-06-09" }),
    item({ id: 4, project: "CareVault", date: "2026-06-08" }),
  ]);

  assert.deepEqual(groups.map((group) => group.group_id), [
    "2026-06-09::CareVault",
    "2026-06-09::PromptVault",
    "2026-06-08::CareVault",
  ]);
  assert.deepEqual(groups.map((group) => group.item_count), [2, 1, 1]);
  assert.deepEqual(groups[0].items.map((groupItem) => groupItem.id), [1, 3]);
});

test("work log extraction item groups keep project and date display values", () => {
  const [group] = groupWorkLogExtractionItemsByProjectDate([
    item({ project: "RepoTutorStudio", date: "2026-06-04" }),
  ]);

  assert.equal(group.project, "RepoTutorStudio");
  assert.equal(group.date, "2026-06-04");
  assert.equal(group.item_count, 1);
});

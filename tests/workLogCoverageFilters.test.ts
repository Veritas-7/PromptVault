import assert from "node:assert/strict";
import test from "node:test";
import {
  activeWorkLogCoverageFilterCount,
  emptyWorkLogCoverageFilters,
  filterWorkLogCoverageFiles,
  workLogCoverageFilterMetaText,
  workLogCoverageProjectSuggestions,
  type WorkLogCoverageFilters,
} from "../src/workLogCoverageFilters.ts";
import type { ProjectWorkLogCoverageFile } from "../src/types.ts";

function coverageFile(overrides: Partial<ProjectWorkLogCoverageFile> = {}): ProjectWorkLogCoverageFile {
  return {
    latest_date: "2026-06-09",
    latest_title: "PromptVault work log coverage",
    modified_at: "2026-06-09T00:00:00Z",
    project: "PromptVault",
    source_file: "working.md",
    source_path: "/tmp/PromptVault/working.md",
    status: "parsed",
    work_item_count: 3,
    ...overrides,
  };
}

test("work log coverage filters narrow gap logs by status group and project", () => {
  const files = [
    coverageFile(),
    coverageFile({
      latest_date: null,
      latest_title: null,
      project: "PromptVault",
      source_file: "workingd.md",
      source_path: "/tmp/PromptVault/workingd.md",
      status: "unparsed",
      work_item_count: 0,
    }),
    coverageFile({
      latest_date: null,
      latest_title: null,
      project: "CareVault",
      source_file: "WORKING_LOG.md",
      source_path: "/tmp/CareVault/WORKING_LOG.md",
      status: "unreadable",
      work_item_count: 0,
    }),
  ];
  const filters: WorkLogCoverageFilters = {
    project: "PromptVault",
    status: "needs_review",
  };

  assert.equal(activeWorkLogCoverageFilterCount(filters), 2);
  assert.deepEqual(
    filterWorkLogCoverageFiles(files, filters).map((file) => file.source_file),
    ["workingd.md"],
  );
  assert.equal(
    workLogCoverageFilterMetaText(1, files.length, activeWorkLogCoverageFilterCount(filters)),
    "작업로그 필터 · 필터 2개 · 결과 1 / 3개",
  );
});

test("work log coverage filters expose project suggestions and empty state", () => {
  const files = [
    coverageFile({ project: "PromptVault" }),
    coverageFile({ project: "CareVault" }),
    coverageFile({ project: "PromptVault", source_path: "/tmp/PromptVault/workingd.md" }),
  ];

  assert.deepEqual(workLogCoverageProjectSuggestions(files), ["CareVault", "PromptVault"]);
  assert.deepEqual(filterWorkLogCoverageFiles(files, emptyWorkLogCoverageFilters()), files);
  assert.equal(workLogCoverageFilterMetaText(files.length, files.length, 0), "작업로그 필터 · 필터 없음 · 결과 3 / 3개");
});

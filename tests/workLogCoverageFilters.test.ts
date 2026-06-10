import assert from "node:assert/strict";
import test from "node:test";
import {
  activeWorkLogCoverageFilterCount,
  emptyWorkLogCoverageFilters,
  filterWorkLogCoverageFiles,
  workLogCoverageFilterMetaText,
  workLogCoverageLatestDateSuggestions,
  workLogCoverageProjectSuggestions,
  workLogCoverageSourceFileSuggestions,
  workLogCoverageStatusLabel,
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
    latestDate: "",
    project: "PromptVault",
    sourceFile: "",
    status: "needs_review",
  };

  assert.equal(activeWorkLogCoverageFilterCount(filters), 2);
  assert.deepEqual(
    filterWorkLogCoverageFiles(files, filters).map((file) => file.source_file),
    ["workingd.md"],
  );
  assert.equal(
    workLogCoverageFilterMetaText(1, files.length, filters),
    "작업로그 필터 · 필터 2개 · 조건 프로젝트 PromptVault · 상태 문제 로그 · 결과 1 / 3개",
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
  assert.equal(
    workLogCoverageFilterMetaText(files.length, files.length, emptyWorkLogCoverageFilters()),
    "작업로그 필터 · 필터 없음 · 결과 3 / 3개",
  );
});

test("work log coverage filters narrow parsed rows by latest date", () => {
  const files = [
    coverageFile({
      latest_date: "2026-06-09",
      latest_title: "PromptVault day one",
      source_path: "/tmp/PromptVault/working.md",
    }),
    coverageFile({
      latest_date: "2026-06-10",
      latest_title: "PromptVault day two",
      source_path: "/tmp/PromptVault/PROGRESS_LOG.md",
      source_file: "PROGRESS_LOG.md",
    }),
    coverageFile({
      latest_date: null,
      latest_title: null,
      source_path: "/tmp/PromptVault/workingd.md",
      source_file: "workingd.md",
      status: "pointer",
      work_item_count: 0,
    }),
  ];
  const filters: WorkLogCoverageFilters = {
    latestDate: "2026-06-10",
    project: "",
    sourceFile: "",
    status: "",
  };

  assert.equal(activeWorkLogCoverageFilterCount(filters), 1);
  assert.deepEqual(
    filterWorkLogCoverageFiles(files, filters).map((file) => file.latest_title),
    ["PromptVault day two"],
  );
  assert.deepEqual(workLogCoverageLatestDateSuggestions(files), [
    "2026-06-09",
    "2026-06-10",
  ]);
  assert.equal(
    workLogCoverageFilterMetaText(1, files.length, filters),
    "작업로그 필터 · 필터 1개 · 조건 날짜 2026-06-10 · 결과 1 / 3개",
  );
});

test("work log coverage filters narrow by source file kind", () => {
  const files = [
    coverageFile({ source_file: "working.md", source_path: "/tmp/PromptVault/working.md" }),
    coverageFile({
      source_file: "workingd.md",
      source_path: "/tmp/PromptVault/workingd.md",
      status: "pointer",
      latest_date: null,
      latest_title: null,
      work_item_count: 0,
    }),
    coverageFile({
      project: "PromptVault",
      source_file: "PROGRESS_LOG.md",
      source_path: "/tmp/PromptVault/PROGRESS_LOG.md",
    }),
  ];
  const filters: WorkLogCoverageFilters = {
    latestDate: "",
    project: "",
    sourceFile: "workingd.md",
    status: "",
  };

  assert.equal(activeWorkLogCoverageFilterCount(filters), 1);
  assert.deepEqual(
    filterWorkLogCoverageFiles(files, filters).map((file) => file.source_path),
    ["/tmp/PromptVault/workingd.md"],
  );
  assert.deepEqual(workLogCoverageSourceFileSuggestions(files), [
    "PROGRESS_LOG.md",
    "working.md",
    "workingd.md",
  ]);
  assert.equal(
    workLogCoverageFilterMetaText(1, files.length, filters),
    "작업로그 필터 · 필터 1개 · 조건 파일 workingd.md · 결과 1 / 3개",
  );
});

test("work log coverage status labels use operator-facing Korean copy", () => {
  assert.equal(workLogCoverageStatusLabel(""), "전체 상태");
  assert.equal(workLogCoverageStatusLabel("needs_review"), "문제 로그");
  assert.equal(workLogCoverageStatusLabel("parsed"), "파싱 완료");
  assert.equal(workLogCoverageStatusLabel("pointer"), "주 로그 참조");
  assert.equal(workLogCoverageStatusLabel("unparsed"), "추출 필요");
  assert.equal(workLogCoverageStatusLabel("unreadable"), "읽기 실패");
  assert.equal(workLogCoverageStatusLabel("custom_status"), "custom_status");
});

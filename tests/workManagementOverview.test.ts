import assert from "node:assert/strict";
import test from "node:test";
import {
  activeWorkManagementOverviewFilterCount,
  buildWorkManagementOverview,
  emptyWorkManagementOverviewFilters,
  filterWorkManagementOverviewRows,
  workManagementOverviewDateSuggestions,
  workManagementOverviewDurabilityWarningText,
  workManagementOverviewFilterMetaText,
  workManagementOverviewMetaText,
  workManagementOverviewPersistenceText,
  workManagementOverviewProjectSuggestions,
  workManagementOverviewSourceText,
} from "../src/workManagementOverview.ts";
import type {
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshot,
  ProjectWorkSummarySnapshotsResult,
} from "../src/types.ts";

function summaryResult(): ProjectWorkSummaryResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    provider: "local-citation-rules",
    used_ai: false,
    narrative_markdown: "- 2026-06-09 PromptVault: work summary",
    summaries: [{
      date: "2026-06-09",
      project: "PromptVault",
      headline: "PromptVault management slice",
      work_item_count: 3,
      session_evidence_count: 2,
      unique_session_evidence_count: 1,
      citations: [],
      next_actions: [],
    }],
    report: {
      generated_at: "2026-06-09T00:00:00Z",
      total_items: 3,
      project_count: 1,
      date_count: 1,
      files_seen: 1,
      items_by_date: [],
      items_by_project: [],
      session_scan_prompt_count: 4,
      session_scan_sources: [],
      session_evidence_count: 2,
      session_sources: [],
      session_evidence_unique_count: 1,
      session_evidence_unique_sources: [],
      session_evidence_index_used: true,
      session_evidence_index_updated: false,
      session_evidence_index_count: 4,
      session_evidence_mode: "metadata-first-raw-fallback",
      items: [],
      warnings: [],
    },
    extraction_merge: null,
    persistence: null,
    warnings: [],
  };
}

function snapshot(overrides: Partial<ProjectWorkSummarySnapshot> = {}): ProjectWorkSummarySnapshot {
  return {
    id: 4,
    created_at: "2026-06-09T01:00:00Z",
    provider: "local-citation-rules",
    used_ai: false,
    narrative_markdown: "- snapshot",
    total_items: 4,
    project_count: 2,
    date_count: 2,
    files_seen: 2,
    session_evidence_count: 2,
    session_evidence_unique_count: 1,
    summary_count: 2,
    summaries: [
      {
        date: "2026-06-09",
        project: "PromptVault",
        headline: "PromptVault snapshot",
        work_item_count: 4,
        session_evidence_count: 2,
        unique_session_evidence_count: 1,
        citations: [],
        next_actions: [],
      },
      {
        date: "2026-06-08",
        project: "CareVault",
        headline: "CareVault snapshot",
        work_item_count: 1,
        session_evidence_count: 0,
        unique_session_evidence_count: 0,
        citations: [],
        next_actions: [],
      },
    ],
    extraction_merge: null,
    warnings: [],
    ...overrides,
  };
}

function snapshotsResult(): ProjectWorkSummarySnapshotsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_snapshots: 1,
    returned_snapshot_count: 1,
    available_dates: ["2026-06-09", "2026-06-08"],
    available_projects: ["PromptVault", "CareVault"],
    snapshots: [snapshot()],
    warnings: [],
  };
}

function extractionItemsResult(): ProjectWorkLogExtractionItemsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_items: 2,
    returned_item_count: 2,
    available_dates: ["2026-06-09", "2026-06-04"],
    available_projects: ["PromptVault", "RepoTutorStudio"],
    items: [
      {
        id: 7,
        saved_at: "2026-06-09T01:30:00Z",
        run_generated_at: "2026-06-09T01:20:00Z",
        provider: "local-extraction-rules",
        used_ai: false,
        candidate_id: "work-log-PromptVault-a1",
        project: "PromptVault",
        source_path: "/Users/wj/Ai/System/10_Projects/PromptVault/working.md",
        source_file: "working.md",
        date: "2026-06-09",
        title: "Added management overview",
        status: "completed",
        evidence: "2026-06-09: Added management overview",
        confidence: 0.82,
        warnings: [],
      },
      {
        id: 8,
        saved_at: "2026-06-09T01:31:00Z",
        run_generated_at: "2026-06-09T01:20:00Z",
        provider: "local-extraction-rules",
        used_ai: false,
        candidate_id: "work-log-RepoTutorStudio-a1",
        project: "RepoTutorStudio",
        source_path: "/Users/wj/Ai/System/10_Projects/RepoTutorStudio/working.md",
        source_file: "working.md",
        date: "2026-06-04",
        title: "Created project root",
        status: "completed",
        evidence: "2026-06-04: Created project root",
        confidence: 0.72,
        warnings: [],
      },
    ],
    warnings: [],
  };
}

function extractionProposalsResult(): ProjectWorkLogExtractionProposalsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    root_path: "/Users/wj/Ai/System/10_Projects",
    provider: "local-extraction-rules",
    used_ai: false,
    candidate_count: 2,
    accepted_count: 1,
    rejected_count: 1,
    proposals: [
      {
        candidate_id: "work-log-CareVault-unsaved-a1",
        project: "CareVault",
        source_path: "/Users/wj/Ai/System/10_Projects/CareVault/workingd.md",
        source_file: "workingd.md",
        date: "2026-06-08",
        title: "Unparsed progress log proposal",
        status: "completed",
        evidence: "2026-06-08: Unparsed progress log proposal",
        confidence: 0.76,
        accepted: true,
        rejection_reason: null,
      },
      {
        candidate_id: "work-log-Unknown-rejected-a1",
        project: "UnknownProject",
        source_path: "/Users/wj/Ai/System/10_Projects/UnknownProject/working.md",
        source_file: "working.md",
        date: null,
        title: "Undated rejected proposal",
        status: "blocked",
        evidence: "No source date",
        confidence: 0.1,
        accepted: false,
        rejection_reason: "missing_date",
      },
    ],
    persistence: null,
    warnings: [],
  };
}

function coverageResult(): ProjectWorkLogCoverageResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    root_path: "/Users/wj/Ai/System/10_Projects",
    files_seen: 2,
    parsed_file_count: 1,
    unparsed_file_count: 1,
    project_count: 2,
    work_item_count: 5,
    files: [
      {
        project: "PromptVault",
        source_path: "/Users/wj/Ai/System/10_Projects/PromptVault/working.md",
        source_file: "working.md",
        status: "parsed",
        work_item_count: 5,
        latest_date: "2026-06-09",
        latest_title: "Management overview",
        modified_at: "2026-06-09T01:40:00Z",
      },
      {
        project: "UnknownProject",
        source_path: "/Users/wj/Ai/System/10_Projects/UnknownProject/working.md",
        source_file: "working.md",
        status: "unparsed",
        work_item_count: 0,
        latest_date: null,
        latest_title: null,
        modified_at: "2026-06-09T01:40:00Z",
      },
    ],
    warnings: [],
  };
}

test("work management overview merges source evidence by project and date", () => {
  const overview = buildWorkManagementOverview({
    coverage: coverageResult(),
    extractionItems: extractionItemsResult(),
    extractionProposals: extractionProposalsResult(),
    snapshots: snapshotsResult(),
    summary: summaryResult(),
  });

  assert.equal(overview.row_count, 3);
  assert.equal(overview.project_count, 3);
  assert.equal(overview.date_count, 3);
  assert.deepEqual(overview.rows.map((row) => row.key), [
    "2026-06-09::PromptVault",
    "2026-06-08::CareVault",
    "2026-06-04::RepoTutorStudio",
  ]);

  const promptVault = overview.rows[0];
  assert.deepEqual(promptVault.sources, [
    "current_summary",
    "snapshot",
    "saved_extraction",
    "progress_log",
  ]);
  assert.equal(promptVault.current_summary_count, 1);
  assert.equal(promptVault.snapshot_count, 1);
  assert.equal(promptVault.saved_extraction_count, 1);
  assert.equal(promptVault.extraction_proposal_count, 0);
  assert.equal(promptVault.progress_log_count, 1);
  assert.equal(promptVault.work_item_count, 5);
  assert.equal(promptVault.session_evidence_count, 2);
  assert.equal(promptVault.persistence_state, "persisted");
  assert.equal(promptVault.latest_snapshot_created_at, "2026-06-09T01:00:00Z");
  assert.equal(promptVault.latest_saved_extraction_at, "2026-06-09T01:30:00Z");
  assert.equal(promptVault.latest_title, "PromptVault management slice");

  const careVault = overview.rows[1];
  assert.deepEqual(careVault.sources, ["snapshot", "extraction_proposal"]);
  assert.equal(careVault.extraction_proposal_count, 1);
  assert.equal(careVault.persistence_state, "persisted");
  assert.equal(careVault.latest_snapshot_created_at, "2026-06-09T01:00:00Z");
  assert.equal(careVault.latest_saved_extraction_at, null);
  assert.equal(careVault.latest_title, "CareVault snapshot");

  const repoTutorStudio = overview.rows[2];
  assert.equal(repoTutorStudio.persistence_state, "persisted");
  assert.equal(repoTutorStudio.latest_snapshot_created_at, null);
  assert.equal(repoTutorStudio.latest_saved_extraction_at, "2026-06-09T01:31:00Z");
});

test("work management overview does not double count saved extraction proposals", () => {
  const proposals = extractionProposalsResult();
  const overview = buildWorkManagementOverview({
    extractionItems: extractionItemsResult(),
    extractionProposals: {
      ...proposals,
      proposals: [
        ...proposals.proposals,
        {
          candidate_id: "work-log-PromptVault-a1",
          project: "PromptVault",
          source_path: "/Users/wj/Ai/System/10_Projects/PromptVault/working.md",
          source_file: "working.md",
          date: "2026-06-09",
          title: "Already saved management overview",
          status: "completed",
          evidence: "2026-06-09: Already saved management overview",
          confidence: 0.88,
          accepted: true,
          rejection_reason: null,
        },
      ],
    },
  });

  const promptVault = overview.rows.find((row) => row.key === "2026-06-09::PromptVault");
  assert.ok(promptVault);
  assert.deepEqual(promptVault.sources, ["saved_extraction"]);
  assert.equal(promptVault.saved_extraction_count, 1);
  assert.equal(promptVault.extraction_proposal_count, 0);
  assert.equal(overview.saved_extraction_count, 2);
  assert.equal(overview.extraction_proposal_count, 1);
});

test("work management overview counts saved extractions and parsed logs as work items", () => {
  const savedOnly = buildWorkManagementOverview({
    extractionItems: extractionItemsResult(),
  });
  const repoTutorStudio = savedOnly.rows.find((row) => row.key === "2026-06-04::RepoTutorStudio");
  assert.ok(repoTutorStudio);
  assert.equal(repoTutorStudio.work_item_count, 1);

  const progressOnly = buildWorkManagementOverview({
    coverage: coverageResult(),
  });
  const promptVault = progressOnly.rows.find((row) => row.key === "2026-06-09::PromptVault");
  assert.ok(promptVault);
  assert.equal(promptVault.work_item_count, 5);
});

test("work management overview status text exposes management coverage", () => {
  const overview = buildWorkManagementOverview({
    coverage: coverageResult(),
    extractionItems: extractionItemsResult(),
    extractionProposals: extractionProposalsResult(),
    snapshots: snapshotsResult(),
    summary: summaryResult(),
  });

  assert.equal(
    workManagementOverviewMetaText(overview),
    "관리 3개 · 3개 프로젝트 · 3일 · 현재요약 1 · 스냅샷 2 · 추출제안 1 · 저장추출 2 · 진행로그 1 · 저장관리 3 · 라이브만 0 · 최신스냅샷 2026-06-09T01:00:00Z · 최신저장추출 2026-06-09T01:31:00Z",
  );
  assert.equal(
    workManagementOverviewSourceText(overview.rows[0]),
    "현재요약 · 스냅샷 · 저장추출 · 진행로그",
  );
  assert.equal(
    workManagementOverviewPersistenceText(overview.rows[0]),
    "저장관리 · 최신 스냅샷 2026-06-09T01:00:00Z · 최신 저장추출 2026-06-09T01:30:00Z",
  );
  assert.equal(
    workManagementOverviewPersistenceText(buildWorkManagementOverview({ coverage: coverageResult() }).rows[0]),
    "라이브만 · 저장근거 없음",
  );
});

test("work management overview filters expose auditable project date rows", () => {
  const overview = buildWorkManagementOverview({
    coverage: coverageResult(),
    extractionItems: extractionItemsResult(),
    extractionProposals: extractionProposalsResult(),
    snapshots: snapshotsResult(),
    summary: summaryResult(),
  });

  assert.deepEqual(emptyWorkManagementOverviewFilters(), {
    date: "",
    persistence: "",
    project: "",
    source: "",
  });
  assert.equal(activeWorkManagementOverviewFilterCount({
    date: "2026-06-09",
    persistence: "persisted",
    project: " PromptVault ",
    source: "saved_extraction",
  }), 4);

  assert.deepEqual(
    filterWorkManagementOverviewRows(overview.rows, {
      date: "2026-06-09",
      persistence: "persisted",
      project: "PromptVault",
      source: "saved_extraction",
    }).map((row) => row.key),
    ["2026-06-09::PromptVault"],
  );
  assert.deepEqual(
    filterWorkManagementOverviewRows(overview.rows, {
      date: "",
      persistence: "",
      project: "",
      source: "extraction_proposal",
    }).map((row) => row.key),
    ["2026-06-08::CareVault"],
  );
  assert.deepEqual(
    filterWorkManagementOverviewRows(overview.rows, {
      date: "",
      persistence: "live_only",
      project: "",
      source: "",
    }),
    [],
  );
  assert.deepEqual(workManagementOverviewDateSuggestions(overview.rows), [
    "2026-06-04",
    "2026-06-08",
    "2026-06-09",
  ]);
  assert.deepEqual(workManagementOverviewProjectSuggestions(overview.rows), [
    "CareVault",
    "PromptVault",
    "RepoTutorStudio",
  ]);
  assert.equal(
    workManagementOverviewFilterMetaText(1, 3, 2),
    "관리 감사 필터 2개 · 결과 1 / 3개",
  );
  assert.equal(
    workManagementOverviewFilterMetaText(3, 3, 0),
    "관리 감사 필터 없음 · 결과 3 / 3개",
  );
});

test("work management overview warns when live-only rows dominate", () => {
  const liveOnly = buildWorkManagementOverview({
    coverage: coverageResult(),
  });

  assert.equal(
    workManagementOverviewDurabilityWarningText(liveOnly),
    "라이브만 1개가 저장관리 0개보다 많습니다. 스냅샷 저장 또는 AI 추출 저장으로 관리 상태를 고정하세요.",
  );

  const persisted = buildWorkManagementOverview({
    coverage: coverageResult(),
    extractionItems: extractionItemsResult(),
    extractionProposals: extractionProposalsResult(),
    snapshots: snapshotsResult(),
    summary: summaryResult(),
  });
  assert.equal(workManagementOverviewDurabilityWarningText(persisted), null);
  assert.equal(workManagementOverviewDurabilityWarningText(buildWorkManagementOverview({})), null);
});

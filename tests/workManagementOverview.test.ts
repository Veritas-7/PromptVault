import assert from "node:assert/strict";
import test from "node:test";
import {
  activeWorkManagementOverviewFilterCount,
  buildWorkManagementOverview,
  emptyWorkManagementOverviewFilters,
  filterWorkManagementOverviewRows,
  sortWorkManagementOverviewRows,
  workManagementOverviewConfidenceText,
  workManagementOverviewDateSuggestions,
  workManagementOverviewDurabilityWarningText,
  workManagementOverviewFilterMetaText,
  workManagementOverviewMetaText,
  workManagementOverviewNextActionText,
  workManagementOverviewPersistenceText,
  workManagementOverviewProjectSuggestions,
  workManagementOverviewSessionText,
  workManagementOverviewSourceText,
} from "../src/workManagementOverview.ts";
import type {
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkLogNormalizedItemsResult,
  ProjectWorkStatusExportResult,
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
        provider_model: null,
        provider_runtime: "local-extraction-rules",
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
        provider_model: null,
        provider_runtime: "local-extraction-rules",
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
    provider_model: null,
    provider_runtime: "local-extraction-rules",
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

function normalizedItemsResult(): ProjectWorkLogNormalizedItemsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_items: 1,
    returned_item_count: 1,
    available_dates: ["2026-06-09"],
    available_projects: ["PromptVault"],
    items: [
      {
        id: 11,
        applied_at: "2026-06-09T01:45:00Z",
        candidate_id: "work-normalize-PromptVault-a1",
        review_reason: "operator_approved_normalization",
        provider: "local-normalization-rules",
        provider_model: null,
        provider_runtime: "local-normalization-rules",
        used_ai: false,
        project: "PromptVault",
        date: "2026-06-09",
        source_path: "/Users/wj/Ai/System/10_Projects/PromptVault/working.md",
        source_file: "working.md",
        reason: "existing_project_day_group",
        original_title: "Management overview",
        original_status: "current",
        original_evidence: "Management overview row from progress log.",
        normalized_title: "PromptVault normalized management overview",
        normalized_status: "current",
        normalized_evidence: "PromptVault management work normalized for project/day reporting.",
        confidence: 0.91,
        accepted: true,
        rejection_reason: null,
        work_item_count: 5,
        session_evidence_count: 2,
        saved_extraction_count: 1,
        ai_saved_extraction_count: 0,
        best_ai_confidence: null,
        risk_flags: [],
      },
    ],
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

function statusExportResult(): ProjectWorkStatusExportResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    markdown: "# status",
    total_row_count: 4,
    row_offset: 0,
    returned_row_count: 2,
    next_row_offset: 2,
    rows_truncated: true,
    report_total_items: 6,
    report_project_count: 3,
    report_date_count: 3,
    report_files_seen: 2,
    report_session_scan_prompt_count: 100,
    report_session_evidence_count: 2,
    report_unique_session_evidence_count: 1,
    report_session_evidence_index_used: true,
    report_session_evidence_index_updated: false,
    report_session_evidence_index_count: 100,
    report_session_evidence_index_total_count: 100,
    report_session_evidence_mode: "metadata-first-raw-fallback",
    rows: [
      {
        date: "2026-06-09",
        project: "PromptVault",
        operational_status: "session-supported",
        source_statuses: [{ text: "logged", count: 5 }],
        work_item_count: 5,
        source_file_count: 1,
        source_files: ["working.md"],
        source_file_roles: [{ text: "handoff-log", count: 1 }],
        top_titles: ["PromptVault session supported row"],
        sample_evidence: "PromptVault has session evidence.",
        latest_source_path: "/Users/wj/Ai/System/10_Projects/PromptVault/working.md",
        latest_source_file: "working.md",
        latest_source_role: "handoff-log",
        session_evidence_count: 2,
        unique_session_evidence_count: 1,
        session_sources: [{ text: "Codex", count: 2 }],
        needs_session_evidence: false,
        session_evidence_audit: "matched",
        needs_title_normalization: false,
      },
      {
        date: "2026-06-08",
        project: "CareVault",
        operational_status: "progress-log-only",
        source_statuses: [{ text: "logged", count: 1 }],
        work_item_count: 1,
        source_file_count: 1,
        source_files: ["workingd.md"],
        source_file_roles: [{ text: "handoff-log", count: 1 }],
        top_titles: ["CareVault rough progress row"],
        sample_evidence: "CareVault needs session evidence.",
        latest_source_path: "/Users/wj/Ai/System/10_Projects/CareVault/workingd.md",
        latest_source_file: "workingd.md",
        latest_source_role: "handoff-log",
        session_evidence_count: 0,
        unique_session_evidence_count: 0,
        session_sources: [],
        needs_session_evidence: true,
        session_evidence_audit: "unresolved-after-full-index",
        needs_title_normalization: true,
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
    normalizedItems: normalizedItemsResult(),
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
    "normalized_row",
    "progress_log",
  ]);
  assert.equal(promptVault.current_summary_count, 1);
  assert.equal(promptVault.snapshot_count, 1);
  assert.equal(promptVault.saved_extraction_count, 1);
  assert.equal(promptVault.normalized_row_count, 1);
  assert.equal(promptVault.extraction_proposal_count, 0);
  assert.equal(promptVault.progress_log_count, 1);
  assert.equal(promptVault.work_item_count, 5);
  assert.equal(promptVault.session_evidence_count, 2);
  assert.equal(promptVault.confidence_count, 2);
  assert.equal(promptVault.min_confidence, 0.82);
  assert.equal(promptVault.max_confidence, 0.91);
  assert.equal(promptVault.persistence_state, "persisted");
  assert.equal(promptVault.latest_snapshot_created_at, "2026-06-09T01:00:00Z");
  assert.equal(promptVault.latest_saved_extraction_at, "2026-06-09T01:30:00Z");
  assert.equal(promptVault.latest_normalized_at, "2026-06-09T01:45:00Z");
  assert.equal(promptVault.latest_title, "PromptVault management slice");

  const careVault = overview.rows[1];
  assert.deepEqual(careVault.sources, ["snapshot", "extraction_proposal"]);
  assert.equal(careVault.extraction_proposal_count, 1);
  assert.equal(careVault.confidence_count, 1);
  assert.equal(careVault.min_confidence, 0.76);
  assert.equal(careVault.max_confidence, 0.76);
  assert.equal(careVault.persistence_state, "persisted");
  assert.equal(careVault.latest_snapshot_created_at, "2026-06-09T01:00:00Z");
  assert.equal(careVault.latest_saved_extraction_at, null);
  assert.equal(careVault.latest_title, "CareVault snapshot");

  const repoTutorStudio = overview.rows[2];
  assert.equal(repoTutorStudio.persistence_state, "persisted");
  assert.equal(repoTutorStudio.min_confidence, 0.72);
  assert.equal(repoTutorStudio.max_confidence, 0.72);
  assert.equal(repoTutorStudio.latest_snapshot_created_at, null);
  assert.equal(repoTutorStudio.latest_saved_extraction_at, "2026-06-09T01:31:00Z");
  assert.equal(repoTutorStudio.latest_normalized_at, null);
});

test("work management overview exposes status export session coverage", () => {
  const overview = buildWorkManagementOverview({
    coverage: coverageResult(),
    statusExport: statusExportResult(),
  });

  assert.equal(overview.status_export_row_count, 2);
  assert.equal(overview.status_export_total_row_count, 4);
  assert.equal(overview.session_matched_row_count, 1);
  assert.equal(overview.session_unresolved_row_count, 1);
  assert.equal(overview.title_normalization_row_count, 1);

  const promptVault = overview.rows.find((row) => row.key === "2026-06-09::PromptVault");
  assert.ok(promptVault);
  assert.deepEqual(promptVault.sources, ["status_export", "progress_log"]);
  assert.equal(promptVault.status_export_count, 1);
  assert.equal(promptVault.needs_session_evidence, false);
  assert.equal(promptVault.needs_title_normalization, false);
  assert.equal(promptVault.session_evidence_audit, "matched");
  assert.equal(workManagementOverviewSessionText(promptVault), "세션 근거 2건 · 세션 매칭");

  const careVault = overview.rows.find((row) => row.key === "2026-06-08::CareVault");
  assert.ok(careVault);
  assert.deepEqual(careVault.sources, ["status_export"]);
  assert.equal(careVault.status_export_count, 1);
  assert.equal(careVault.needs_session_evidence, true);
  assert.equal(careVault.needs_title_normalization, true);
  assert.equal(careVault.session_evidence_audit, "unresolved-after-full-index");
  assert.equal(
    workManagementOverviewSessionText(careVault),
    "세션 근거 0건 · 전체 인덱스 미해결 · 제목 정규화 필요",
  );
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

test("work management overview merges normalized rows without double counting progress logs", () => {
  const normalizedOnly = buildWorkManagementOverview({
    normalizedItems: normalizedItemsResult(),
  });
  const normalizedPromptVault = normalizedOnly.rows.find((row) => row.key === "2026-06-09::PromptVault");
  assert.ok(normalizedPromptVault);
  assert.equal(normalizedPromptVault.work_item_count, 5);
  assert.equal(normalizedPromptVault.normalized_row_count, 1);
  assert.equal(normalizedPromptVault.persistence_state, "persisted");

  const merged = buildWorkManagementOverview({
    coverage: coverageResult(),
    normalizedItems: normalizedItemsResult(),
  });
  const promptVault = merged.rows.find((row) => row.key === "2026-06-09::PromptVault");
  assert.ok(promptVault);
  assert.deepEqual(promptVault.sources, ["normalized_row", "progress_log"]);
  assert.equal(promptVault.work_item_count, 5);
  assert.equal(promptVault.normalized_row_count, 1);
  assert.equal(promptVault.progress_log_count, 1);
  assert.equal(merged.normalized_row_count, 1);
  assert.equal(merged.progress_log_count, 1);
});

test("work management overview status text exposes management coverage", () => {
  const overview = buildWorkManagementOverview({
    coverage: coverageResult(),
    extractionItems: extractionItemsResult(),
    extractionProposals: extractionProposalsResult(),
    normalizedItems: normalizedItemsResult(),
    snapshots: snapshotsResult(),
    summary: summaryResult(),
  });

  assert.equal(
    workManagementOverviewMetaText(overview),
    "관리 3개 · 3개 프로젝트 · 3일 · 현재요약 1 · 스냅샷 2 · 추출제안 1 · 저장추출 2 · 정규화 1 · 상태행 0/0 · 세션매칭 0 · 세션미해결 0 · 제목정규화 0 · 진행로그 1 · 저장관리 3 · 라이브만 0 · 최신스냅샷 2026-06-09T01:00:00Z · 최신저장추출 2026-06-09T01:31:00Z · 최신정규화 2026-06-09T01:45:00Z",
  );
  assert.equal(
    workManagementOverviewSourceText(overview.rows[0]),
    "현재요약 · 스냅샷 · 저장추출 · 정규화 · 진행로그",
  );
  assert.equal(
    workManagementOverviewPersistenceText(overview.rows[0]),
    "저장관리 · 최신 스냅샷 2026-06-09T01:00:00Z · 최신 저장추출 2026-06-09T01:30:00Z · 최신 정규화 2026-06-09T01:45:00Z",
  );
  assert.equal(workManagementOverviewConfidenceText(overview.rows[0]), "confidence 0.82-0.91");
  assert.equal(
    workManagementOverviewNextActionText(overview.rows[0]),
    "다음 조치 · 상태 Export 로드로 세션 검증",
  );
  assert.equal(
    workManagementOverviewPersistenceText(buildWorkManagementOverview({ coverage: coverageResult() }).rows[0]),
    "라이브만 · 저장근거 없음",
  );
  assert.equal(
    workManagementOverviewConfidenceText(buildWorkManagementOverview({ coverage: coverageResult() }).rows[0]),
    "confidence 없음",
  );
  assert.equal(
    workManagementOverviewNextActionText(buildWorkManagementOverview({ coverage: coverageResult() }).rows[0]),
    "다음 조치 · 상태 Export 로드로 세션 검증",
  );
});

test("work management overview next action prioritizes daily task management gaps", () => {
  const statusOverview = buildWorkManagementOverview({
    coverage: coverageResult(),
    statusExport: statusExportResult(),
  });

  const promptVault = statusOverview.rows.find((row) => row.key === "2026-06-09::PromptVault");
  assert.ok(promptVault);
  assert.equal(
    workManagementOverviewNextActionText(promptVault),
    "다음 조치 · 진행로그 추출 저장 또는 라이브 고정 저장",
  );

  const careVault = statusOverview.rows.find((row) => row.key === "2026-06-08::CareVault");
  assert.ok(careVault);
  assert.equal(
    workManagementOverviewNextActionText(careVault),
    "다음 조치 · 세션근거 큐 검토 · 전체 인덱스 미해결",
  );

  const titleOnly = buildWorkManagementOverview({
    statusExport: {
      ...statusExportResult(),
      rows: [{
        ...statusExportResult().rows[0],
        needs_title_normalization: true,
        session_evidence_count: 1,
        unique_session_evidence_count: 1,
      }],
    },
  }).rows[0];
  assert.equal(
    workManagementOverviewNextActionText(titleOnly),
    "다음 조치 · 제목 정규화 큐 검토",
  );

  const lowConfidence = buildWorkManagementOverview({
    extractionItems: extractionItemsResult(),
    statusExport: {
      ...statusExportResult(),
      rows: [
        ...statusExportResult().rows,
        {
          ...statusExportResult().rows[0],
          date: "2026-06-04",
          project: "RepoTutorStudio",
          top_titles: ["RepoTutorStudio low confidence saved row"],
          latest_source_path: "/Users/wj/Ai/System/10_Projects/RepoTutorStudio/working.md",
          latest_source_file: "working.md",
          session_evidence_count: 1,
          unique_session_evidence_count: 1,
          needs_session_evidence: false,
          needs_title_normalization: false,
        },
      ],
    },
  }).rows.find((row) => row.key === "2026-06-04::RepoTutorStudio");
  assert.ok(lowConfidence);
  assert.equal(
    workManagementOverviewNextActionText(lowConfidence),
    "다음 조치 · 낮은 confidence row 재검토",
  );

  const savedExtraction = buildWorkManagementOverview({
    extractionItems: {
      ...extractionItemsResult(),
      items: [extractionItemsResult().items[0]],
    },
    statusExport: {
      ...statusExportResult(),
      rows: [statusExportResult().rows[0]],
    },
  }).rows.find((row) => row.key === "2026-06-09::PromptVault");
  assert.ok(savedExtraction);
  assert.equal(
    workManagementOverviewNextActionText(savedExtraction),
    "다음 조치 · AI 제목 정규화 검토",
  );

  const normalized = buildWorkManagementOverview({
    normalizedItems: normalizedItemsResult(),
    statusExport: statusExportResult(),
  }).rows.find((row) => row.key === "2026-06-09::PromptVault");
  assert.ok(normalized);
  assert.equal(
    workManagementOverviewNextActionText(normalized),
    "다음 조치 · 관리 완료 · 정기 재검증",
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
    minConfidence: "",
    persistence: "",
    project: "",
    source: "",
  });
  assert.equal(activeWorkManagementOverviewFilterCount({
    date: "2026-06-09",
    minConfidence: "0.8",
    persistence: "persisted",
    project: " PromptVault ",
    source: "saved_extraction",
  }), 5);

  assert.deepEqual(
    filterWorkManagementOverviewRows(overview.rows, {
      date: "2026-06-09",
      minConfidence: "0.8",
      persistence: "persisted",
      project: "PromptVault",
      source: "saved_extraction",
    }).map((row) => row.key),
    ["2026-06-09::PromptVault"],
  );
  assert.deepEqual(
    filterWorkManagementOverviewRows(overview.rows, {
      date: "",
      minConfidence: "0.8",
      persistence: "",
      project: "",
      source: "extraction_proposal",
    }).map((row) => row.key),
    [],
  );
  assert.deepEqual(
    filterWorkManagementOverviewRows(overview.rows, {
      date: "",
      minConfidence: "0.7",
      persistence: "",
      project: "",
      source: "extraction_proposal",
    }).map((row) => row.key),
    ["2026-06-08::CareVault"],
  );
  assert.deepEqual(
    filterWorkManagementOverviewRows(overview.rows, {
      date: "",
      minConfidence: "",
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

test("work management overview sorting exposes audit-first row orders", () => {
  const coverage = coverageResult();
  const overview = buildWorkManagementOverview({
    coverage: {
      ...coverage,
      files: [
        ...coverage.files,
        {
          project: "OnlyProgress",
          source_path: "/Users/wj/Ai/System/10_Projects/OnlyProgress/working.md",
          source_file: "working.md",
          status: "parsed",
          work_item_count: 50,
          latest_date: "2026-06-01",
          latest_title: "Progress-only backlog",
          modified_at: "2026-06-09T01:40:00Z",
        },
      ],
    },
    extractionItems: extractionItemsResult(),
    extractionProposals: extractionProposalsResult(),
    snapshots: snapshotsResult(),
    summary: summaryResult(),
  });

  assert.deepEqual(
    sortWorkManagementOverviewRows(overview.rows, "date_desc").map((row) => row.key),
    [
      "2026-06-09::PromptVault",
      "2026-06-08::CareVault",
      "2026-06-04::RepoTutorStudio",
      "2026-06-01::OnlyProgress",
    ],
  );
  const actionOverview = buildWorkManagementOverview({
    coverage: {
      ...coverage,
      files: [
        ...coverage.files,
        {
          project: "OnlyProgress",
          source_path: "/Users/wj/Ai/System/10_Projects/OnlyProgress/working.md",
          source_file: "working.md",
          status: "parsed",
          work_item_count: 50,
          latest_date: "2026-06-01",
          latest_title: "Progress-only backlog",
          modified_at: "2026-06-09T01:40:00Z",
        },
      ],
    },
    extractionItems: extractionItemsResult(),
    normalizedItems: normalizedItemsResult(),
    statusExport: {
      ...statusExportResult(),
      rows: [
        ...statusExportResult().rows,
        {
          ...statusExportResult().rows[0],
          date: "2026-06-04",
          project: "RepoTutorStudio",
          top_titles: ["RepoTutorStudio low confidence saved row"],
          latest_source_path: "/Users/wj/Ai/System/10_Projects/RepoTutorStudio/working.md",
          latest_source_file: "working.md",
          session_evidence_count: 1,
          unique_session_evidence_count: 1,
          needs_session_evidence: false,
          needs_title_normalization: false,
        },
      ],
    },
  });
  assert.deepEqual(
    sortWorkManagementOverviewRows(actionOverview.rows, "review_action_first").map((row) => row.key),
    [
      "2026-06-08::CareVault",
      "2026-06-01::OnlyProgress",
      "2026-06-04::RepoTutorStudio",
      "2026-06-09::PromptVault",
    ],
  );
  assert.deepEqual(
    sortWorkManagementOverviewRows(overview.rows, "live_only_first").map((row) => row.key),
    [
      "2026-06-01::OnlyProgress",
      "2026-06-09::PromptVault",
      "2026-06-08::CareVault",
      "2026-06-04::RepoTutorStudio",
    ],
  );
  assert.deepEqual(
    sortWorkManagementOverviewRows(overview.rows, "missing_confidence_first").map((row) => row.key),
    [
      "2026-06-01::OnlyProgress",
      "2026-06-09::PromptVault",
      "2026-06-08::CareVault",
      "2026-06-04::RepoTutorStudio",
    ],
  );
  assert.deepEqual(
    sortWorkManagementOverviewRows(overview.rows, "low_confidence_first").map((row) => row.key),
    [
      "2026-06-04::RepoTutorStudio",
      "2026-06-08::CareVault",
      "2026-06-09::PromptVault",
      "2026-06-01::OnlyProgress",
    ],
  );
  assert.deepEqual(
    sortWorkManagementOverviewRows(overview.rows, "work_items_desc").map((row) => row.key),
    [
      "2026-06-01::OnlyProgress",
      "2026-06-09::PromptVault",
      "2026-06-08::CareVault",
      "2026-06-04::RepoTutorStudio",
    ],
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

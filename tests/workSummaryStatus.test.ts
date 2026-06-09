import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  canApproveWorkLogNormalizationReviewQueueItem,
  canRejectWorkLogNormalizationReviewQueueItem,
  workLogCandidatesActionLabel,
  workLogCandidatesFailureText,
  workLogCandidatesMetaText,
  workLogCandidateReviewLabel,
  workLogReviewQueueActionLabel,
  workLogReviewQueueFailureText,
  workLogReviewQueueItemStateText,
  workLogReviewQueueMetaText,
  workLogExtractionActionLabel,
  workLogExtractionFailureText,
  workLogExtractionItemsActionLabel,
  workLogExtractionItemsFailureText,
  workLogExtractionItemsMetaText,
  workLogExtractionRunsActionLabel,
  workLogExtractionRunsFailureText,
  workLogExtractionRunsMetaText,
  workLogNormalizationCandidatesActionLabel,
  workLogNormalizationCandidatesFailureText,
  workLogNormalizationCandidatesMetaText,
  workLogNormalizationProposalsActionLabel,
  workLogNormalizationProposalsFailureText,
  workLogNormalizationProposalsMetaText,
  workLogNormalizationProposalReviewLabel,
  workLogNormalizationApplyActionLabel,
  workLogNormalizationApplyFailureText,
  workLogNormalizationApplyMetaText,
  workLogNormalizationReviewQueueActionLabel,
  workLogNormalizationReviewQueueFailureText,
  workLogNormalizationReviewQueueItemStateText,
  workLogNormalizationReviewQueueMetaText,
  workLogExtractionMetaText,
  workLogExtractionApprovalText,
  workLogExtractionPersistenceText,
  workLogExtractionProviderNoticeText,
  workLogExtractionRejectionSummaryText,
  workLogExtractionReviewLabel,
  workLogExtractionSavedCandidateIds,
  workLogExtractionUnsavedAcceptedIds,
  filterWorkStatusExportRows,
  workLogProposalSaveStateText,
  workManagementFreezeActionLabel,
  workManagementRefreshActionLabel,
  workLogCoverageActionLabel,
  workLogCoverageFailureText,
  workLogCoverageMetaText,
  workSummaryActionLabel,
  workSummaryFailureText,
  workSummaryIndexStatusText,
  workSummaryMetaText,
  workSummaryPersistenceText,
  workStatusExportActionLabel,
  workStatusExportFilterMetaText,
  workStatusExportFailureText,
  workStatusExportIndexStatusText,
  workStatusExportMetaText,
  workStatusExportPageStatusText,
  workStatusExportRowAuditToggleText,
  workStatusExportRowFilterLabel,
  workStatusExportRowSessionSourcesText,
  workStatusExportRowSourceFilesText,
  workStatusExportRowSourceStatusesText,
  workStatusExportRowStatusText,
  workSummarySnapshotsActionLabel,
  workSummarySnapshotsFailureText,
  workSummarySnapshotsMetaText,
  workSummarySnapshotExtractionMergeText,
  workSummarySnapshotDetailToggleText,
  workSummarySnapshotDisplaySummaries,
  workSummarySnapshotSummaryOverflowText,
  workSummarySnapshotVisibleSummaries,
  type WorkLogCandidatesState,
  type WorkLogCoverageState,
  type WorkLogReviewQueueState,
  type WorkLogExtractionState,
  type WorkLogExtractionItemsState,
  type WorkLogExtractionRunsState,
  type WorkLogNormalizationCandidatesState,
  type WorkLogNormalizationApplyState,
  type WorkLogNormalizationProposalsState,
  type WorkLogNormalizationReviewQueueState,
  type WorkManagementFreezeState,
  type WorkManagementRefreshState,
  type WorkStatusExportState,
  type WorkSummarySnapshotsState,
  type WorkSummaryState,
} from "../src/workSummaryStatus.ts";
import type {
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionCandidate,
  ProjectWorkLogExtractionCandidatesResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposal,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkLogExtractionRunsResult,
  ProjectWorkLogNormalizationCandidatesResult,
  ProjectWorkLogNormalizationApplyResult,
  ProjectWorkLogNormalizationProposalsResult,
  ProjectWorkLogNormalizationReviewQueueResult,
  ProjectWorkLogReviewQueueItem,
  ProjectWorkLogReviewQueueResult,
  ProjectWorkSummary,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshot,
  ProjectWorkSummarySnapshotsResult,
  ProjectWorkStatusExportResult,
} from "../src/types.ts";

function lockState(overrides: Partial<ActionLockState> = {}): ActionLockState {
  return {
    importRunning: false,
    improvementRunning: false,
    planRunning: false,
    scanRunning: false,
    storedLoadRunning: false,
    workSummaryRunning: false,
    ...overrides,
  };
}

function summaryResult(overrides: Partial<ProjectWorkSummaryResult> = {}): ProjectWorkSummaryResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    provider: "local-citation-rules",
    used_ai: false,
    narrative_markdown: "- 2026-06-09 PromptVault: 요약",
    summaries: [],
    extraction_merge: null,
    persistence: null,
    report: {
      generated_at: "2026-06-09T00:00:00Z",
      total_items: 3532,
      project_count: 14,
      date_count: 16,
      files_seen: 32,
      items_by_date: [],
      items_by_project: [],
      session_scan_prompt_count: 20,
      session_scan_sources: [],
      session_evidence_count: 541,
      session_sources: [],
      session_evidence_unique_count: 11,
      session_evidence_unique_sources: [],
      session_evidence_index_used: true,
      session_evidence_index_updated: false,
      session_evidence_index_count: 20,
      session_evidence_mode: "metadata-first-raw-fallback",
      items: [],
      warnings: [],
    },
    warnings: [],
    ...overrides,
  };
}

function statusExportResult(overrides: Partial<ProjectWorkStatusExportResult> = {}): ProjectWorkStatusExportResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    markdown: "# PromptVault Project/Day Work Status",
    total_row_count: 4,
    row_offset: 1,
    returned_row_count: 2,
    next_row_offset: 3,
    rows_truncated: true,
    report_total_items: 10,
    report_project_count: 3,
    report_date_count: 2,
    report_files_seen: 4,
    report_session_scan_prompt_count: 20,
    report_session_evidence_count: 9,
    report_unique_session_evidence_count: 3,
    report_session_evidence_index_used: true,
    report_session_evidence_index_updated: false,
    report_session_evidence_index_count: 200,
    report_session_evidence_index_total_count: 500,
    report_session_evidence_mode: "metadata-first-raw-fallback",
    rows: [{
      date: "2026-06-09",
      project: "PromptVault",
      operational_status: "progress-log-only",
      source_statuses: [{ text: "done", count: 2 }],
      work_item_count: 2,
      source_file_count: 1,
      source_files: ["working.md"],
      top_titles: ["Status export"],
      sample_evidence: "Status export evidence",
      latest_source_path: "/Users/wj/Ai/System/10_Projects/PromptVault/working.md",
      latest_source_file: "working.md",
      session_evidence_count: 0,
      unique_session_evidence_count: 0,
      session_sources: [],
      needs_session_evidence: true,
      needs_title_normalization: true,
    }, {
      date: "2026-06-08",
      project: "CareVault",
      operational_status: "session-supported",
      source_statuses: [{ text: "done", count: 8 }],
      work_item_count: 8,
      source_file_count: 3,
      source_files: ["working.md", "workingd.md", "WORKLOG.md"],
      top_titles: ["CareVault session evidence"],
      sample_evidence: "CareVault evidence",
      latest_source_path: "/Users/wj/Ai/System/10_Projects/CareVault/workingd.md",
      latest_source_file: "workingd.md",
      session_evidence_count: 9,
      unique_session_evidence_count: 3,
      session_sources: [{ text: "Codex local sessions", count: 9 }],
      needs_session_evidence: false,
      needs_title_normalization: false,
    }],
    warnings: [],
    ...overrides,
  };
}

function snapshotsResult(overrides: Partial<ProjectWorkSummarySnapshotsResult> = {}): ProjectWorkSummarySnapshotsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_snapshots: 12,
    returned_snapshot_count: 5,
    available_dates: ["2026-06-09"],
    available_projects: ["PromptVault"],
    snapshots: [],
    warnings: [],
    ...overrides,
  };
}

function coverageResult(overrides: Partial<ProjectWorkLogCoverageResult> = {}): ProjectWorkLogCoverageResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    root_path: "/Users/wj/Ai/System/10_Projects",
    files_seen: 32,
    parsed_file_count: 28,
    unparsed_file_count: 4,
    project_count: 14,
    work_item_count: 3532,
    files: [],
    warnings: [],
    ...overrides,
  };
}

function candidatesResult(
  overrides: Partial<ProjectWorkLogExtractionCandidatesResult> = {},
): ProjectWorkLogExtractionCandidatesResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    root_path: "/Users/wj/Ai/System/10_Projects",
    files_seen: 32,
    skipped_parsed_file_count: 16,
    skipped_unreadable_file_count: 1,
    skipped_empty_file_count: 2,
    skipped_pointer_file_count: 1,
    review_queue_state: "needs_review",
    review_queue_reason: "mixed_safe_and_risk_blocked_candidates",
    pending_review_count: 13,
    safe_ai_candidate_count: 10,
    risk_blocked_candidate_count: 3,
    candidate_count: 13,
    candidates: [],
    warnings: [],
    ...overrides,
  };
}

function extractionCandidate(
  overrides: Partial<ProjectWorkLogExtractionCandidate> = {},
): ProjectWorkLogExtractionCandidate {
  return {
    candidate_id: "work-log-RepoTutorStudio-a1b2c3d4",
    project: "RepoTutorStudio",
    source_path: "/Users/wj/Ai/System/10_Projects/RepoTutorStudio/working.md",
    source_file: "working.md",
    reason: "unparsed_work_log",
    excerpt: "- 2026-06-04: Created project root.",
    line_count: 1,
    char_count: 36,
    risk_flags: [],
    modified_at: "2026-06-04T00:00:00Z",
    ...overrides,
  };
}

function reviewQueueResult(
  overrides: Partial<ProjectWorkLogReviewQueueResult> = {},
): ProjectWorkLogReviewQueueResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    synced_candidate_count: 13,
    stale_candidate_count: 2,
    total_items: 18,
    returned_item_count: 5,
    pending_ai_review_count: 10,
    risk_blocked_count: 3,
    stale_count: 2,
    approved_count: 2,
    rejected_count: 1,
    items: [],
    warnings: [],
    ...overrides,
  };
}

function reviewQueueItem(
  overrides: Partial<ProjectWorkLogReviewQueueItem> = {},
): ProjectWorkLogReviewQueueItem {
  return {
    candidate_id: "work-log-RepoTutorStudio-a1b2c3d4",
    first_seen_at: "2026-06-09T00:00:00Z",
    last_seen_at: "2026-06-09T00:00:00Z",
    review_state: "pending_ai_review",
    review_reason: "safe_ai_candidate_ready",
    provider_route: "ai_provider",
    project: "RepoTutorStudio",
    source_path: "/Users/wj/Ai/System/10_Projects/RepoTutorStudio/working.md",
    source_file: "working.md",
    candidate_reason: "missing_dated_heading",
    excerpt: "- 2026-06-04: Created project root.",
    line_count: 1,
    char_count: 36,
    risk_flags: [],
    modified_at: "2026-06-04T00:00:00Z",
    ...overrides,
  };
}

function extractionResult(
  overrides: Partial<ProjectWorkLogExtractionProposalsResult> = {},
): ProjectWorkLogExtractionProposalsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    root_path: "/Users/wj/Ai/System/10_Projects",
    provider: "glm",
    provider_model: "glm-test-model",
    provider_runtime: "glm-chat-completions",
    used_ai: true,
    candidate_count: 13,
    accepted_count: 3,
    rejected_count: 10,
    proposals: [],
    persistence: null,
    warnings: [],
    ...overrides,
  };
}

function extractionProposal(
  overrides: Partial<ProjectWorkLogExtractionProposal> = {},
): ProjectWorkLogExtractionProposal {
  return {
    candidate_id: "work-log-RepoTutorStudio-a1b2c3d4",
    project: "RepoTutorStudio",
    source_path: "/Users/wj/Ai/System/10_Projects/RepoTutorStudio/working.md",
    source_file: "working.md",
    date: "2026-06-04",
    title: "Created project root.",
    status: "completed",
    evidence: "- 2026-06-04: Created project root.",
    confidence: 0.72,
    accepted: true,
    rejection_reason: null,
    ...overrides,
  };
}

function extractionItemsResult(
  overrides: Partial<ProjectWorkLogExtractionItemsResult> = {},
): ProjectWorkLogExtractionItemsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_items: 12,
    returned_item_count: 5,
    available_dates: ["2026-06-04", "2026-06-09"],
    available_projects: ["CareVault", "PromptVault"],
    items: [],
    warnings: [],
    ...overrides,
  };
}

function extractionRunsResult(
  overrides: Partial<ProjectWorkLogExtractionRunsResult> = {},
): ProjectWorkLogExtractionRunsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_runs: 3,
    returned_run_count: 1,
    runs: [{
      id: 7,
      started_at: "2026-06-09T01:00:00Z",
      finished_at: "2026-06-09T01:00:02Z",
      trigger: "approved_review_queue",
      status: "completed",
      provider: "glm",
      provider_model: "glm-test-model",
      provider_runtime: "glm-chat-completions",
      used_ai: true,
      candidate_count: 2,
      accepted_count: 1,
      rejected_count: 1,
      saved_item_count: 1,
      total_saved_item_count: 12,
      candidate_ids: ["work-log-CareVault-a1"],
      warnings: [],
      error_message: null,
    }],
    warnings: [],
    ...overrides,
  };
}

function normalizationCandidatesResult(
  overrides: Partial<ProjectWorkLogNormalizationCandidatesResult> = {},
): ProjectWorkLogNormalizationCandidatesResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_candidate_count: 18,
    returned_candidate_count: 5,
    report_total_items: 120,
    report_project_count: 12,
    report_date_count: 9,
    candidates: [{
      candidate_id: "work-normalize-CareVault-a1",
      project: "CareVault",
      date: "2026-06-09",
      title: "Backfilled workingd notes",
      status: "current",
      source_path: "/tmp/CareVault/workingd.md",
      source_file: "workingd.md",
      reason: "no_ai_normalization,no_session_evidence",
      evidence: "Backfilled workingd notes",
      work_item_count: 3,
      session_evidence_count: 0,
      saved_extraction_count: 1,
      ai_saved_extraction_count: 0,
      best_ai_confidence: null,
      risk_flags: ["long_base64_like_token"],
    }],
    warnings: [],
    ...overrides,
  };
}

function normalizationProposalsResult(
  overrides: Partial<ProjectWorkLogNormalizationProposalsResult> = {},
): ProjectWorkLogNormalizationProposalsResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    provider: "local-normalization-rules",
    provider_model: null,
    provider_runtime: "local-normalization-rules",
    used_ai: false,
    total_candidate_count: 18,
    returned_proposal_count: 5,
    accepted_count: 1,
    rejected_count: 4,
    report_total_items: 120,
    report_project_count: 12,
    report_date_count: 9,
    proposals: [{
      candidate_id: "work-normalize-CareVault-a1",
      project: "CareVault",
      date: "2026-06-09",
      source_path: "/tmp/CareVault/workingd.md",
      source_file: "workingd.md",
      reason: "no_ai_normalization,no_session_evidence",
      original_title: "Backfilled workingd notes",
      original_status: "current",
      original_evidence: "Backfilled workingd notes",
      normalized_title: "Backfilled workingd notes",
      normalized_status: "current",
      normalized_evidence: "Backfilled workingd notes",
      confidence: 0.5,
      accepted: false,
      rejection_reason: "local_fallback_requires_ai_review",
      work_item_count: 3,
      session_evidence_count: 0,
      saved_extraction_count: 1,
      ai_saved_extraction_count: 0,
      best_ai_confidence: null,
      risk_flags: [],
    }],
    warnings: [],
    ...overrides,
  };
}

function normalizationReviewQueueResult(
  overrides: Partial<ProjectWorkLogNormalizationReviewQueueResult> = {},
): ProjectWorkLogNormalizationReviewQueueResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    synced_proposal_count: 5,
    stale_proposal_count: 1,
    total_items: 9,
    returned_item_count: 5,
    pending_review_count: 3,
    stale_count: 1,
    approved_count: 2,
    rejected_count: 3,
    accepted_proposal_count: 1,
    rejected_proposal_count: 8,
    items: [{
      ...normalizationProposalsResult().proposals[0],
      first_seen_at: "2026-06-09T00:00:00Z",
      last_seen_at: "2026-06-09T00:00:00Z",
      review_state: "pending_review",
      review_reason: "local_fallback_requires_ai_review",
      provider: "local-normalization-rules",
      provider_model: null,
      provider_runtime: "local-normalization-rules",
      used_ai: false,
    }],
    warnings: [],
    ...overrides,
  };
}

function normalizationApplyResult(
  overrides: Partial<ProjectWorkLogNormalizationApplyResult> = {},
): ProjectWorkLogNormalizationApplyResult {
  return {
    generated_at: "2026-06-09T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    approved_queue_count: 2,
    processed_queue_count: 2,
    applied_item_count: 1,
    skipped_existing_count: 1,
    total_applied_item_count: 6,
    returned_item_count: 5,
    items: [{
      ...normalizationProposalsResult().proposals[0],
      id: 3,
      applied_at: "2026-06-09T00:01:00Z",
      review_reason: "operator_approved_normalization",
      provider: "local-normalization-rules",
      provider_model: null,
      provider_runtime: "local-normalization-rules",
      used_ai: false,
    }],
    warnings: [],
    ...overrides,
  };
}

function snapshotSummary(overrides: Partial<ProjectWorkSummary> = {}): ProjectWorkSummary {
  return {
    date: "2026-06-09",
    project: "PromptVault",
    headline: "PromptVault: 작업 요약",
    work_item_count: 3,
    session_evidence_count: 2,
    unique_session_evidence_count: 1,
    citations: [],
    next_actions: [],
    ...overrides,
  };
}

function snapshot(overrides: Partial<ProjectWorkSummarySnapshot> = {}): ProjectWorkSummarySnapshot {
  return {
    id: 7,
    created_at: "2026-06-09T00:00:00Z",
    provider: "local-citation-rules",
    used_ai: false,
    narrative_markdown: "- 2026-06-09 PromptVault: 요약",
    total_items: 8,
    project_count: 2,
    date_count: 2,
    files_seen: 4,
    session_evidence_count: 3,
    session_evidence_unique_count: 2,
    summary_count: 4,
    summaries: [
      snapshotSummary({ date: "2026-06-09", project: "PromptVault" }),
      snapshotSummary({ date: "2026-06-09", project: "CareVault" }),
      snapshotSummary({ date: "2026-06-08", project: "PromptVault" }),
      snapshotSummary({ date: "2026-06-08", project: "SourceCollector" }),
    ],
    extraction_merge: null,
    warnings: [],
    ...overrides,
  };
}

test("work summary action label explains ready, loading, and locked states", () => {
  assert.equal(workSummaryActionLabel("idle", false, lockState()), "작업 요약 생성");
  assert.equal(workSummaryActionLabel("ready", true, lockState()), "작업 요약 새로고침");
  assert.equal(
    workSummaryActionLabel("loading", true, lockState({ workSummaryRunning: true })),
    "작업 요약 생성 중",
  );
  assert.equal(
    workSummaryActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 작업 요약을 새로고침할 수 없습니다",
  );
});

test("work status export action label explains ready, loading, and locked states", () => {
  const loading: WorkStatusExportState = "loading";
  assert.equal(
    workStatusExportActionLabel("idle", false, lockState()),
    "상태 export 생성",
  );
  assert.equal(
    workStatusExportActionLabel("ready", true, lockState()),
    "상태 export 새로고침",
  );
  assert.equal(
    workStatusExportActionLabel(loading, true, lockState({ workSummaryRunning: true })),
    "프로젝트/일별 상태 export 생성 중",
  );
  assert.equal(
    workStatusExportActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 프로젝트/일별 상태 export를 새로고침할 수 없습니다",
  );
});

test("work management refresh action label explains overview loading and locks", () => {
  const loading: WorkManagementRefreshState = "loading";
  assert.equal(
    workManagementRefreshActionLabel("idle", false, lockState()),
    "전체 작업 관리 불러오기",
  );
  assert.equal(
    workManagementRefreshActionLabel("ready", true, lockState()),
    "전체 작업 관리 새로고침",
  );
  assert.equal(
    workManagementRefreshActionLabel(loading, true, lockState({ workSummaryRunning: true })),
    "전체 작업 관리 새로고침 중",
  );
  assert.equal(
    workManagementRefreshActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 전체 작업 관리를 새로고침할 수 없습니다",
  );
});

test("work management freeze action label explains save state and locks", () => {
  const loading: WorkManagementFreezeState = "loading";
  assert.equal(
    workManagementFreezeActionLabel("idle", 3, lockState()),
    "live-only 작업 관리 row 3개를 저장 관리로 고정",
  );
  assert.equal(
    workManagementFreezeActionLabel(loading, 3, lockState({ workSummaryRunning: true })),
    "live-only 작업 관리 row 고정 저장 중",
  );
  assert.equal(
    workManagementFreezeActionLabel("ready", 0, lockState()),
    "고정 저장할 live-only 작업 관리 row가 없습니다",
  );
  assert.equal(
    workManagementFreezeActionLabel("ready", 3, lockState({ scanRunning: true })),
    "스캔 실행 중에는 live-only 작업 관리 row를 고정 저장할 수 없습니다",
  );
});

test("work summary status text uses report counts and index state", () => {
  const result = summaryResult();
  assert.equal(
    workSummaryMetaText("ready", result),
    "14개 프로젝트 · 16일 · 3,532개 작업 · 세션 근거 541건",
  );
  assert.equal(
    workSummaryMetaText("ready", summaryResult({
      extraction_merge: {
        provider: "glm",
        used_ai: true,
        candidate_count: 3,
        accepted_count: 1,
        rejected_count: 2,
        merged_item_count: 1,
        warnings: [],
      },
    })),
    "14개 프로젝트 · 16일 · 3,532개 작업 · 세션 근거 541건 · AI 병합 1개",
  );
  assert.equal(
    workSummaryMetaText("ready", summaryResult({
      extraction_merge: {
        provider: "saved-extraction-items",
        used_ai: false,
        candidate_count: 2,
        accepted_count: 2,
        rejected_count: 0,
        merged_item_count: 2,
        warnings: [],
      },
    })),
    "14개 프로젝트 · 16일 · 3,532개 작업 · 세션 근거 541건 · 저장 병합 2개",
  );
  assert.equal(workSummaryMetaText("loading", result), "작업 요약 생성 중");
  assert.equal(workSummaryMetaText("failed", null), "작업 요약을 사용할 수 없음");
  assert.equal(
    workSummaryIndexStatusText(result),
    "세션 인덱스 사용 · 근거 메타데이터 우선/raw fallback · 스캔 20개 · 보관 20개 · 매칭 541건 · 고유 11건",
  );
  assert.equal(
    workSummaryIndexStatusText(summaryResult({
      report: {
        ...result.report,
        session_evidence_index_used: false,
        session_evidence_index_updated: true,
      },
    })),
    "세션 인덱스 갱신 · 근거 메타데이터 우선/raw fallback · 스캔 20개 · 보관 20개 · 매칭 541건 · 고유 11건",
  );
  assert.equal(
    workSummaryIndexStatusText(summaryResult({
      report: {
        ...result.report,
        session_evidence_index_count: 0,
        session_evidence_index_used: false,
        session_evidence_index_updated: false,
      },
    })),
    "세션 직접 스캔 · 근거 메타데이터 우선/raw fallback · 스캔 20개 · 보관 0개 · 매칭 541건 · 고유 11건",
  );
});

test("work status export text exposes project day evidence coverage", () => {
  const result = statusExportResult();
  assert.equal(
    workStatusExportMetaText("ready", result),
    "표시 2행 · 3개 프로젝트 · 2일 · 작업 10개 · 진행로그 4개 · 세션 근거 9건 · 고유 3건 · 표시 제한",
  );
  assert.equal(
    workStatusExportPageStatusText(result),
    "상태 row 2-3 / 4행 · 다음 4행부터",
  );
  assert.equal(
    workStatusExportIndexStatusText(result),
    "세션 인덱스 사용 · 근거 메타데이터 우선/raw fallback · 스캔 20개 · 사용 200개 · 보관 총 500개 · 매칭 9건 · 고유 3건",
  );
  assert.equal(
    workStatusExportRowStatusText(result.rows[0]),
    "진행로그만 있음 · 작업 2개 · 파일 1개 · 세션 0건 · 고유 0건 · 세션 근거 필요 · 제목 정규화 필요",
  );
  assert.equal(
    workStatusExportRowAuditToggleText(result.rows[0], false),
    "PromptVault 2026-06-09 상태 export 근거 펼치기",
  );
  assert.equal(
    workStatusExportRowAuditToggleText(result.rows[0], true),
    "PromptVault 2026-06-09 상태 export 근거 접기",
  );
  assert.equal(
    workStatusExportRowSourceFilesText(result.rows[1]),
    "진행로그 3개 · working.md, workingd.md, WORKLOG.md",
  );
  assert.equal(workStatusExportRowSourceStatusesText(result.rows[0]), "진행 상태 · done 2건");
  assert.equal(workStatusExportRowSessionSourcesText(result.rows[0]), "매칭된 세션 근거 없음");
  assert.equal(
    workStatusExportRowSessionSourcesText(result.rows[1]),
    "세션 소스 · Codex local sessions 9건 · 고유 3건",
  );
  assert.equal(workStatusExportRowFilterLabel("needs-session-evidence"), "세션 근거 필요");
  assert.deepEqual(
    filterWorkStatusExportRows(result.rows, "needs-session-evidence").map((row) => row.project),
    ["PromptVault"],
  );
  assert.deepEqual(
    filterWorkStatusExportRows(result.rows, "session-supported").map((row) => row.project),
    ["CareVault"],
  );
  assert.equal(
    workStatusExportFilterMetaText(
      "needs-session-evidence",
      result.rows,
      filterWorkStatusExportRows(result.rows, "needs-session-evidence"),
    ),
    "필터 세션 근거 필요 · 결과 1 / 2행 · 세션근거 필요 1행 · 제목정규화 필요 1행",
  );
  assert.equal(workStatusExportMetaText("loading", result), "프로젝트/일별 상태 export 생성 중");
  assert.equal(workStatusExportMetaText("failed", null), "상태 export를 사용할 수 없음");
  assert.equal(
    workStatusExportFailureText("failed"),
    "프로젝트/일별 상태 export를 불러오지 못했습니다. 진행 로그, 세션 인덱스, 브리지 상태를 확인하세요.",
  );
  assert.equal(workStatusExportFailureText("ready"), null);
});

test("work summary persistence text is only shown after snapshot saves", () => {
  assert.equal(workSummaryPersistenceText(summaryResult()), null);
  assert.equal(
    workSummaryPersistenceText(summaryResult({
      persistence: {
        database_path: "/tmp/promptvault.sqlite",
        snapshot_id: 12,
        snapshot_count: 15,
      },
    })),
    "/tmp/promptvault.sqlite · 스냅샷 #12 저장 · 총 15개",
  );
});

test("work summary snapshot extraction merge text is only shown for merge snapshots", () => {
  assert.equal(workSummarySnapshotExtractionMergeText(snapshot()), null);
  assert.equal(
    workSummarySnapshotExtractionMergeText(snapshot({
      extraction_merge: {
        provider: "glm",
        used_ai: true,
        candidate_count: 3,
        accepted_count: 1,
        rejected_count: 2,
        merged_item_count: 1,
        warnings: [],
      },
    })),
    "AI 병합 1개",
  );
  assert.equal(
    workSummarySnapshotExtractionMergeText(snapshot({
      extraction_merge: {
        provider: "saved-extraction-items",
        used_ai: false,
        candidate_count: 2,
        accepted_count: 2,
        rejected_count: 0,
        merged_item_count: 2,
        warnings: [],
      },
    })),
    "저장 병합 2개",
  );
});

test("work summary failure text is only shown after failed loads", () => {
  const failed: WorkSummaryState = "failed";
  assert.equal(
    workSummaryFailureText(failed),
    "프로젝트 작업 요약을 불러오지 못했습니다. 브리지 상태나 진행 로그 스캔 범위를 확인하세요.",
  );
  assert.equal(workSummaryFailureText("ready"), null);
});

test("work summary snapshot labels explain history state and locks", () => {
  assert.equal(
    workSummarySnapshotsActionLabel("idle", false, lockState()),
    "작업 요약 스냅샷 기록 불러오기",
  );
  assert.equal(
    workSummarySnapshotsActionLabel("ready", true, lockState()),
    "작업 요약 스냅샷 기록 새로고침",
  );
  assert.equal(
    workSummarySnapshotsActionLabel("loading", true, lockState({ workSummaryRunning: true })),
    "작업 요약 스냅샷 기록 불러오는 중",
  );
  assert.equal(
    workSummarySnapshotsActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 작업 요약 스냅샷 기록을 새로고침할 수 없습니다",
  );
});

test("work summary snapshot meta and failure text describe saved history", () => {
  const failed: WorkSummarySnapshotsState = "failed";
  assert.equal(workSummarySnapshotsMetaText("idle", null), "아직 불러온 스냅샷 기록 없음");
  assert.equal(workSummarySnapshotsMetaText("loading", snapshotsResult()), "스냅샷 기록 불러오는 중");
  assert.equal(workSummarySnapshotsMetaText("ready", snapshotsResult()), "저장 12개 · 표시 5개");
  assert.equal(workSummarySnapshotsMetaText(failed, null), "스냅샷 기록을 사용할 수 없음");
  assert.equal(
    workSummarySnapshotsFailureText(failed),
    "저장된 프로젝트 작업 요약 스냅샷을 불러오지 못했습니다. 브리지 상태나 데이터베이스 경로를 확인하세요.",
  );
  assert.equal(workSummarySnapshotsFailureText("ready"), null);
});

test("work log coverage labels describe parsed and unparsed progress logs", () => {
  const failed: WorkLogCoverageState = "failed";
  assert.equal(workLogCoverageActionLabel("idle", false, lockState()), "작업 로그 범위 확인");
  assert.equal(workLogCoverageActionLabel("ready", true, lockState()), "작업 로그 범위 새로고침");
  assert.equal(
    workLogCoverageActionLabel("loading", true, lockState({ workSummaryRunning: true })),
    "작업 로그 범위 확인 중",
  );
  assert.equal(
    workLogCoverageActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 작업 로그 범위를 새로고침할 수 없습니다",
  );
  assert.equal(workLogCoverageMetaText("idle", null), "아직 확인한 작업 로그 범위 없음");
  assert.equal(workLogCoverageMetaText("loading", coverageResult()), "작업 로그 범위 확인 중");
  assert.equal(
    workLogCoverageMetaText("ready", coverageResult()),
    "32개 로그 · parsed 28개 · unparsed 4개 · 14개 프로젝트 · 작업 3,532개",
  );
  assert.equal(workLogCoverageMetaText(failed, null), "작업 로그 범위를 사용할 수 없음");
  assert.equal(
    workLogCoverageFailureText(failed),
    "프로젝트 작업 로그 범위를 불러오지 못했습니다. 진행 로그 경로나 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogCoverageFailureText("ready"), null);
});

test("work log candidate labels describe AI extraction inputs", () => {
  const failed: WorkLogCandidatesState = "failed";
  assert.equal(workLogCandidatesActionLabel("idle", false, lockState()), "AI 추출 후보 확인");
  assert.equal(workLogCandidatesActionLabel("ready", true, lockState()), "AI 추출 후보 새로고침");
  assert.equal(
    workLogCandidatesActionLabel("loading", true, lockState({ workSummaryRunning: true })),
    "AI 추출 후보 확인 중",
  );
  assert.equal(
    workLogCandidatesActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 AI 추출 후보를 새로고침할 수 없습니다",
  );
  assert.equal(workLogCandidatesMetaText("idle", null), "아직 확인한 AI 추출 후보 없음");
  assert.equal(workLogCandidatesMetaText("loading", candidatesResult()), "AI 추출 후보 확인 중");
  assert.equal(
    workLogCandidatesMetaText("ready", candidatesResult()),
    "백필큐 검토 필요 · 이유 AI/로컬 검토 혼합 · pending 13개 · AI 전송가능 10개 · 위험차단 3개 · parsed 제외 16개 · unreadable 1개 · empty 2개 · pointer 1개",
  );
  assert.equal(
    workLogCandidatesMetaText("ready", candidatesResult({
      review_queue_state: "empty",
      review_queue_reason: "no_unparsed_progress_logs",
      pending_review_count: 0,
      safe_ai_candidate_count: 0,
      risk_blocked_candidate_count: 0,
      candidate_count: 0,
    })),
    "백필큐 비어 있음 · 이유 unparsed 없음 · pending 0개 · AI 전송가능 0개 · 위험차단 0개 · parsed 제외 16개 · unreadable 1개 · empty 2개 · pointer 1개",
  );
  assert.equal(workLogCandidatesMetaText(failed, null), "AI 추출 후보를 사용할 수 없음");
  assert.equal(
    workLogCandidatesFailureText(failed),
    "AI 추출 후보를 불러오지 못했습니다. 진행 로그 경로나 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogCandidatesFailureText("ready"), null);
});

test("work log candidate review labels expose candidate handling expectations", () => {
  assert.equal(
    workLogCandidateReviewLabel(extractionCandidate()),
    "AI 검토 가능 · 로컬 날짜 bullet 탐색",
  );
  assert.equal(
    workLogCandidateReviewLabel(extractionCandidate({ risk_flags: ["long_base64_like_token"] })),
    "문서 위험 패턴 있음 · 줄 단위 안전 추출만 허용: 긴 토큰 형식 문자열",
  );
});

test("work log review queue labels describe persisted candidate state", () => {
  const failed: WorkLogReviewQueueState = "failed";
  assert.equal(workLogReviewQueueActionLabel("idle", false, lockState()), "백필큐 동기화");
  assert.equal(workLogReviewQueueActionLabel("ready", true, lockState()), "백필큐 새로고침");
  assert.equal(
    workLogReviewQueueActionLabel("loading", true, lockState({ workSummaryRunning: true })),
    "백필큐 동기화 중",
  );
  assert.equal(
    workLogReviewQueueActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 백필큐를 새로고침할 수 없습니다",
  );
  assert.equal(workLogReviewQueueMetaText("idle", null), "아직 동기화한 백필큐 없음");
  assert.equal(workLogReviewQueueMetaText("loading", reviewQueueResult()), "백필큐 동기화 중");
  assert.equal(
    workLogReviewQueueMetaText("ready", reviewQueueResult()),
    "큐 저장 18개 · 표시 5개 · 동기화 13개 · stale 전환 2개 · AI 대기 10개 · 위험차단 3개 · stale 2개 · 승인 2개 · 거절 1개",
  );
  assert.equal(workLogReviewQueueMetaText(failed, null), "백필큐를 사용할 수 없음");
  assert.equal(
    workLogReviewQueueFailureText(failed),
    "백필큐를 동기화하지 못했습니다. 데이터베이스 경로, 진행 로그 후보, 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogReviewQueueFailureText("ready"), null);
  assert.equal(
    workLogReviewQueueItemStateText(reviewQueueItem()),
    "AI 검토 대기 · AI provider 전송 가능",
  );
  assert.equal(
    workLogReviewQueueItemStateText(reviewQueueItem({
      review_state: "risk_blocked",
      review_reason: "risk_flags_require_local_review",
    })),
    "위험 차단 · 위험 패턴으로 로컬 검토 필요",
  );
  assert.equal(
    workLogReviewQueueItemStateText(reviewQueueItem({
      review_state: "approved",
      review_reason: "operator_approved_for_backfill",
    })),
    "승인됨 · 운영자가 백필 검토 승인",
  );
  assert.equal(
    workLogReviewQueueItemStateText(reviewQueueItem({
      review_state: "rejected",
      review_reason: "operator_rejected_from_backfill",
    })),
    "거절됨 · 운영자가 백필 검토 거절",
  );
});

test("work log extraction labels describe accepted and rejected AI proposals", () => {
  const failed: WorkLogExtractionState = "failed";
  assert.equal(workLogExtractionActionLabel("idle", false, lockState()), "AI 작업 추출 제안");
  assert.equal(workLogExtractionActionLabel("ready", true, lockState()), "AI 작업 추출 제안 새로고침");
  assert.equal(
    workLogExtractionActionLabel("idle", false, lockState(), "local"),
    "로컬 작업 추출 제안",
  );
  assert.equal(
    workLogExtractionActionLabel("ready", true, lockState(), "local"),
    "로컬 작업 추출 제안 새로고침",
  );
  assert.equal(
    workLogExtractionActionLabel("loading", true, lockState({ workSummaryRunning: true })),
    "AI 작업 추출 제안 생성 중",
  );
  assert.equal(
    workLogExtractionActionLabel("loading", true, lockState({ workSummaryRunning: true }), "local"),
    "로컬 작업 추출 제안 생성 중",
  );
  assert.equal(
    workLogExtractionActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 AI 작업 추출 제안을 새로고침할 수 없습니다",
  );
  assert.equal(
    workLogExtractionActionLabel("ready", true, lockState({ scanRunning: true }), "local"),
    "스캔 실행 중에는 로컬 작업 추출 제안을 새로고침할 수 없습니다",
  );
  assert.equal(workLogExtractionMetaText("idle", null), "아직 생성한 AI 작업 추출 제안 없음");
  assert.equal(workLogExtractionMetaText("loading", extractionResult()), "AI 작업 추출 제안 생성 중");
  assert.equal(
    workLogExtractionMetaText("idle", null, "local"),
    "아직 생성한 로컬 작업 추출 제안 없음",
  );
  assert.equal(
    workLogExtractionMetaText("loading", extractionResult(), "local"),
    "로컬 작업 추출 제안 생성 중",
  );
  assert.equal(
    workLogExtractionMetaText("ready", extractionResult()),
    "AI glm · glm-chat-completions · model glm-test-model · 후보 13개 · accepted 3개 · rejected 10개",
  );
  assert.equal(
    workLogExtractionMetaText("ready", extractionResult({
      used_ai: false,
      provider: "local-extraction-rules",
      provider_model: null,
      provider_runtime: "local-extraction-rules",
    })),
    "로컬 local-extraction-rules · 후보 13개 · accepted 3개 · rejected 10개",
  );
  assert.equal(workLogExtractionMetaText(failed, null), "AI 작업 추출 제안을 사용할 수 없음");
  assert.equal(
    workLogExtractionFailureText(failed),
    "AI 작업 추출 제안을 불러오지 못했습니다. provider 설정, 진행 로그 경로, 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogExtractionFailureText("ready"), null);
});

test("work log extraction provider notice exposes fallback warnings", () => {
  assert.equal(workLogExtractionProviderNoticeText(null), null);
  assert.equal(workLogExtractionProviderNoticeText(extractionResult()), null);
  assert.equal(
    workLogExtractionProviderNoticeText(extractionResult({
      provider: "local-extraction-rules",
      used_ai: false,
      warnings: [
        "OpenAI work-log extraction 요청 실패: timeout; 다음 provider 또는 로컬 fallback을 사용합니다.",
        "GLM work-log extraction 요청 실패: timeout; 로컬 fallback을 사용했습니다.",
      ],
    })),
    "로컬 fallback 사용 · 경고 2개",
  );
  assert.equal(
    workLogExtractionProviderNoticeText(
      extractionResult({
        provider: "local-extraction-rules",
        used_ai: false,
        warnings: ["AI 추출이 비활성화되어 로컬 검토 후보만 반환했습니다."],
      }),
      "local",
    ),
    "로컬 추출 사용 · 경고 1개",
  );
  assert.equal(
    workLogExtractionProviderNoticeText(extractionResult({
      provider: "local-extraction-rules",
      used_ai: false,
      candidate_count: 0,
      accepted_count: 0,
      rejected_count: 0,
      proposals: [],
      warnings: ["AI 추출 후보가 0개라 OpenAI/GLM provider 호출을 생략했습니다."],
    })),
    "로컬 fallback 사용 · 경고 1개",
  );
  assert.equal(
    workLogExtractionProviderNoticeText(extractionResult({
      provider: "glm",
      used_ai: true,
      warnings: ["OpenAI work-log extraction 요청 실패: timeout; 다음 provider를 사용합니다."],
    })),
    "AI glm 사용 · 경고 1개",
  );
});

test("work log extraction review labels expose saved, AI-review, and skipped outcomes", () => {
  const localResult = extractionResult({ provider: "local-extraction-rules", used_ai: false });
  const aiResult = extractionResult({ provider: "glm", used_ai: true });

  assert.equal(
    workLogExtractionReviewLabel(extractionProposal(), localResult),
    "로컬 규칙 저장 가능",
  );
  assert.equal(
    workLogExtractionReviewLabel(extractionProposal(), aiResult),
    "AI 검증 저장 가능",
  );
  assert.equal(
    workLogExtractionReviewLabel(
      extractionProposal({ accepted: false, date: null, rejection_reason: "local_fallback_requires_ai_review" }),
      localResult,
    ),
    "AI 검토 필요 · 로컬 확정 불가",
  );
  assert.equal(
    workLogExtractionReviewLabel(
      extractionProposal({ accepted: false, date: null, rejection_reason: "candidate_has_risk_flags" }),
      localResult,
    ),
    "건너뜀 · 위험 패턴 포함",
  );
  assert.equal(
    workLogExtractionReviewLabel(
      extractionProposal({ accepted: false, date: null, rejection_reason: "evidence_not_in_source" }),
      aiResult,
    ),
    "검증 실패 · 근거가 원문에 없음",
  );
});

test("work log extraction persistence text is only shown after accepted proposals are saved", () => {
  assert.equal(workLogExtractionPersistenceText(extractionResult()), null);
  assert.equal(
    workLogExtractionPersistenceText(extractionResult({
      persistence: {
        database_path: "/tmp/promptvault.sqlite",
        saved_item_count: 1,
        total_saved_item_count: 3,
      },
    })),
    "accepted 제안 1개 저장 · 총 3개",
  );
});

test("work log extraction approval text separates pending and persisted rows", () => {
  assert.equal(workLogExtractionApprovalText(null, 0), null);
  assert.equal(
    workLogExtractionApprovalText(extractionResult(), 3),
    "저장 대기 3개 / accepted 3개",
  );
  assert.equal(
    workLogExtractionApprovalText(extractionResult({ accepted_count: 0 }), 0),
    "저장 대기 0개 / accepted 0개",
  );
  assert.equal(
    workLogExtractionApprovalText(
      extractionResult({
        persistence: {
          database_path: "/tmp/promptvault.sqlite",
          saved_item_count: 2,
          total_saved_item_count: 5,
        },
      }),
      1,
    ),
    "저장 완료 2개 · 저장 대기 1개 / accepted 3개",
  );
});

test("work log extraction rejection summary groups blocked proposals by reason", () => {
  assert.equal(workLogExtractionRejectionSummaryText(null), null);
  assert.equal(workLogExtractionRejectionSummaryText(extractionResult({ rejected_count: 0 })), null);
  assert.equal(
    workLogExtractionRejectionSummaryText(extractionResult({
      accepted_count: 1,
      rejected_count: 4,
      proposals: [
        extractionProposal(),
        extractionProposal({
          accepted: false,
          date: null,
          rejection_reason: "local_fallback_requires_ai_review",
        }),
        extractionProposal({
          accepted: false,
          date: null,
          rejection_reason: "candidate_has_risk_flags",
        }),
        extractionProposal({
          accepted: false,
          date: null,
          rejection_reason: "candidate_has_risk_flags",
        }),
        extractionProposal({
          accepted: false,
          date: null,
          rejection_reason: "candidate_has_risk_flags",
        }),
      ],
    })),
    "보류 사유 AI 검토 필요 1개 · 위험 제외 3개",
  );
  assert.equal(
    workLogExtractionRejectionSummaryText(extractionResult({
      accepted_count: 0,
      rejected_count: 2,
      proposals: [
        extractionProposal({ accepted: false, date: null, rejection_reason: "missing_date" }),
        extractionProposal({ accepted: false, date: null, rejection_reason: null }),
      ],
    })),
    "보류 사유 검증 실패 1개 · 거절 사유 없음 1개",
  );
});

test("saved work log extraction item labels describe managed extraction rows", () => {
  const failed: WorkLogExtractionItemsState = "failed";
  assert.equal(workLogExtractionItemsActionLabel("idle", false, lockState()), "저장된 추출 작업 보기");
  assert.equal(
    workLogExtractionItemsActionLabel("ready", true, lockState()),
    "저장된 추출 작업 새로고침",
  );
  assert.equal(
    workLogExtractionItemsActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 저장된 추출 작업을 새로고침할 수 없습니다",
  );
  assert.equal(workLogExtractionItemsMetaText("idle", null), "아직 불러온 저장 추출 작업 없음");
  assert.equal(workLogExtractionItemsMetaText("loading", extractionItemsResult()), "저장 추출 작업 불러오는 중");
  assert.equal(
    workLogExtractionItemsMetaText("ready", extractionItemsResult()),
    "저장 12개 · 표시 5개 · 2일 · 2개 프로젝트",
  );
  assert.equal(workLogExtractionItemsMetaText(failed, null), "저장 추출 작업을 사용할 수 없음");
  assert.equal(
    workLogExtractionItemsFailureText(failed),
    "저장된 AI 작업 추출 항목을 불러오지 못했습니다. 데이터베이스 경로나 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogExtractionItemsFailureText("ready"), null);
});

test("work log extraction run labels describe approved queue audit history", () => {
  const failed: WorkLogExtractionRunsState = "failed";
  assert.equal(workLogExtractionRunsActionLabel("idle", false, lockState()), "실행 이력");
  assert.equal(
    workLogExtractionRunsActionLabel("ready", true, lockState()),
    "작업 추출 실행 이력 새로고침",
  );
  assert.equal(
    workLogExtractionRunsActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 작업 추출 실행 이력을 새로고침할 수 없습니다",
  );
  assert.equal(workLogExtractionRunsMetaText("idle", null), "아직 불러온 작업 추출 실행 이력 없음");
  assert.equal(
    workLogExtractionRunsMetaText("loading", extractionRunsResult()),
    "작업 추출 실행 이력 불러오는 중",
  );
  assert.equal(
    workLogExtractionRunsMetaText("ready", extractionRunsResult()),
    "실행 3개 · 표시 1개 · 최근 approved_review_queue · completed · saved 1개",
  );
  assert.equal(workLogExtractionRunsMetaText(failed, null), "작업 추출 실행 이력을 사용할 수 없음");
  assert.equal(
    workLogExtractionRunsFailureText(failed),
    "작업 추출 실행 이력을 불러오지 못했습니다. 데이터베이스 경로나 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogExtractionRunsFailureText("ready"), null);
});

test("work log normalization candidate labels describe parsed rows needing AI cleanup", () => {
  const failed: WorkLogNormalizationCandidatesState = "failed";
  assert.equal(
    workLogNormalizationCandidatesActionLabel("idle", false, lockState()),
    "AI 정규화 후보 확인",
  );
  assert.equal(
    workLogNormalizationCandidatesActionLabel("ready", true, lockState()),
    "AI 정규화 후보 새로고침",
  );
  assert.equal(
    workLogNormalizationCandidatesActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 AI 정규화 후보를 새로고침할 수 없습니다",
  );
  assert.equal(
    workLogNormalizationCandidatesMetaText("idle", null),
    "아직 확인한 AI 정규화 후보 없음",
  );
  assert.equal(
    workLogNormalizationCandidatesMetaText("loading", normalizationCandidatesResult()),
    "AI 정규화 후보 확인 중",
  );
  assert.equal(
    workLogNormalizationCandidatesMetaText("ready", normalizationCandidatesResult()),
    "정규화 후보 18개 · 표시 5개 · 원본 작업 120개 · 12개 프로젝트 · 9일 · 위험표시 1개",
  );
  assert.equal(
    workLogNormalizationCandidatesMetaText(failed, null),
    "AI 정규화 후보를 사용할 수 없음",
  );
  assert.equal(
    workLogNormalizationCandidatesFailureText(failed),
    "AI 정규화 후보를 불러오지 못했습니다. 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogNormalizationCandidatesFailureText("ready"), null);
});

test("work log normalization proposal labels describe AI cleanup proposals", () => {
  const failed: WorkLogNormalizationProposalsState = "failed";
  assert.equal(
    workLogNormalizationProposalsActionLabel("idle", false, lockState()),
    "AI 정규화 제안 생성",
  );
  assert.equal(
    workLogNormalizationProposalsActionLabel("ready", true, lockState()),
    "AI 정규화 제안 새로고침",
  );
  assert.equal(
    workLogNormalizationProposalsActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 AI 정규화 제안을 새로고침할 수 없습니다",
  );
  assert.equal(
    workLogNormalizationProposalsMetaText("idle", null),
    "아직 생성한 AI 정규화 제안 없음",
  );
  assert.equal(
    workLogNormalizationProposalsMetaText("loading", normalizationProposalsResult()),
    "AI 정규화 제안 생성 중",
  );
  assert.equal(
    workLogNormalizationProposalsMetaText("ready", normalizationProposalsResult()),
    "정규화 제안 5개 · accepted 1개 · review 4개 · 후보 18개 · local-normalization-rules · 12개 프로젝트 · 9일",
  );
  assert.equal(
    workLogNormalizationProposalsMetaText(failed, null),
    "AI 정규화 제안을 사용할 수 없음",
  );
  assert.equal(
    workLogNormalizationProposalsFailureText(failed),
    "AI 정규화 제안을 생성하지 못했습니다. provider 키, 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogNormalizationProposalsFailureText("ready"), null);
  assert.equal(
    workLogNormalizationProposalReviewLabel(normalizationProposalsResult().proposals[0]),
    "AI 검토 필요 · 로컬 확정 불가",
  );
  assert.equal(
    workLogNormalizationProposalReviewLabel({
      ...normalizationProposalsResult().proposals[0],
      rejection_reason: "low_confidence",
    }),
    "검증 실패 · confidence 낮음",
  );
  assert.equal(
    workLogNormalizationProposalReviewLabel({
      ...normalizationProposalsResult().proposals[0],
      rejection_reason: "evidence_not_in_candidate_evidence",
    }),
    "검증 실패 · 근거가 후보 원문에 없음",
  );
});

test("work log normalization review queue labels describe persisted review rows", () => {
  const failed: WorkLogNormalizationReviewQueueState = "failed";
  assert.equal(
    workLogNormalizationReviewQueueActionLabel("idle", false, lockState()),
    "정규화 검토 큐 동기화",
  );
  assert.equal(
    workLogNormalizationReviewQueueActionLabel("ready", true, lockState()),
    "정규화 검토 큐 새로고침",
  );
  assert.equal(
    workLogNormalizationReviewQueueActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 정규화 검토 큐를 새로고침할 수 없습니다",
  );
  assert.equal(
    workLogNormalizationReviewQueueMetaText("idle", null),
    "아직 동기화한 정규화 검토 큐 없음",
  );
  assert.equal(
    workLogNormalizationReviewQueueMetaText("loading", normalizationReviewQueueResult()),
    "정규화 검토 큐 동기화 중",
  );
  assert.equal(
    workLogNormalizationReviewQueueMetaText("ready", normalizationReviewQueueResult()),
    "정규화 큐 저장 9개 · 표시 5개 · 동기화 5개 · stale 전환 1개 · 검토 3개 · stale 1개 · 승인 2개 · 거절 3개 · AI accepted 1개 · review 8개",
  );
  assert.equal(
    workLogNormalizationReviewQueueMetaText(failed, null),
    "정규화 검토 큐를 사용할 수 없음",
  );
  assert.equal(
    workLogNormalizationReviewQueueFailureText(failed),
    "정규화 검토 큐를 동기화하지 못했습니다. 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogNormalizationReviewQueueFailureText("ready"), null);
  assert.equal(
    workLogNormalizationReviewQueueItemStateText(normalizationReviewQueueResult().items[0]),
    "검토 대기 · local_fallback_requires_ai_review · AI 검토 필요 · 로컬 확정 불가 · local-normalization-rules · confidence 0.50",
  );
  assert.equal(
    workLogNormalizationReviewQueueItemStateText({
      ...normalizationReviewQueueResult().items[0],
      review_reason: "low_confidence",
      rejection_reason: "low_confidence",
      provider: "glm",
      provider_model: "glm-test-model",
      provider_runtime: "glm-chat-completions",
      used_ai: true,
      confidence: 0.79,
    }),
    "검토 대기 · low_confidence · 검증 실패 · confidence 낮음 · glm/glm-test-model · confidence 0.79",
  );
  assert.equal(
    workLogNormalizationReviewQueueItemStateText({
      ...normalizationReviewQueueResult().items[0],
      review_reason: "evidence_not_in_candidate_evidence",
      rejection_reason: "evidence_not_in_candidate_evidence",
      provider: "glm",
      provider_model: "glm-test-model",
      provider_runtime: "glm-chat-completions",
      used_ai: true,
      confidence: 0.95,
    }),
    "검토 대기 · evidence_not_in_candidate_evidence · 검증 실패 · 근거가 후보 원문에 없음 · glm/glm-test-model · confidence 0.95",
  );
  assert.equal(
    workLogNormalizationReviewQueueItemStateText({
      ...normalizationReviewQueueResult().items[0],
      review_state: "approved",
      review_reason: "operator_approved_normalization",
      accepted: true,
      rejection_reason: null,
      provider: "glm",
      provider_model: "glm-test-model",
      provider_runtime: "glm-chat-completions",
      used_ai: true,
    }),
    "승인됨 · operator_approved_normalization · AI accepted · glm/glm-test-model · confidence 0.50",
  );
});

test("work log normalization review queue actions keep stale rows approval-safe", () => {
  const pending = normalizationReviewQueueResult().items[0];
  const stale = { ...pending, review_state: "stale" as const };
  const approved = { ...pending, review_state: "approved" as const };
  const rejected = { ...pending, review_state: "rejected" as const };

  assert.equal(canApproveWorkLogNormalizationReviewQueueItem(pending), true);
  assert.equal(canRejectWorkLogNormalizationReviewQueueItem(pending), true);
  assert.equal(canApproveWorkLogNormalizationReviewQueueItem(stale), false);
  assert.equal(canRejectWorkLogNormalizationReviewQueueItem(stale), true);
  assert.equal(canApproveWorkLogNormalizationReviewQueueItem(approved), false);
  assert.equal(canRejectWorkLogNormalizationReviewQueueItem(approved), false);
  assert.equal(canApproveWorkLogNormalizationReviewQueueItem(rejected), false);
  assert.equal(canRejectWorkLogNormalizationReviewQueueItem(rejected), false);
});

test("work log normalization apply labels describe durable approved rows", () => {
  const failed: WorkLogNormalizationApplyState = "failed";
  assert.equal(
    workLogNormalizationApplyActionLabel("idle", false, lockState()),
    "승인된 정규화 큐 row가 없어 적용할 수 없습니다",
  );
  assert.equal(
    workLogNormalizationApplyActionLabel("ready", true, lockState()),
    "승인된 정규화 큐 row를 durable table에 적용",
  );
  assert.equal(
    workLogNormalizationApplyActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 승인된 정규화 row를 적용할 수 없습니다",
  );
  assert.equal(
    workLogNormalizationApplyMetaText("idle", null),
    "아직 적용한 승인 정규화 row 없음",
  );
  assert.equal(
    workLogNormalizationApplyMetaText("loading", normalizationApplyResult()),
    "승인된 정규화 row 적용 중",
  );
  assert.equal(
    workLogNormalizationApplyMetaText("ready", normalizationApplyResult()),
    "승인 큐 2개 · 처리 2개 · 적용 1개 · 중복 1개 · 저장 총 6개 · 표시 5개",
  );
  assert.equal(
    workLogNormalizationApplyMetaText(failed, null),
    "정규화 적용 결과를 사용할 수 없음",
  );
  assert.equal(
    workLogNormalizationApplyFailureText(failed),
    "승인된 정규화 row를 durable table에 적용하지 못했습니다. 데이터베이스 경로, 승인 큐 상태, 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogNormalizationApplyFailureText("ready"), null);
});

test("work log extraction save state excludes already managed rows", () => {
  const proposals = extractionResult({
    accepted_count: 2,
    rejected_count: 1,
    proposals: [
      extractionProposal({ candidate_id: "work-log-PromptVault-saved" }),
      extractionProposal({ candidate_id: "work-log-CareVault-unsaved" }),
      extractionProposal({
        accepted: false,
        candidate_id: "work-log-CareVault-rejected",
        date: null,
        rejection_reason: "missing_date",
      }),
    ],
  });
  const savedIds = workLogExtractionSavedCandidateIds(extractionItemsResult({
    items: [{
      ...extractionItemsResult().items[0],
      candidate_id: "work-log-PromptVault-saved",
    }],
  }));

  assert.deepEqual(
    workLogExtractionUnsavedAcceptedIds(proposals, savedIds),
    ["work-log-CareVault-unsaved"],
  );
  assert.equal(workLogProposalSaveStateText(proposals.proposals[0], savedIds), "저장됨");
  assert.equal(workLogProposalSaveStateText(proposals.proposals[1], savedIds), "저장 승인");
  assert.equal(workLogProposalSaveStateText(proposals.proposals[2], savedIds), null);
});

test("work summary snapshot helpers expose bounded project/day drill-down", () => {
  const savedSnapshot = snapshot();

  const visible = workSummarySnapshotVisibleSummaries(savedSnapshot, 3);

  assert.deepEqual(
    visible.map((summary) => `${summary.date}:${summary.project}`),
    [
      "2026-06-09:PromptVault",
      "2026-06-09:CareVault",
      "2026-06-08:PromptVault",
    ],
  );
  assert.equal(
    workSummarySnapshotSummaryOverflowText(savedSnapshot, visible.length),
    "그 외 프로젝트/일자 요약 1개",
  );
  assert.equal(workSummarySnapshotSummaryOverflowText(savedSnapshot, 4), null);
  assert.deepEqual(workSummarySnapshotVisibleSummaries(savedSnapshot, 0), []);
});

test("work summary snapshot helpers expose expandable project/day drill-down", () => {
  const savedSnapshot = snapshot();

  assert.deepEqual(
    workSummarySnapshotDisplaySummaries(savedSnapshot, false).map((summary) => summary.project),
    ["PromptVault", "CareVault", "PromptVault"],
  );
  assert.deepEqual(
    workSummarySnapshotDisplaySummaries(savedSnapshot, true).map((summary) => summary.project),
    ["PromptVault", "CareVault", "PromptVault", "SourceCollector"],
  );
  assert.equal(
    workSummarySnapshotDetailToggleText(savedSnapshot, false),
    "전체 프로젝트/일자 요약 4개 보기",
  );
  assert.equal(workSummarySnapshotDetailToggleText(savedSnapshot, true), "프로젝트/일자 요약 접기");
  assert.equal(
    workSummarySnapshotDetailToggleText(snapshot({
      summaries: [
        snapshotSummary({ project: "PromptVault" }),
        snapshotSummary({ project: "CareVault" }),
        snapshotSummary({ project: "QualityGate" }),
      ],
      summary_count: 3,
    }), false),
    null,
  );
});

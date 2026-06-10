import assert from "node:assert/strict";
import test from "node:test";
import {
  activeWorkReviewQueueFilterCount,
  emptyWorkReviewQueueFilters,
  filterWorkLogNormalizationReviewQueueItems,
  filterWorkLogReviewQueueItems,
  filterWorkSessionEvidenceReviewQueueItems,
  workReviewQueueDateSuggestions,
  workReviewQueueFilterMetaText,
  workReviewQueueProjectSuggestions,
  workReviewQueueReasonSuggestions,
  type WorkReviewQueueFilters,
} from "../src/reviewQueueFilters.ts";
import type {
  ProjectWorkLogNormalizationReviewQueueItem,
  ProjectWorkLogReviewQueueItem,
  ProjectWorkSessionEvidenceReviewQueueItem,
} from "../src/types.ts";

function normalizationItem(
  overrides: Partial<ProjectWorkLogNormalizationReviewQueueItem> = {},
): ProjectWorkLogNormalizationReviewQueueItem {
  return {
    accepted: true,
    ai_saved_extraction_count: 0,
    best_ai_confidence: null,
    candidate_id: "normalization-PromptVault-a1",
    confidence: 0.91,
    date: "2026-06-09",
    first_seen_at: "2026-06-09T00:00:00Z",
    last_seen_at: "2026-06-09T00:01:00Z",
    normalized_evidence: "PromptVault queue normalization was reviewed.",
    normalized_status: "completed",
    normalized_title: "PromptVault review queue filters",
    original_evidence: "Updated working.md.",
    original_status: "active",
    original_title: "00:11 KST",
    project: "PromptVault",
    provider: "glm",
    provider_model: "glm-test-model",
    provider_runtime: "glm-chat-completions",
    reason: "generic_title",
    rejection_reason: null,
    review_reason: "operator_review_required",
    review_state: "pending_review",
    risk_flags: [],
    saved_extraction_count: 1,
    session_evidence_count: 2,
    source_file: "workingd.md",
    source_path: "/tmp/PromptVault/workingd.md",
    used_ai: true,
    work_item_count: 4,
    ...overrides,
  };
}

function workLogReviewQueueItem(
  overrides: Partial<ProjectWorkLogReviewQueueItem> = {},
): ProjectWorkLogReviewQueueItem {
  return {
    candidate_id: "work-log-review-PromptVault-a1",
    candidate_reason: "missing_dated_heading",
    char_count: 54,
    excerpt: "- 2026-06-09: Verified approved queue browser save",
    first_seen_at: "2026-06-09T00:00:00Z",
    last_seen_at: "2026-06-09T00:01:00Z",
    line_count: 1,
    modified_at: null,
    project: "PromptVault",
    provider_route: "safe_ai",
    review_reason: "queued_for_ai_backfill",
    review_state: "pending_ai_review",
    risk_flags: [],
    source_file: "workingd.md",
    source_path: "/tmp/PromptVault/workingd.md",
    ...overrides,
  };
}

function sessionEvidenceItem(
  overrides: Partial<ProjectWorkSessionEvidenceReviewQueueItem> = {},
): ProjectWorkSessionEvidenceReviewQueueItem {
  return {
    candidate_id: "session-PromptVault-a1",
    candidate_reason: "unresolved_after_full_index,needs_title_normalization",
    date: "2026-06-09",
    first_seen_at: "2026-06-09T00:00:00Z",
    last_seen_at: "2026-06-09T00:01:00Z",
    latest_source_file: "working.md",
    latest_source_path: "/tmp/PromptVault/working.md",
    latest_source_role: "handoff-log",
    needs_title_normalization: true,
    operational_status: "needs_session_evidence",
    project: "PromptVault",
    review_reason: "unresolved_session_evidence",
    review_state: "pending_review",
    sample_evidence: "- 2026-06-09: PromptVault review queue filters",
    session_evidence_audit: "unresolved-after-full-index",
    same_project_same_date_session_count: 0,
    same_project_other_session_dates: [{ text: "2026-06-08", count: 2 }],
    same_project_other_session_date_count: 1,
    nearest_same_project_other_session_date: "2026-06-08",
    source_file_count: 2,
    source_file_roles: [{ text: "handoff-log", count: 2 }],
    source_files: ["working.md", "workingd.md"],
    source_review: null,
    source_statuses: [{ text: "logged", count: 2 }],
    top_titles: ["PromptVault review queue filters"],
    work_item_count: 4,
    ...overrides,
  };
}

test("review queue filters narrow normalization rows by project date state and reason", () => {
  const rows = [
    normalizationItem(),
    normalizationItem({
      candidate_id: "normalization-CareVault-b1",
      date: "2026-06-08",
      project: "CareVault",
      reason: "low_confidence",
      review_state: "stale",
    }),
  ];
  const filters: WorkReviewQueueFilters = {
    date: "2026-06-09",
    project: "PromptVault",
    reason: "generic",
    state: "pending_review",
  };

  assert.equal(activeWorkReviewQueueFilterCount(filters), 4);
  assert.deepEqual(
    filterWorkLogNormalizationReviewQueueItems(rows, filters).map((row) => row.candidate_id),
    ["normalization-PromptVault-a1"],
  );
  assert.equal(
    workReviewQueueFilterMetaText("정규화 큐", 1, rows.length, activeWorkReviewQueueFilterCount(filters)),
    "정규화 큐 필터 · 필터 4개 · 결과 1 / 2개",
  );
});

test("review queue filters narrow backfill queue rows by project state and reason", () => {
  const rows = [
    workLogReviewQueueItem(),
    workLogReviewQueueItem({
      candidate_id: "work-log-review-CareVault-b1",
      project: "CareVault",
      provider_route: "local_review_only",
      review_reason: "risk_flags_require_manual_review",
      review_state: "risk_blocked",
      risk_flags: ["local_secret_path"],
    }),
  ];
  const filters: WorkReviewQueueFilters = {
    ...emptyWorkReviewQueueFilters(),
    project: "PromptVault",
    reason: "safe_ai",
    state: "pending_ai_review",
  };

  assert.equal(activeWorkReviewQueueFilterCount(filters), 3);
  assert.deepEqual(
    filterWorkLogReviewQueueItems(rows, filters).map((row) => row.candidate_id),
    ["work-log-review-PromptVault-a1"],
  );
  assert.equal(
    workReviewQueueFilterMetaText("백필큐", 1, rows.length, activeWorkReviewQueueFilterCount(filters)),
    "백필큐 필터 · 필터 3개 · 결과 1 / 2개",
  );
});

test("review queue filters narrow session evidence rows by reason fields", () => {
  const rows = [
    sessionEvidenceItem(),
    sessionEvidenceItem({
      candidate_id: "session-CareVault-b1",
      candidate_reason: "manual_review",
      date: "2026-06-08",
      project: "CareVault",
      review_state: "approved",
      session_evidence_audit: "session-supported",
    }),
  ];

  assert.deepEqual(
    filterWorkSessionEvidenceReviewQueueItems(rows, {
      ...emptyWorkReviewQueueFilters(),
      reason: "full-index",
      state: "pending_review",
    }).map((row) => row.candidate_id),
    ["session-PromptVault-a1"],
  );
});

test("review queue filter suggestions include dates projects and reasons", () => {
  const rows = [
    sessionEvidenceItem(),
    sessionEvidenceItem({
      candidate_id: "session-CareVault-b1",
      candidate_reason: "manual_review",
      date: "2026-06-08",
      project: "CareVault",
    }),
  ];

  assert.deepEqual(workReviewQueueDateSuggestions(rows), ["2026-06-08", "2026-06-09"]);
  assert.deepEqual(workReviewQueueProjectSuggestions(rows), ["CareVault", "PromptVault"]);
  assert.deepEqual(
    workReviewQueueReasonSuggestions(rows).filter((reason) =>
      ["manual_review", "unresolved-after-full-index"].includes(reason)
    ),
    ["manual_review", "unresolved-after-full-index"],
  );
});

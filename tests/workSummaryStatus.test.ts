import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  workLogCandidatesActionLabel,
  workLogCandidatesFailureText,
  workLogCandidatesMetaText,
  workLogExtractionActionLabel,
  workLogExtractionFailureText,
  workLogExtractionItemsActionLabel,
  workLogExtractionItemsFailureText,
  workLogExtractionItemsMetaText,
  workLogExtractionMetaText,
  workLogExtractionPersistenceText,
  workLogCoverageActionLabel,
  workLogCoverageFailureText,
  workLogCoverageMetaText,
  workSummaryActionLabel,
  workSummaryFailureText,
  workSummaryIndexStatusText,
  workSummaryMetaText,
  workSummaryPersistenceText,
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
  type WorkLogExtractionState,
  type WorkLogExtractionItemsState,
  type WorkSummarySnapshotsState,
  type WorkSummaryState,
} from "../src/workSummaryStatus.ts";
import type {
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionCandidatesResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkSummary,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshot,
  ProjectWorkSummarySnapshotsResult,
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
      items: [],
      warnings: [],
    },
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
    candidate_count: 13,
    candidates: [],
    warnings: [],
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
  assert.equal(workSummaryMetaText("loading", result), "작업 요약 생성 중");
  assert.equal(workSummaryMetaText("failed", null), "작업 요약을 사용할 수 없음");
  assert.equal(
    workSummaryIndexStatusText(result),
    "세션 인덱스 사용 · 20개 근거 보관 · 고유 근거 11건",
  );
  assert.equal(
    workSummaryIndexStatusText(summaryResult({
      report: {
        ...result.report,
        session_evidence_index_used: false,
        session_evidence_index_updated: true,
      },
    })),
    "세션 인덱스 갱신 · 20개 근거 보관 · 고유 근거 11건",
  );
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
    "스냅샷 #12 저장 · 총 15개",
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
    "후보 13개 · parsed 제외 16개 · unreadable 1개 · empty 2개",
  );
  assert.equal(workLogCandidatesMetaText(failed, null), "AI 추출 후보를 사용할 수 없음");
  assert.equal(
    workLogCandidatesFailureText(failed),
    "AI 추출 후보를 불러오지 못했습니다. 진행 로그 경로나 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogCandidatesFailureText("ready"), null);
});

test("work log extraction labels describe accepted and rejected AI proposals", () => {
  const failed: WorkLogExtractionState = "failed";
  assert.equal(workLogExtractionActionLabel("idle", false, lockState()), "AI 작업 추출 제안");
  assert.equal(workLogExtractionActionLabel("ready", true, lockState()), "AI 작업 추출 제안 새로고침");
  assert.equal(
    workLogExtractionActionLabel("loading", true, lockState({ workSummaryRunning: true })),
    "AI 작업 추출 제안 생성 중",
  );
  assert.equal(
    workLogExtractionActionLabel("ready", true, lockState({ scanRunning: true })),
    "스캔 실행 중에는 AI 작업 추출 제안을 새로고침할 수 없습니다",
  );
  assert.equal(workLogExtractionMetaText("idle", null), "아직 생성한 AI 작업 추출 제안 없음");
  assert.equal(workLogExtractionMetaText("loading", extractionResult()), "AI 작업 추출 제안 생성 중");
  assert.equal(
    workLogExtractionMetaText("ready", extractionResult()),
    "AI glm · 후보 13개 · accepted 3개 · rejected 10개",
  );
  assert.equal(
    workLogExtractionMetaText("ready", extractionResult({ used_ai: false, provider: "local-extraction-rules" })),
    "로컬 local-extraction-rules · 후보 13개 · accepted 3개 · rejected 10개",
  );
  assert.equal(workLogExtractionMetaText(failed, null), "AI 작업 추출 제안을 사용할 수 없음");
  assert.equal(
    workLogExtractionFailureText(failed),
    "AI 작업 추출 제안을 불러오지 못했습니다. provider 설정, 진행 로그 경로, 브리지 상태를 확인하세요.",
  );
  assert.equal(workLogExtractionFailureText("ready"), null);
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

import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import { pathDisplayText } from "./promptRowA11y.ts";
import { riskFlagLabel } from "./riskLabels.ts";
import type {
  ProjectWorkAiProviderHealthProvider,
  ProjectWorkAiProviderHealthResult,
  ProjectWorkAiProviderStatusProvider,
  ProjectWorkAiProviderStatusResult,
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionCandidate,
  ProjectWorkLogExtractionCandidatesResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogNormalizationCandidatesResult,
  ProjectWorkLogExtractionProposal,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkLogExtractionRunsResult,
  ProjectWorkLogReviewQueueItem,
  ProjectWorkLogNormalizationProposal,
  ProjectWorkLogNormalizationProposalsResult,
  ProjectWorkLogNormalizationApplyResult,
  ProjectWorkLogNormalizedItem,
  ProjectWorkLogNormalizedItemsResult,
  ProjectWorkLogNormalizationReviewQueueItem,
  ProjectWorkLogNormalizationReviewQueueResult,
  ProjectWorkLogReviewQueueResult,
  ProjectWorkSessionEvidenceProposal,
  ProjectWorkSessionEvidenceProposalsResult,
  ProjectWorkSessionEvidenceNearbyItem,
  ProjectWorkSessionEvidenceNearbyResult,
  ProjectWorkSessionEvidenceSourceAuditResult,
  ProjectWorkSessionEvidenceSourceProposal,
  ProjectWorkSessionEvidenceSourceProposalsResult,
  ProjectWorkSessionEvidenceReviewApplyResult,
  ProjectWorkSessionEvidenceReviewedItemsResult,
  ProjectWorkSessionEvidenceReviewQueueItem,
  ProjectWorkSessionEvidenceReviewQueueResult,
  ProjectWorkSessionIndexResult,
  ProjectWorkSummary,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshot,
  ProjectWorkSummarySnapshotsResult,
  ProjectWorkStatusExportResult,
  ProjectWorkStatusExportRow,
} from "./types.ts";

export type WorkSummaryState = "idle" | "loading" | "ready" | "failed";
export type WorkStatusExportState = "idle" | "loading" | "ready" | "failed";
export type WorkSummarySnapshotsState = "idle" | "loading" | "ready" | "failed";
export type WorkLogCoverageState = "idle" | "loading" | "ready" | "failed";
export type WorkLogCandidatesState = "idle" | "loading" | "ready" | "failed";
export type WorkAiProviderStatusState = "idle" | "loading" | "ready" | "failed";
export type WorkAiProviderHealthState = "idle" | "loading" | "ready" | "failed";
export type WorkLogReviewQueueState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionItemsState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionRunsState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizationCandidatesState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizationProposalsState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizationReviewQueueState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizationApplyState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizedItemsState = "idle" | "loading" | "ready" | "failed";
export type WorkSessionEvidenceProposalsState = "idle" | "loading" | "ready" | "failed";
export type WorkSessionEvidenceReviewQueueState = "idle" | "loading" | "ready" | "failed";
export type WorkSessionEvidenceReviewApplyState = "idle" | "loading" | "ready" | "failed";
export type WorkSessionEvidenceReviewedItemsState = "idle" | "loading" | "ready" | "failed";
export type WorkManagementRefreshState = "idle" | "loading" | "ready" | "failed";
export type WorkManagementFreezeState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionRunMode = "ai" | "local";
export type WorkStatusExportRowFilter =
  | "all"
  | "needs-session-evidence"
  | "bounded-session-limit"
  | "unresolved-session-evidence"
  | "near-session-date-hint"
  | "stale-session-date-hint"
  | "needs-title-normalization"
  | "active"
  | "session-supported"
  | "progress-log-only";
export type WorkSessionEvidenceSourceAuditFilter =
  | "all"
  | "manual-inspect"
  | "bulk-rejectable"
  | "review-ready";

export const WORK_SUMMARY_SNAPSHOT_DETAIL_LIMIT = 3;

export interface WorkManagementReadinessInput {
  coverage?: ProjectWorkLogCoverageResult | null;
  sessionIndex?: ProjectWorkSessionIndexResult | null;
  statusExport?: ProjectWorkStatusExportResult | null;
  aiProviderStatus?: ProjectWorkAiProviderStatusResult | null;
  workLogReviewQueue?: ProjectWorkLogReviewQueueResult | null;
  normalizationReviewQueue?: ProjectWorkLogNormalizationReviewQueueResult | null;
  sessionEvidenceReviewQueue?: ProjectWorkSessionEvidenceReviewQueueResult | null;
}

export function workSummaryActionLabel(
  state: WorkSummaryState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "작업 요약 생성 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 작업 요약을 ${hasResult ? "새로고침" : "생성"}할 수 없습니다`;
  }
  return hasResult ? "작업 요약 새로고침" : "작업 요약 생성";
}

export function workStatusExportActionLabel(
  state: WorkStatusExportState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "프로젝트/일별 상태 export 생성 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 프로젝트/일별 상태 export를 ${hasResult ? "새로고침" : "생성"}할 수 없습니다`;
  }
  return hasResult ? "상태 export 새로고침" : "상태 export 생성";
}

export function workManagementRefreshActionLabel(
  state: WorkManagementRefreshState,
  hasOverview: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "전체 작업 관리 새로고침 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 전체 작업 관리를 ${hasOverview ? "새로고침" : "불러오기"}할 수 없습니다`;
  }
  return hasOverview ? "전체 작업 관리 새로고침" : "전체 작업 관리 불러오기";
}

export function workManagementFreezeActionLabel(
  state: WorkManagementFreezeState,
  liveOnlyRowCount: number,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "live-only 작업 관리 row 고정 저장 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 live-only 작업 관리 row를 고정 저장할 수 없습니다`;
  }
  if (liveOnlyRowCount <= 0) return "고정 저장할 live-only 작업 관리 row가 없습니다";
  return `live-only 작업 관리 row ${liveOnlyRowCount.toLocaleString()}개를 저장 관리로 고정`;
}

export function workSummaryFailureText(state: WorkSummaryState): string | null {
  if (state !== "failed") return null;
  return "프로젝트 작업 요약을 불러오지 못했습니다. 브리지 상태나 진행 로그 스캔 범위를 확인하세요.";
}

export function workStatusExportFailureText(state: WorkStatusExportState): string | null {
  if (state !== "failed") return null;
  return "프로젝트/일별 상태 export를 불러오지 못했습니다. 진행 로그, 세션 인덱스, 브리지 상태를 확인하세요.";
}

export function workSummaryMetaText(
  state: WorkSummaryState,
  result: ProjectWorkSummaryResult | null,
): string {
  if (state === "loading") return "작업 요약 생성 중";
  if (!result) return state === "failed" ? "작업 요약을 사용할 수 없음" : "아직 생성된 작업 요약 없음";
  const parts = [
    `${result.report.project_count.toLocaleString()}개 프로젝트`,
    `${result.report.date_count.toLocaleString()}일`,
    `${result.report.total_items.toLocaleString()}개 작업`,
    `세션 근거 ${result.report.session_evidence_count.toLocaleString()}건`,
  ];
  if (result.extraction_merge) {
    parts.push(workSummaryExtractionMergeText(result.extraction_merge));
  }
  return parts.join(" · ");
}

export function workStatusExportMetaText(
  state: WorkStatusExportState,
  result: ProjectWorkStatusExportResult | null,
): string {
  if (state === "loading") return "프로젝트/일별 상태 export 생성 중";
  if (!result) {
    return state === "failed" ? "상태 export를 사용할 수 없음" : "아직 생성된 상태 export 없음";
  }
  const parts = [
    `표시 ${result.returned_row_count.toLocaleString()}행`,
    `${result.report_project_count.toLocaleString()}개 프로젝트`,
    `${result.report_date_count.toLocaleString()}일`,
    `작업 ${result.report_total_items.toLocaleString()}개`,
    `진행로그 ${result.report_files_seen.toLocaleString()}개`,
    `세션 근거 ${result.report_session_evidence_count.toLocaleString()}건`,
    `고유 ${result.report_unique_session_evidence_count.toLocaleString()}건`,
    `DB ${pathDisplayText(result.database_path)}`,
  ];
  if (result.rows_truncated) parts.push("표시 제한");
  return parts.join(" · ");
}

export function workStatusExportPageStatusText(result: ProjectWorkStatusExportResult | null): string | null {
  if (!result) return null;
  if (result.returned_row_count === 0) {
    return `상태 row 없음 · 전체 ${result.total_row_count.toLocaleString()}행`;
  }
  const firstRow = result.row_offset + 1;
  const lastRow = result.row_offset + result.returned_row_count;
  const parts = [
    `상태 row ${firstRow.toLocaleString()}-${lastRow.toLocaleString()} / ${result.total_row_count.toLocaleString()}행`,
  ];
  if (result.next_row_offset !== null) {
    parts.push(`다음 ${(result.next_row_offset + 1).toLocaleString()}행부터`);
  }
  return parts.join(" · ");
}

export function filterWorkStatusExportRows(
  rows: ProjectWorkStatusExportRow[],
  filter: WorkStatusExportRowFilter,
): ProjectWorkStatusExportRow[] {
  if (filter === "all") return rows;
  return rows.filter((row) => {
    if (filter === "needs-session-evidence") return row.needs_session_evidence;
    if (filter === "bounded-session-limit") return row.session_evidence_audit === "bounded-session-limit";
    if (filter === "unresolved-session-evidence") {
      return row.session_evidence_audit === "unresolved-after-full-index";
    }
    if (filter === "near-session-date-hint") return workStatusExportRowHasNearSessionDateHint(row);
    if (filter === "stale-session-date-hint") return workStatusExportRowHasStaleSessionDateHint(row);
    if (filter === "needs-title-normalization") return row.needs_title_normalization;
    return row.operational_status === filter;
  });
}

export function workStatusExportRowFilterLabel(filter: WorkStatusExportRowFilter): string {
  const labels: Record<WorkStatusExportRowFilter, string> = {
    all: "전체",
    "needs-session-evidence": "세션 근거 필요",
    "bounded-session-limit": "근거 limit 영향",
    "unresolved-session-evidence": "전체 인덱스 미해결",
    "near-session-date-hint": "인접 세션 후보",
    "stale-session-date-hint": "먼 세션 후보",
    "needs-title-normalization": "제목 정규화 필요",
    active: "현재 진행",
    "session-supported": "세션 근거 있음",
    "progress-log-only": "진행로그만 있음",
  };
  return labels[filter];
}

export function workStatusExportFilterMetaText(
  filter: WorkStatusExportRowFilter,
  rows: ProjectWorkStatusExportRow[],
  filteredRows: ProjectWorkStatusExportRow[],
): string {
  const needsSessionEvidenceCount = rows.filter((row) => row.needs_session_evidence).length;
  const boundedSessionLimitCount = rows.filter((row) => row.session_evidence_audit === "bounded-session-limit").length;
  const unresolvedSessionEvidenceCount = rows.filter(
    (row) => row.session_evidence_audit === "unresolved-after-full-index",
  ).length;
  const nearSessionDateHintCount = rows.filter(workStatusExportRowHasNearSessionDateHint).length;
  const staleSessionDateHintCount = rows.filter(workStatusExportRowHasStaleSessionDateHint).length;
  const needsTitleNormalizationCount = rows.filter((row) => row.needs_title_normalization).length;
  return [
    `필터 ${workStatusExportRowFilterLabel(filter)}`,
    `결과 ${filteredRows.length.toLocaleString()} / ${rows.length.toLocaleString()}행`,
    `세션근거 필요 ${needsSessionEvidenceCount.toLocaleString()}행`,
    `근거limit ${boundedSessionLimitCount.toLocaleString()}행`,
    `전체미해결 ${unresolvedSessionEvidenceCount.toLocaleString()}행`,
    `인접후보 ${nearSessionDateHintCount.toLocaleString()}행`,
    `먼후보 ${staleSessionDateHintCount.toLocaleString()}행`,
    `제목정규화 필요 ${needsTitleNormalizationCount.toLocaleString()}행`,
  ].join(" · ");
}

function workStatusExportRowHasNearSessionDateHint(row: ProjectWorkStatusExportRow): boolean {
  if (!row.needs_session_evidence) return false;
  if (row.same_project_same_date_session_count > 0) return true;
  return row.nearest_same_project_other_session_distance_days !== null
    && row.nearest_same_project_other_session_distance_days <= 1;
}

function workStatusExportRowHasStaleSessionDateHint(row: ProjectWorkStatusExportRow): boolean {
  if (!row.needs_session_evidence) return false;
  return row.nearest_same_project_other_session_distance_days !== null
    && row.nearest_same_project_other_session_distance_days > 1;
}

export function workSummaryIndexStatusText(result: ProjectWorkSummaryResult): string {
  const indexState = result.report.session_evidence_index_updated
    ? "세션 인덱스 갱신"
    : result.report.session_evidence_index_used
      ? "세션 인덱스 사용"
      : "세션 직접 스캔";
  return [
    indexState,
    workSummarySessionEvidenceModeLabel(result.report.session_evidence_mode),
    `스캔 ${result.report.session_scan_prompt_count.toLocaleString()}개`,
    `보관 ${result.report.session_evidence_index_count.toLocaleString()}개`,
    `매칭 ${result.report.session_evidence_count.toLocaleString()}건`,
    `고유 ${result.report.session_evidence_unique_count.toLocaleString()}건`,
  ].join(" · ");
}

export function workSessionIndexPlannedRemainingText(
  result: ProjectWorkSessionIndexResult | null,
  effectiveBatchFiles: number | null,
  standardMaxBatches: number,
  longMaxBatches: number,
): string | null {
  if (!result?.source_states.length || effectiveBatchFiles === null) return null;
  if (effectiveBatchFiles <= 0 || standardMaxBatches <= 0 || longMaxBatches <= 0) return null;
  const remainingBySource = result.source_states.map((source) =>
    Math.max(0, source.total_files - source.processed_files)
  );
  const remainingFiles = remainingBySource.reduce((sum, remaining) => sum + remaining, 0);
  if (remainingFiles === 0) return null;
  const estimatedRuns = (maxBatches: number): number => {
    const filesPerSourceRun = effectiveBatchFiles * maxBatches;
    return Math.max(...remainingBySource.map((remaining) => Math.ceil(remaining / filesPerSourceRun)));
  };
  return [
    "현재 입력 기준",
    `이어 백필 예상 ${estimatedRuns(standardMaxBatches).toLocaleString()}회`,
    `긴 이어 백필 예상 ${estimatedRuns(longMaxBatches).toLocaleString()}회`,
  ].join(" · ");
}

export function workSessionIndexCheckpointGuidanceText(
  result: ProjectWorkSessionIndexResult | null,
  effectiveBatchFiles: number | null,
  standardMaxBatches: number,
  longMaxBatches: number,
): string | null {
  if (!result?.source_states.length || effectiveBatchFiles === null) return null;
  if (effectiveBatchFiles <= 0 || standardMaxBatches <= 0 || longMaxBatches <= 0) return null;
  const remainingBySource = result.source_states.map((source) =>
    Math.max(0, source.total_files - source.processed_files)
  );
  const remainingFiles = remainingBySource.reduce((sum, remaining) => sum + remaining, 0);
  if (remainingFiles === 0) {
    return "체크포인트 계획 · 세션 백필 완료 · 상태 Export와 요약을 새로고침하세요";
  }
  const estimatedRuns = (maxBatches: number): number => {
    const filesPerSourceRun = effectiveBatchFiles * maxBatches;
    return Math.max(...remainingBySource.map((remaining) => Math.ceil(remaining / filesPerSourceRun)));
  };
  const standardRuns = estimatedRuns(standardMaxBatches);
  const longRuns = estimatedRuns(longMaxBatches);
  const useLongRun = longRuns < standardRuns;
  const recommendedMode = useLongRun ? "긴 이어 백필" : "이어 백필";
  const recommendedRuns = useLongRun ? longRuns : standardRuns;
  const filesPerSourceRun = effectiveBatchFiles * (useLongRun ? longMaxBatches : standardMaxBatches);
  return [
    "체크포인트 계획",
    `권장 다음 실행 ${recommendedMode}`,
    `source당 최대 ${filesPerSourceRun.toLocaleString()}개`,
    `남은 파일 ${remainingFiles.toLocaleString()}개`,
    `예상 ${recommendedRuns.toLocaleString()}회`,
    "각 실행 후 상태 Export/큐 재확인",
  ].join(" · ");
}

export function workSessionIndexNextRunImpactText(
  result: ProjectWorkSessionIndexResult | null,
  effectiveBatchFiles: number | null,
  standardMaxBatches: number,
  longMaxBatches: number,
  longRunConfirmed: boolean,
): string | null {
  if (!result?.source_states.length || effectiveBatchFiles === null) return null;
  if (effectiveBatchFiles <= 0 || standardMaxBatches <= 0 || longMaxBatches <= 0) return null;
  const remainingBySource = result.source_states.map((source) =>
    Math.max(0, source.total_files - source.processed_files)
  );
  const remainingFiles = remainingBySource.reduce((sum, remaining) => sum + remaining, 0);
  if (remainingFiles === 0) return "다음 실행 효과 · 세션 백필 완료 · 추가 실행 없음";
  const maxBatches = longRunConfirmed ? longMaxBatches : standardMaxBatches;
  const mode = longRunConfirmed ? "긴 이어 백필" : "이어 백필";
  const filesPerSourceRun = effectiveBatchFiles * maxBatches;
  const remainingAfterRunBySource = remainingBySource.map((remaining) =>
    Math.max(0, remaining - filesPerSourceRun)
  );
  const remainingAfterRun = remainingAfterRunBySource.reduce((sum, remaining) => sum + remaining, 0);
  const estimatedRunsAfter = remainingAfterRunBySource.length
    ? Math.max(...remainingAfterRunBySource.map((remaining) =>
      filesPerSourceRun > 0 ? Math.ceil(remaining / filesPerSourceRun) : 0
    ))
    : 0;
  const parts = [
    "다음 실행 효과",
    mode,
    `이번 클릭 source당 최대 ${filesPerSourceRun.toLocaleString()}개`,
    `남은 파일 ${remainingFiles.toLocaleString()}→${remainingAfterRun.toLocaleString()}개`,
  ];
  parts.push(estimatedRunsAfter > 0
    ? `이후 예상 ${estimatedRunsAfter.toLocaleString()}회`
    : "이번 클릭 후 완료 예상");
  if (!longRunConfirmed && longMaxBatches > standardMaxBatches) {
    parts.push("긴 백필 확인 시 더 빠름");
  }
  return parts.join(" · ");
}

export function workSessionIndexPartialBackfillWarningText(
  result: ProjectWorkSessionIndexResult | null,
): string | null {
  if (!result?.source_states.length || result.all_sources_completed) return null;
  const totalFiles = result.source_states.reduce((sum, source) => sum + source.total_files, 0);
  const processedFiles = result.source_states.reduce((sum, source) => sum + source.processed_files, 0);
  const remainingFiles = Math.max(0, totalFiles - processedFiles);
  if (totalFiles <= 0 || remainingFiles <= 0) return null;
  return [
    "세션 백필 미완료",
    `처리 ${processedFiles.toLocaleString()}/${totalFiles.toLocaleString()}개`,
    `남은 파일 ${remainingFiles.toLocaleString()}개`,
    "상태 Export/요약/큐는 현재 인덱스 기준",
  ].join(" · ");
}

export function workManagementReadinessText(
  input: WorkManagementReadinessInput,
): string | null {
  if (!hasWorkManagementReadinessInput(input)) return null;
  const parts = ["관리 준비도"];
  const coverage = input.coverage;
  if (coverage) {
    parts.push(`진행로그 parsed ${coverage.parsed_file_count.toLocaleString()}/${coverage.files_seen.toLocaleString()}개`);
    if (coverage.unparsed_file_count > 0) {
      parts.push(`unparsed ${coverage.unparsed_file_count.toLocaleString()}개`);
    }
    if (coverage.unreadable_file_count > 0) {
      parts.push(`unreadable ${coverage.unreadable_file_count.toLocaleString()}개`);
    }
    if (coverage.pointer_file_count > 0) {
      parts.push(`pointer ${coverage.pointer_file_count.toLocaleString()}개`);
    }
  } else {
    parts.push("진행로그 미확인");
  }
  const sessionIndexText = workManagementReadinessSessionText(input.sessionIndex ?? null, input.statusExport ?? null);
  parts.push(sessionIndexText);
  parts.push(workManagementReadinessReviewQueueText(input));
  parts.push(workManagementReadinessProviderText(input.aiProviderStatus ?? null));
  return parts.join(" · ");
}

export function workManagementReviewDecisionText(
  input: WorkManagementReadinessInput,
): string | null {
  const workLog = input.workLogReviewQueue;
  const normalization = input.normalizationReviewQueue;
  const sessionEvidence = input.sessionEvidenceReviewQueue;
  if (!workLog && !normalization && !sessionEvidence) return null;
  const workLogPending = (workLog?.pending_ai_review_count ?? 0) + (workLog?.risk_blocked_count ?? 0);
  const normalizationPending = normalization?.pending_review_count ?? 0;
  const sessionPending = sessionEvidence?.pending_review_count ?? 0;
  const totalItems =
    (workLog?.total_items ?? 0) + (normalization?.total_items ?? 0) + (sessionEvidence?.total_items ?? 0);
  const pendingItems = workLogPending + normalizationPending + sessionPending;
  const staleItems =
    (workLog?.stale_count ?? 0) + (normalization?.stale_count ?? 0) + (sessionEvidence?.stale_count ?? 0);
  const approvedItems =
    (workLog?.approved_count ?? 0) + (normalization?.approved_count ?? 0) + (sessionEvidence?.approved_count ?? 0);
  const rejectedItems =
    (workLog?.rejected_count ?? 0) + (normalization?.rejected_count ?? 0) + (sessionEvidence?.rejected_count ?? 0);
  const parts = [
    "검토 결정",
    `저장 row ${totalItems.toLocaleString()}개`,
    `대기 ${pendingItems.toLocaleString()}개`,
    `stale ${staleItems.toLocaleString()}개`,
    `승인 ${approvedItems.toLocaleString()}개`,
    `거절 ${rejectedItems.toLocaleString()}개`,
  ];
  if (workLog) {
    parts.push(`추출 ${workLogPending.toLocaleString()}/${workLog.total_items.toLocaleString()}개`);
  }
  if (normalization) {
    parts.push(`정규화 ${normalizationPending.toLocaleString()}/${normalization.total_items.toLocaleString()}개`);
  }
  if (sessionEvidence) {
    parts.push(`세션 ${sessionPending.toLocaleString()}/${sessionEvidence.total_items.toLocaleString()}개`);
  }
  if (pendingItems === 0 && staleItems === 0) {
    parts.push("대기 없음");
  }
  return parts.join(" · ");
}

export function workManagementReviewBlockerText(
  input: WorkManagementReadinessInput,
): string | null {
  const parts: string[] = [];
  const workLog = input.workLogReviewQueue;
  const normalization = input.normalizationReviewQueue;
  const sessionEvidence = input.sessionEvidenceReviewQueue;

  if (workLog) {
    if (workLog.risk_blocked_count > 0) {
      parts.push(`추출 위험차단 ${workLog.risk_blocked_count.toLocaleString()}개`);
    }
    if (workLog.pending_ai_review_count > 0) {
      parts.push(`추출 AI검토 ${workLog.pending_ai_review_count.toLocaleString()}개`);
    }
    if (workLog.stale_count > 0) {
      parts.push(`추출 stale ${workLog.stale_count.toLocaleString()}개`);
    }
  }
  if (normalization) {
    if (normalization.pending_review_count > 0) {
      parts.push(`정규화 AI/운영검토 ${normalization.pending_review_count.toLocaleString()}개`);
    }
    if (normalization.stale_count > 0) {
      parts.push(`정규화 stale ${normalization.stale_count.toLocaleString()}개`);
    }
  }
  if (sessionEvidence) {
    const titleNormalizationCount = Math.min(
      sessionEvidence.pending_review_count,
      sessionEvidence.needs_title_normalization_count,
    );
    const evidenceReviewCount = Math.max(
      0,
      sessionEvidence.pending_review_count - titleNormalizationCount,
    );
    if (titleNormalizationCount > 0) {
      parts.push(`세션 제목정규화 ${titleNormalizationCount.toLocaleString()}개`);
    }
    if (evidenceReviewCount > 0) {
      parts.push(`세션 근거검토 ${evidenceReviewCount.toLocaleString()}개`);
    }
    if (sessionEvidence.stale_count > 0) {
      parts.push(`세션 stale ${sessionEvidence.stale_count.toLocaleString()}개`);
    }
  }

  return parts.length ? `검토 차단 · ${parts.join(" · ")}` : null;
}

export function workManagementReviewResolutionText(
  input: WorkManagementReadinessInput,
): string | null {
  const parts: string[] = [];
  const normalization = input.normalizationReviewQueue;
  const sessionEvidence = input.sessionEvidenceReviewQueue;
  const normalizationProviderNames = workManagementProviderNamesForCapability(
    input.aiProviderStatus ?? null,
    "work-log-normalization",
  );
  const sessionEvidenceProviderNames = workManagementProviderNamesForCapability(
    input.aiProviderStatus ?? null,
    "session-evidence-proposals",
  );

  if (normalization && normalization.pending_review_count > 0) {
    const displayedLocalFallbackCount = normalization.items.filter((item) =>
      item.review_state === "pending_review" && !item.used_ai
    ).length;
    if (displayedLocalFallbackCount > 0 && normalizationProviderNames.length > 0) {
      parts.push([
        "정규화 AI 재동기화 시도 가능",
        workManagementProviderNamesText(normalizationProviderNames),
        `local fallback 표시 ${displayedLocalFallbackCount.toLocaleString()}/${normalization.pending_review_count.toLocaleString()}개`,
      ].join(" · "));
    } else if (displayedLocalFallbackCount > 0) {
      parts.push(
        `정규화 provider 설정 필요 · local fallback 표시 ${displayedLocalFallbackCount.toLocaleString()}/${normalization.pending_review_count.toLocaleString()}개`,
      );
    } else {
      parts.push(`정규화 승인검토 ${normalization.pending_review_count.toLocaleString()}개`);
    }
  }

  if (sessionEvidence && sessionEvidence.pending_review_count > 0) {
    const titleNormalizationCount = Math.min(
      sessionEvidence.pending_review_count,
      sessionEvidence.needs_title_normalization_count,
    );
    const evidenceReviewCount = Math.max(
      0,
      sessionEvidence.pending_review_count - titleNormalizationCount,
    );
    if (titleNormalizationCount > 0) {
      parts.push(`세션 제목정규화 우선 ${titleNormalizationCount.toLocaleString()}개`);
    }
    if (evidenceReviewCount > 0 && sessionEvidenceProviderNames.length > 0) {
      parts.push([
        "세션근거 AI 제안 시도 가능",
        workManagementProviderNamesText(sessionEvidenceProviderNames),
        `${evidenceReviewCount.toLocaleString()}개`,
      ].join(" · "));
    } else if (evidenceReviewCount > 0) {
      parts.push(`세션근거 provider 설정 필요 ${evidenceReviewCount.toLocaleString()}개`);
    }
  }

  return parts.length ? `검토 해소 경로 · ${parts.join(" · ")}` : null;
}

export function workManagementNextActionText(
  input: WorkManagementReadinessInput,
  effectiveBatchFiles: number | null | undefined,
  standardMaxBatches: number,
  longMaxBatches: number,
  recommendedLargeBatchFiles?: number,
  longRunConfirmed = false,
): string | null {
  if (!hasWorkManagementReadinessInput(input)) return null;
  const actions: string[] = [];
  const workLogPending = workManagementWorkLogReviewPendingCount(input.workLogReviewQueue ?? null);
  const normalizationPending = workManagementNormalizationReviewPendingCount(
    input.normalizationReviewQueue ?? null,
  );
  const sessionEvidencePending = workManagementSessionEvidenceReviewPendingCount(
    input.sessionEvidenceReviewQueue ?? null,
  );
  const sessionBackfill = workManagementSessionBackfillRemaining(input.sessionIndex ?? null);

  if (!input.coverage) {
    actions.push("진행로그 coverage 확인");
  } else if (input.coverage.unparsed_file_count > 0 && !input.workLogReviewQueue) {
    actions.push(`진행로그 추출 후보 생성 · unparsed ${input.coverage.unparsed_file_count.toLocaleString()}개`);
  }
  if (workLogPending > 0) {
    actions.push(`백필큐 추출 검토 ${workLogPending.toLocaleString()}개`);
  }
  if (normalizationPending > 0) {
    actions.push(`제목 정규화 큐 검토 ${normalizationPending.toLocaleString()}개`);
  }
  if (sessionBackfill) {
    actions.push(workManagementSessionBackfillNextAction(
      sessionBackfill,
      effectiveBatchFiles,
      standardMaxBatches,
      longMaxBatches,
      recommendedLargeBatchFiles,
      longRunConfirmed,
    ));
  } else if (!input.sessionIndex && input.statusExport
    && input.statusExport.report_session_evidence_index_total_count
      > input.statusExport.report_session_evidence_index_count) {
    actions.push([
      "세션 인덱스 전체 적용 또는 export limit 확대",
      `사용 ${input.statusExport.report_session_evidence_index_count.toLocaleString()}/${input.statusExport.report_session_evidence_index_total_count.toLocaleString()}개`,
    ].join(" · "));
  }
  if (sessionEvidencePending > 0) {
    actions.push(`세션 근거 큐 검토 ${sessionEvidencePending.toLocaleString()}개`);
  }
  const providerAction = workManagementProviderNextAction(input.aiProviderStatus ?? null);
  if (providerAction) actions.push(providerAction);

  if (actions.length === 0) {
    return "다음 조치 · 작업관리 주요 게이트 통과 · 상태 Export/요약 새로고침으로 최신화";
  }
  return `다음 조치 · ${actions.slice(0, 3).join(" · ")}`;
}

function hasWorkManagementReadinessInput(input: WorkManagementReadinessInput): boolean {
  return Boolean(
    input.coverage
      || input.sessionIndex
      || input.statusExport
      || input.aiProviderStatus
      || input.workLogReviewQueue
      || input.normalizationReviewQueue
      || input.sessionEvidenceReviewQueue,
  );
}

function workManagementReadinessSessionText(
  sessionIndex: ProjectWorkSessionIndexResult | null,
  statusExport: ProjectWorkStatusExportResult | null,
): string {
  if (sessionIndex?.source_states.length) {
    const totalFiles = sessionIndex.source_states.reduce((sum, source) => sum + source.total_files, 0);
    const processedFiles = sessionIndex.source_states.reduce((sum, source) => sum + source.processed_files, 0);
    const remainingFiles = Math.max(0, totalFiles - processedFiles);
    if (sessionIndex.all_sources_completed || remainingFiles === 0) {
      return `세션 백필 완료 ${processedFiles.toLocaleString()}/${totalFiles.toLocaleString()}개`;
    }
    return [
      `세션 백필 미완료 ${processedFiles.toLocaleString()}/${totalFiles.toLocaleString()}개`,
      `남음 ${remainingFiles.toLocaleString()}개`,
    ].join(" · ");
  }
  if (statusExport) {
    if (statusExport.report_session_evidence_index_total_count > statusExport.report_session_evidence_index_count) {
      return [
        "세션 인덱스 limit 적용",
        `${statusExport.report_session_evidence_index_count.toLocaleString()}/${statusExport.report_session_evidence_index_total_count.toLocaleString()}개`,
      ].join(" ");
    }
    return `세션 인덱스 보관 ${statusExport.report_session_evidence_index_count.toLocaleString()}개`;
  }
  return "세션 백필 미확인";
}

function workManagementReadinessReviewQueueText(input: WorkManagementReadinessInput): string {
  const workLogPending =
    (input.workLogReviewQueue?.pending_ai_review_count ?? 0)
    + (input.workLogReviewQueue?.risk_blocked_count ?? 0)
    + (input.workLogReviewQueue?.stale_count ?? 0);
  const normalizationPending =
    (input.normalizationReviewQueue?.pending_review_count ?? 0)
    + (input.normalizationReviewQueue?.stale_count ?? 0);
  const sessionPending =
    (input.sessionEvidenceReviewQueue?.pending_review_count ?? 0)
    + (input.sessionEvidenceReviewQueue?.stale_count ?? 0);
  if (!input.workLogReviewQueue && !input.normalizationReviewQueue && !input.sessionEvidenceReviewQueue) {
    return "검토 큐 미확인";
  }
  if (workLogPending === 0 && normalizationPending === 0 && sessionPending === 0) {
    return "검토대기 없음";
  }
  return [
    `검토대기 추출 ${workLogPending.toLocaleString()}개`,
    `정규화 ${normalizationPending.toLocaleString()}개`,
    `세션 ${sessionPending.toLocaleString()}개`,
  ].join(" · ");
}

function workManagementReadinessProviderText(
  result: ProjectWorkAiProviderStatusResult | null,
): string {
  if (!result) return "AI provider 미확인";
  const usableProviders = result.providers.filter((provider) => provider.usable_for_work_management);
  const usableProviderNames = usableProviders.map(workAiProviderDisplayName);
  const codex = result.providers.find((provider) => provider.provider === "codex");
  const parts = usableProviderNames.length
    ? [`AI provider ${usableProviderNames.join("/")} 사용 가능`]
    : [`AI provider 미설정 · fallback ${result.fallback_provider}`];
  if (codex?.configured && !codex.usable_for_work_management) {
    parts.push("Codex opt-in 필요");
  }
  return parts.join(" · ");
}

function workManagementProviderNamesForCapability(
  result: ProjectWorkAiProviderStatusResult | null,
  capability: string,
): string[] {
  if (!result) return [];
  return result.providers
    .filter((provider) =>
      provider.usable_for_work_management && provider.capabilities.includes(capability)
    )
    .map(workAiProviderDisplayName);
}

function workManagementProviderNamesText(names: string[]): string {
  return names.join("/");
}

function workManagementWorkLogReviewPendingCount(
  result: ProjectWorkLogReviewQueueResult | null,
): number {
  return (result?.pending_ai_review_count ?? 0)
    + (result?.risk_blocked_count ?? 0)
    + (result?.stale_count ?? 0);
}

function workManagementNormalizationReviewPendingCount(
  result: ProjectWorkLogNormalizationReviewQueueResult | null,
): number {
  return (result?.pending_review_count ?? 0) + (result?.stale_count ?? 0);
}

function workManagementSessionEvidenceReviewPendingCount(
  result: ProjectWorkSessionEvidenceReviewQueueResult | null,
): number {
  return (result?.pending_review_count ?? 0) + (result?.stale_count ?? 0);
}

function workManagementSessionBackfillRemaining(
  result: ProjectWorkSessionIndexResult | null,
): { remainingFiles: number; remainingBySource: number[] } | null {
  if (!result?.source_states.length || result.all_sources_completed) return null;
  const remainingBySource = result.source_states
    .map((source) => Math.max(0, source.total_files - source.processed_files))
    .filter((remaining) => remaining > 0);
  const remainingFiles = remainingBySource.reduce((sum, remaining) => sum + remaining, 0);
  return remainingFiles > 0 ? { remainingFiles, remainingBySource } : null;
}

function workManagementSessionBackfillNextAction(
  backfill: { remainingFiles: number; remainingBySource: number[] },
  effectiveBatchFiles: number | null | undefined,
  standardMaxBatches: number,
  longMaxBatches: number,
  recommendedLargeBatchFiles: number | undefined,
  longRunConfirmed: boolean,
): string {
  const remainingText = `남은 파일 ${backfill.remainingFiles.toLocaleString()}개`;
  if (!effectiveBatchFiles || effectiveBatchFiles <= 0 || standardMaxBatches <= 0 || longMaxBatches <= 0) {
    return ["세션 백필 batch 크기 확인", remainingText].join(" · ");
  }
  const currentPlan = workManagementSessionBackfillRunPlan(
    backfill.remainingBySource,
    effectiveBatchFiles,
    standardMaxBatches,
    longMaxBatches,
  );
  const recommendedPlan = recommendedLargeBatchFiles && recommendedLargeBatchFiles > effectiveBatchFiles
    ? workManagementSessionBackfillRunPlan(
      backfill.remainingBySource,
      recommendedLargeBatchFiles,
      standardMaxBatches,
      longMaxBatches,
    )
    : null;
  if (recommendedPlan && recommendedPlan.runs < currentPlan.runs) {
    return [
      `대용량 적용 후 ${recommendedPlan.mode}`,
      remainingText,
      `예상 ${recommendedPlan.runs.toLocaleString()}회`,
      `현재 입력 ${currentPlan.runs.toLocaleString()}회`,
    ].join(" · ");
  }
  const prefix = currentPlan.mode === "긴 이어 백필" && !longRunConfirmed
    ? "긴 백필 확인 후 긴 이어 백필"
    : currentPlan.mode;
  return [
    prefix,
    remainingText,
    `예상 ${currentPlan.runs.toLocaleString()}회`,
  ].join(" · ");
}

function workManagementSessionBackfillRunPlan(
  remainingBySource: number[],
  batchFiles: number,
  standardMaxBatches: number,
  longMaxBatches: number,
): { mode: "이어 백필" | "긴 이어 백필"; runs: number } {
  const estimatedRuns = (maxBatches: number): number => {
    const filesPerSourceRun = batchFiles * maxBatches;
    return Math.max(...remainingBySource.map((remaining) => Math.ceil(remaining / filesPerSourceRun)));
  };
  const standardRuns = estimatedRuns(standardMaxBatches);
  const longRuns = estimatedRuns(longMaxBatches);
  return longRuns < standardRuns
    ? { mode: "긴 이어 백필", runs: longRuns }
    : { mode: "이어 백필", runs: standardRuns };
}

function workManagementProviderNextAction(
  result: ProjectWorkAiProviderStatusResult | null,
): string | null {
  if (!result) return "AI provider 상태 확인";
  if (result.providers.some((provider) => provider.usable_for_work_management)) return null;
  const codex = result.providers.find((provider) => provider.provider === "codex");
  if (codex?.configured && !codex.usable_for_work_management) {
    return "GLM/OpenAI 키 또는 Codex opt-in 확인";
  }
  return "GLM/OpenAI 키 확인";
}

export function workStatusExportIndexStatusText(result: ProjectWorkStatusExportResult): string {
  const indexState = result.report_session_evidence_index_updated
    ? "세션 인덱스 갱신"
    : result.report_session_evidence_index_used
      ? "세션 인덱스 사용"
      : "세션 직접 스캔";
  const parts = [
    indexState,
    workSummarySessionEvidenceModeLabel(result.report_session_evidence_mode),
    `스캔 ${result.report_session_scan_prompt_count.toLocaleString()}개`,
  ];
  if (result.report_session_evidence_index_total_count > result.report_session_evidence_index_count) {
    parts.push(
      `사용 ${result.report_session_evidence_index_count.toLocaleString()}개`,
      `보관 총 ${result.report_session_evidence_index_total_count.toLocaleString()}개`,
      "근거 limit 적용",
    );
  } else {
    parts.push(`보관 ${result.report_session_evidence_index_count.toLocaleString()}개`);
  }
  parts.push(
    `매칭 ${result.report_session_evidence_count.toLocaleString()}건`,
    `고유 ${result.report_unique_session_evidence_count.toLocaleString()}건`,
  );
  return parts.join(" · ");
}

export function workStatusExportRowStatusText(row: ProjectWorkStatusExportRow): string {
  const statusLabel: Record<string, string> = {
    active: "현재 진행",
    "session-supported": "세션 근거 있음",
    "progress-log-only": "진행로그만 있음",
  };
  const flags = [
    row.needs_session_evidence ? "세션 근거 필요" : null,
    row.needs_title_normalization ? "제목 정규화 필요" : null,
    row.has_session_evidence_reviewed_item
      ? `검토완료 ${row.session_evidence_reviewed_item_count.toLocaleString()}건`
      : null,
  ].filter((flag): flag is string => flag !== null);
  return [
    statusLabel[row.operational_status] ?? row.operational_status,
    `작업 ${row.work_item_count.toLocaleString()}개`,
    `파일 ${row.source_file_count.toLocaleString()}개`,
    `세션 ${row.session_evidence_count.toLocaleString()}건`,
    `고유 ${row.unique_session_evidence_count.toLocaleString()}건`,
    ...flags,
  ].join(" · ");
}

export function workStatusExportRowAuditToggleText(
  row: ProjectWorkStatusExportRow,
  expanded: boolean,
): string {
  return `${row.project} ${row.date} 상태 export 근거 ${expanded ? "접기" : "펼치기"}`;
}

export function workStatusExportRowSourceFilesText(row: ProjectWorkStatusExportRow): string {
  const visibleFiles = row.source_files.slice(0, 4);
  const hiddenFileCount = Math.max(0, row.source_files.length - visibleFiles.length);
  const suffix = hiddenFileCount ? ` 외 ${hiddenFileCount.toLocaleString()}개` : "";
  return `진행로그 ${row.source_file_count.toLocaleString()}개 · ${visibleFiles.join(", ")}${suffix}`;
}

export function workSourceFileRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    "handoff-log": "핸드오프 로그",
    "work-log": "작업 로그",
    "project-status": "프로젝트 상태",
    "progress-log": "진행 로그",
    "generated-report": "생성 리포트",
    "dated-work-log": "날짜별 작업 로그",
    "progress-artifact": "진행 산출물",
  };
  return labels[role] ?? role;
}

function workSourceFileRolesInlineText(items: { text: string; count: number }[]): string {
  return items
    .slice(0, 4)
    .map((item) => `${workSourceFileRoleLabel(item.text)} ${item.count.toLocaleString()}개`)
    .join(", ");
}

export function workStatusExportRowSourceRolesText(row: ProjectWorkStatusExportRow): string {
  if (!row.source_file_roles.length) return "로그 유형 없음";
  return [
    `로그 유형 · ${workSourceFileRolesInlineText(row.source_file_roles)}`,
    `최근 ${workSourceFileRoleLabel(row.latest_source_role)}`,
  ].join(" · ");
}

export function workStatusExportRowSourceStatusesText(row: ProjectWorkStatusExportRow): string {
  if (!row.source_statuses.length) return "진행 상태값 없음";
  return `진행 상태 · ${frequencyItemsInlineText(row.source_statuses)}`;
}

export function workStatusExportRowSessionSourcesText(row: ProjectWorkStatusExportRow): string {
  const reviewedText = row.has_session_evidence_reviewed_item
    ? `검토완료 audit ${row.session_evidence_reviewed_item_count.toLocaleString()}건`
    : null;
  if (row.session_evidence_count <= 0 || !row.session_sources.length) {
    return [
      "매칭된 세션 근거 없음",
      reviewedText,
      workStatusExportRowSessionEvidenceAuditText(row),
      workStatusExportRowSessionDateHintText(row),
    ].filter((part): part is string => part !== null).join(" · ");
  }
  return [
    `세션 소스 · ${frequencyItemsInlineText(row.session_sources)}`,
    `고유 ${row.unique_session_evidence_count.toLocaleString()}건`,
    reviewedText,
  ].filter((part): part is string => part !== null).join(" · ");
}

function workStatusExportRowSessionDateHintText(row: ProjectWorkStatusExportRow): string | null {
  if (row.same_project_same_date_session_count > 0) {
    return `같은 날짜 후보 ${row.same_project_same_date_session_count.toLocaleString()}건`;
  }
  if (!row.nearest_same_project_other_session_date) {
    return null;
  }
  const distanceText = row.nearest_same_project_other_session_distance_days === null
    ? ""
    : ` · ${row.nearest_same_project_other_session_distance_days.toLocaleString()}일 차이`;
  return `가장 가까운 같은 프로젝트 세션 ${row.nearest_same_project_other_session_date}${distanceText}`;
}

export function workStatusExportRowSessionEvidenceAuditText(row: ProjectWorkStatusExportRow): string {
  const labels: Record<string, string> = {
    matched: "세션 근거 매칭 완료",
    "bounded-session-limit": "제한된 근거만 사용 중",
    "unresolved-after-full-index": "전체 인덱스에서도 미해결",
    "no-session-index": "세션 인덱스 없음",
    "status-snapshot": "프로젝트 상태 스냅샷",
  };
  return labels[row.session_evidence_audit] ?? `알 수 없는 세션 감사 상태 ${row.session_evidence_audit}`;
}

function frequencyItemsInlineText(items: { text: string; count: number }[]): string {
  return items
    .slice(0, 4)
    .map((item) => `${item.text} ${item.count.toLocaleString()}건`)
    .join(", ");
}

function workSummarySessionEvidenceModeLabel(mode: string): string {
  if (mode === "metadata-first-raw-fallback") {
    return "근거 메타데이터 우선/raw fallback";
  }
  return `근거 ${mode}`;
}

export function workSummaryPersistenceText(result: ProjectWorkSummaryResult): string | null {
  if (!result.persistence) return null;
  return [
    pathDisplayText(result.persistence.database_path),
    `스냅샷 #${result.persistence.snapshot_id.toLocaleString()} 저장`,
    `총 ${result.persistence.snapshot_count.toLocaleString()}개`,
  ].join(" · ");
}

export function workSummarySnapshotExtractionMergeText(
  snapshot: ProjectWorkSummarySnapshot,
): string | null {
  if (!snapshot.extraction_merge) return null;
  return workSummaryExtractionMergeText(snapshot.extraction_merge);
}

function workSummaryExtractionMergeText(
  merge: NonNullable<ProjectWorkSummaryResult["extraction_merge"]>,
): string {
  const label = merge.provider === "saved-extraction-items" ? "저장 병합" : "AI 병합";
  return `${label} ${merge.merged_item_count.toLocaleString()}개`;
}

export function workSummarySnapshotsActionLabel(
  state: WorkSummarySnapshotsState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "작업 요약 스냅샷 기록 불러오는 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 작업 요약 스냅샷 기록을 ${hasResult ? "새로고침" : "불러오기"}할 수 없습니다`;
  }
  return hasResult ? "작업 요약 스냅샷 기록 새로고침" : "작업 요약 스냅샷 기록 불러오기";
}

export function workSummarySnapshotsMetaText(
  state: WorkSummarySnapshotsState,
  result: ProjectWorkSummarySnapshotsResult | null,
): string {
  if (state === "loading") return "스냅샷 기록 불러오는 중";
  if (!result) return state === "failed" ? "스냅샷 기록을 사용할 수 없음" : "아직 불러온 스냅샷 기록 없음";
  return [
    `저장 ${result.total_snapshots.toLocaleString()}개`,
    `표시 ${result.returned_snapshot_count.toLocaleString()}개`,
  ].join(" · ");
}

export function workSummarySnapshotsFailureText(state: WorkSummarySnapshotsState): string | null {
  if (state !== "failed") return null;
  return "저장된 프로젝트 작업 요약 스냅샷을 불러오지 못했습니다. 브리지 상태나 데이터베이스 경로를 확인하세요.";
}

export function workLogCoverageActionLabel(
  state: WorkLogCoverageState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "작업 로그 범위 확인 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 작업 로그 범위를 ${hasResult ? "새로고침" : "확인"}할 수 없습니다`;
  }
  return hasResult ? "작업 로그 범위 새로고침" : "작업 로그 범위 확인";
}

export function workLogCoverageMetaText(
  state: WorkLogCoverageState,
  result: ProjectWorkLogCoverageResult | null,
): string {
  if (state === "loading") return "작업 로그 범위 확인 중";
  if (!result) return state === "failed" ? "작업 로그 범위를 사용할 수 없음" : "아직 확인한 작업 로그 범위 없음";
  const parts = [
    `${result.files_seen.toLocaleString()}개 로그`,
    `parsed ${result.parsed_file_count.toLocaleString()}개`,
    `unparsed ${result.unparsed_file_count.toLocaleString()}개`,
  ];
  if (result.unreadable_file_count > 0) {
    parts.push(`unreadable ${result.unreadable_file_count.toLocaleString()}개`);
  }
  if (result.pointer_file_count > 0) {
    parts.push(`pointer ${result.pointer_file_count.toLocaleString()}개`);
  }
  parts.push(
    `${result.project_count.toLocaleString()}개 프로젝트`,
    `작업 ${result.work_item_count.toLocaleString()}개`,
  );
  return parts.join(" · ");
}

export function workLogCoverageFailureText(state: WorkLogCoverageState): string | null {
  if (state !== "failed") return null;
  return "프로젝트 작업 로그 범위를 불러오지 못했습니다. 진행 로그 경로나 브리지 상태를 확인하세요.";
}

export function workLogCandidatesActionLabel(
  state: WorkLogCandidatesState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "AI 추출 후보 확인 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 AI 추출 후보를 ${hasResult ? "새로고침" : "확인"}할 수 없습니다`;
  }
  return hasResult ? "AI 추출 후보 새로고침" : "AI 추출 후보 확인";
}

export function workLogCandidatesMetaText(
  state: WorkLogCandidatesState,
  result: ProjectWorkLogExtractionCandidatesResult | null,
): string {
  if (state === "loading") return "AI 추출 후보 확인 중";
  if (!result) return state === "failed" ? "AI 추출 후보를 사용할 수 없음" : "아직 확인한 AI 추출 후보 없음";
  return [
    workLogCandidateQueueText(result),
    `이유 ${workLogCandidateQueueReasonText(result.review_queue_reason)}`,
    `pending ${result.pending_review_count.toLocaleString()}개`,
    `AI 전송가능 ${result.safe_ai_candidate_count.toLocaleString()}개`,
    `위험차단 ${result.risk_blocked_candidate_count.toLocaleString()}개`,
    `parsed 제외 ${result.skipped_parsed_file_count.toLocaleString()}개`,
    `unreadable ${result.skipped_unreadable_file_count.toLocaleString()}개`,
    `empty ${result.skipped_empty_file_count.toLocaleString()}개`,
    `pointer ${result.skipped_pointer_file_count.toLocaleString()}개`,
  ].join(" · ");
}

function workLogCandidateQueueText(result: ProjectWorkLogExtractionCandidatesResult): string {
  const state = result.review_queue_state === "empty"
    ? "비어 있음"
    : result.review_queue_state === "needs_review"
      ? "검토 필요"
      : result.review_queue_state;
  return `백필큐 ${state}`;
}

function workLogCandidateQueueReasonText(reason: string): string {
  switch (reason) {
    case "no_unparsed_progress_logs":
      return "unparsed 없음";
    case "unparsed_logs_without_excerpt":
      return "excerpt 없음";
    case "unreadable_progress_logs":
      return "읽기 실패";
    case "safe_ai_candidates_ready":
      return "AI 후보 준비";
    case "mixed_safe_and_risk_blocked_candidates":
      return "AI/로컬 검토 혼합";
    case "risk_blocked_candidates_need_local_review":
      return "로컬 검토 필요";
    default:
      return reason;
  }
}

export function workLogCandidatesFailureText(state: WorkLogCandidatesState): string | null {
  if (state !== "failed") return null;
  return "AI 추출 후보를 불러오지 못했습니다. 진행 로그 경로나 브리지 상태를 확인하세요.";
}

export function workAiProviderStatusActionLabel(
  state: WorkAiProviderStatusState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "AI provider 상태 확인 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 AI provider 상태를 ${hasResult ? "새로고침" : "확인"}할 수 없습니다`;
  }
  return hasResult ? "AI provider 상태 새로고침" : "AI provider 상태";
}

export function workAiProviderStatusMetaText(
  state: WorkAiProviderStatusState,
  result: ProjectWorkAiProviderStatusResult | null,
): string {
  if (state === "loading") return "AI provider 상태 확인 중";
  if (!result) {
    return state === "failed"
      ? "AI provider 상태를 사용할 수 없음"
      : "아직 확인한 AI provider 상태 없음";
  }
  const openai = result.providers.find((provider) => provider.provider === "openai");
  const glm = result.providers.find((provider) => provider.provider === "glm");
  const codex = result.providers.find((provider) => provider.provider === "codex");
  const parts = [
    result.external_provider_available ? "외부 AI 사용 가능" : "외부 AI 미설정",
    `OpenAI ${providerConfiguredLabel(openai)}`,
    `GLM ${providerConfiguredLabel(glm)}`,
    `Codex ${codexProviderStatusLabel(codex)}`,
    `fallback ${result.fallback_provider}`,
  ];
  if (result.warnings.length > 0) {
    parts.push(`경고 ${result.warnings.length.toLocaleString()}개`);
  }
  return parts.join(" · ");
}

export function workAiProviderStatusFailureText(
  state: WorkAiProviderStatusState,
): string | null {
  if (state !== "failed") return null;
  return "AI provider 상태를 확인하지 못했습니다. 브리지 상태와 로컬 provider 설정을 확인하세요.";
}

export function workAiProviderStatusProviderText(
  provider: ProjectWorkAiProviderStatusProvider,
): string {
  const parts = [
    workAiProviderDisplayName(provider),
    provider.configured ? "configured" : "미설정",
    provider.usable_for_work_management ? "work-management 사용 가능" : "사용 불가",
    provider.provider_runtime,
  ];
  if (provider.model) {
    parts.push(`model ${provider.model}`);
  }
  if (provider.endpoint) {
    parts.push(provider.endpoint);
  }
  if (provider.timeout_seconds !== null) {
    parts.push(`timeout ${provider.timeout_seconds.toLocaleString()}s`);
  }
  if (provider.capabilities.length > 0) {
    parts.push(`capabilities ${provider.capabilities.map(workAiProviderCapabilityLabel).join(", ")}`);
  }
  return parts.join(" · ");
}

export function workAiProviderHealthActionLabel(
  state: WorkAiProviderHealthState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "AI provider live probe 실행 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 AI provider live probe를 ${hasResult ? "다시 실행" : "실행"}할 수 없습니다`;
  }
  return hasResult ? "AI provider live probe 다시 실행" : "AI provider live probe";
}

export function workAiProviderHealthMetaText(
  state: WorkAiProviderHealthState,
  result: ProjectWorkAiProviderHealthResult | null,
): string {
  if (state === "loading") return "AI provider live probe 실행 중";
  if (!result) {
    return state === "failed"
      ? "AI provider live probe를 사용할 수 없음"
      : "아직 실행한 AI provider live probe 없음";
  }
  const okCount = result.providers.filter((provider) => provider.live_ok).length;
  const attemptedCount = result.providers.filter((provider) => provider.probe_attempted).length;
  const failedCount = result.providers.filter((provider) => provider.health_status === "failed").length;
  const skippedCount = result.providers.filter((provider) => provider.health_status === "skipped").length;
  const parts = [
    result.live_provider_available ? "live provider 있음" : "live provider 없음",
    `ok ${okCount.toLocaleString()}개`,
    `attempted ${attemptedCount.toLocaleString()}개`,
  ];
  if (failedCount > 0) parts.push(`failed ${failedCount.toLocaleString()}개`);
  if (skippedCount > 0) parts.push(`skipped ${skippedCount.toLocaleString()}개`);
  if (result.warnings.length > 0) parts.push(`경고 ${result.warnings.length.toLocaleString()}개`);
  return parts.join(" · ");
}

export function workAiProviderHealthFailureText(
  state: WorkAiProviderHealthState,
): string | null {
  if (state !== "failed") return null;
  return "AI provider live probe를 실행하지 못했습니다. 브리지 상태와 provider 설정을 확인하세요.";
}

export function workAiProviderHealthProviderText(
  provider: ProjectWorkAiProviderHealthProvider,
): string {
  const parts = [
    workAiProviderName(provider.provider),
    providerHealthStatusLabel(provider.health_status),
    provider.probe_attempted ? "probe 실행" : "probe 미실행",
    provider.live_ok ? "live ok" : "live 미확인",
    provider.provider_runtime,
  ];
  if (provider.model) parts.push(`model ${provider.model}`);
  if (provider.endpoint) parts.push(provider.endpoint);
  if (provider.timeout_seconds !== null) {
    parts.push(`timeout ${provider.timeout_seconds.toLocaleString()}s`);
  }
  if (provider.duration_ms !== null) {
    parts.push(`${provider.duration_ms.toLocaleString()}ms`);
  }
  if (provider.http_status !== null) {
    parts.push(`HTTP ${provider.http_status.toLocaleString()}`);
  }
  if (provider.error) {
    parts.push(provider.error);
  }
  return parts.join(" · ");
}

function providerHealthStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_configured: "미설정",
    skipped: "건너뜀",
    ok: "정상",
    failed: "실패",
  };
  return labels[status] ?? status;
}

function workAiProviderCapabilityLabel(capability: string): string {
  const labels: Record<string, string> = {
    "work-summary": "작업 요약",
    "work-log-extraction": "진행로그 추출",
    "work-log-normalization": "제목 정규화",
    "session-evidence-proposals": "세션근거 제안",
  };
  return labels[capability] ?? capability;
}

function providerConfiguredLabel(
  provider: ProjectWorkAiProviderStatusProvider | undefined,
): string {
  return provider?.configured ? "configured" : "미설정";
}

function codexProviderStatusLabel(
  provider: ProjectWorkAiProviderStatusProvider | undefined,
): string {
  if (!provider) return "미설정";
  if (provider.usable_for_work_management) return "사용 가능";
  if (provider.configured) return "CLI 감지/미연결";
  return "미구현";
}

function workAiProviderDisplayName(provider: ProjectWorkAiProviderStatusProvider): string {
  return workAiProviderName(provider.provider);
}

function workAiProviderName(provider: string): string {
  if (provider === "openai") return "OpenAI";
  if (provider === "glm") return "GLM";
  if (provider === "codex") return "Codex";
  return provider;
}

export function workLogReviewQueueActionLabel(
  state: WorkLogReviewQueueState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "백필큐 동기화 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 백필큐를 ${hasResult ? "새로고침" : "동기화"}할 수 없습니다`;
  }
  return hasResult ? "백필큐 새로고침" : "백필큐 동기화";
}

export function workLogReviewQueueMetaText(
  state: WorkLogReviewQueueState,
  result: ProjectWorkLogReviewQueueResult | null,
): string {
  if (state === "loading") return "백필큐 동기화 중";
  if (!result) return state === "failed" ? "백필큐를 사용할 수 없음" : "아직 동기화한 백필큐 없음";
  return [
    `큐 저장 ${result.total_items.toLocaleString()}개`,
    `표시 ${result.returned_item_count.toLocaleString()}개`,
    `동기화 ${result.synced_candidate_count.toLocaleString()}개`,
    `stale 전환 ${result.stale_candidate_count.toLocaleString()}개`,
    `AI 대기 ${result.pending_ai_review_count.toLocaleString()}개`,
    `위험차단 ${result.risk_blocked_count.toLocaleString()}개`,
    `stale ${result.stale_count.toLocaleString()}개`,
    `승인 ${result.approved_count.toLocaleString()}개`,
    `거절 ${result.rejected_count.toLocaleString()}개`,
  ].join(" · ");
}

export function workLogReviewQueueFailureText(state: WorkLogReviewQueueState): string | null {
  if (state !== "failed") return null;
  return "백필큐를 동기화하지 못했습니다. 데이터베이스 경로, 진행 로그 후보, 브리지 상태를 확인하세요.";
}

export function workLogReviewQueueItemStateText(item: ProjectWorkLogReviewQueueItem): string {
  const labels: Record<string, string> = {
    approved: "승인됨",
    pending_ai_review: "AI 검토 대기",
    rejected: "거절됨",
    risk_blocked: "위험 차단",
    stale: "현재 후보 아님",
  };
  return `${labels[item.review_state] ?? item.review_state} · ${workLogReviewQueueReasonText(item.review_reason)}`;
}

function workLogReviewQueueReasonText(reason: string): string {
  const labels: Record<string, string> = {
    candidate_no_longer_live: "live 후보에서 사라짐",
    operator_approved_for_backfill: "운영자가 백필 검토 승인",
    operator_rejected_from_backfill: "운영자가 백필 검토 거절",
    risk_flags_require_local_review: "위험 패턴으로 로컬 검토 필요",
    safe_ai_candidate_ready: "AI provider 전송 가능",
  };
  return labels[reason] ?? reason;
}

export function workLogCandidateReviewLabel(
  candidate: ProjectWorkLogExtractionCandidate,
): string {
  const riskFlags = candidate.risk_flags.map(riskFlagLabel).filter((label) => label !== "알 수 없음");
  if (riskFlags.length) {
    return `문서 위험 패턴 있음 · 줄 단위 안전 추출만 허용: ${riskFlags.join(", ")}`;
  }
  return "AI 검토 가능 · 로컬 날짜 bullet 탐색";
}

export function workLogExtractionActionLabel(
  state: WorkLogExtractionState,
  hasResult: boolean,
  lockState: ActionLockState,
  mode: WorkLogExtractionRunMode = "ai",
): string {
  const label = mode === "local" ? "로컬 작업 추출 제안" : "AI 작업 추출 제안";
  if (state === "loading") return `${label} 생성 중`;
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 ${label}을 ${hasResult ? "새로고침" : "생성"}할 수 없습니다`;
  }
  return hasResult ? `${label} 새로고침` : label;
}

export function workLogExtractionMetaText(
  state: WorkLogExtractionState,
  result: ProjectWorkLogExtractionProposalsResult | null,
  mode: WorkLogExtractionRunMode = "ai",
): string {
  const label = mode === "local" ? "로컬 작업 추출 제안" : "AI 작업 추출 제안";
  if (state === "loading") return `${label} 생성 중`;
  if (!result) return state === "failed" ? "AI 작업 추출 제안을 사용할 수 없음" : `아직 생성한 ${label} 없음`;
  return [
    workLogExtractionProviderRuntimeText(result),
    `후보 ${result.candidate_count.toLocaleString()}개`,
    `accepted ${result.accepted_count.toLocaleString()}개`,
    `rejected ${result.rejected_count.toLocaleString()}개`,
  ].join(" · ");
}

function workLogExtractionProviderRuntimeText(
  result: ProjectWorkLogExtractionProposalsResult,
): string {
  const parts = [result.used_ai ? `AI ${result.provider}` : `로컬 ${result.provider}`];
  if (result.provider_runtime !== result.provider) {
    parts.push(result.provider_runtime);
  }
  if (result.provider_model) {
    parts.push(`model ${result.provider_model}`);
  }
  return parts.join(" · ");
}

export function workLogExtractionProviderNoticeText(
  result: ProjectWorkLogExtractionProposalsResult | null,
  mode: WorkLogExtractionRunMode = "ai",
): string | null {
  if (!result?.warnings.length) return null;
  const providerText = result.used_ai
    ? `AI ${result.provider} 사용`
    : mode === "local"
      ? "로컬 추출 사용"
      : result.provider === "local-extraction-rules"
      ? "로컬 fallback 사용"
      : `로컬 ${result.provider} 사용`;
  return `${providerText} · 경고 ${result.warnings.length.toLocaleString()}개`;
}

export function workLogExtractionPersistenceText(
  result: ProjectWorkLogExtractionProposalsResult,
): string | null {
  if (!result.persistence) return null;
  return [
    `accepted 제안 ${result.persistence.saved_item_count.toLocaleString()}개 저장`,
    `총 ${result.persistence.total_saved_item_count.toLocaleString()}개`,
  ].join(" · ");
}

export function workLogExtractionApprovalText(
  result: ProjectWorkLogExtractionProposalsResult | null,
  selectedApprovedCount: number,
): string | null {
  if (!result) return null;
  const pendingText = `저장 대기 ${selectedApprovedCount.toLocaleString()}개 / accepted ${result.accepted_count.toLocaleString()}개`;
  if (!result.persistence) return pendingText;
  return [
    `저장 완료 ${result.persistence.saved_item_count.toLocaleString()}개`,
    pendingText,
  ].join(" · ");
}

export function workLogExtractionRejectionSummaryText(
  result: ProjectWorkLogExtractionProposalsResult | null,
): string | null {
  if (!result || result.rejected_count <= 0) return null;
  const counts = new Map<string, number>();
  for (const proposal of result.proposals) {
    if (proposal.accepted) continue;
    const label = workLogExtractionRejectionSummaryLabel(proposal.rejection_reason);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  if (!counts.size) return null;
  const orderedLabels = ["AI 검토 필요", "위험 제외", "검증 실패", "거절 사유 없음", "기타"];
  const parts = orderedLabels
    .filter((label) => counts.has(label))
    .map((label) => `${label} ${counts.get(label)?.toLocaleString()}개`);
  return `보류 사유 ${parts.join(" · ")}`;
}

function workLogExtractionRejectionSummaryLabel(reason: string | null): string {
  if (!reason) return "거절 사유 없음";
  const labels: Record<string, string> = {
    candidate_has_risk_flags: "위험 제외",
    evidence_has_risk_flags: "위험 제외",
    local_fallback_requires_ai_review: "AI 검토 필요",
    missing_ai_proposal: "AI 검토 필요",
    title_has_risk_flags: "위험 제외",
  };
  return labels[reason] ?? (reason.trim() ? "검증 실패" : "거절 사유 없음");
}

export function workLogExtractionSavedCandidateIds(
  result: ProjectWorkLogExtractionItemsResult | null,
): Set<string> {
  return new Set((result?.items ?? []).map((item) => item.candidate_id));
}

export function workLogExtractionUnsavedAcceptedIds(
  result: ProjectWorkLogExtractionProposalsResult | null,
  savedCandidateIds: ReadonlySet<string>,
): string[] {
  return (result?.proposals ?? [])
    .filter((proposal) => proposal.accepted && !savedCandidateIds.has(proposal.candidate_id))
    .map((proposal) => proposal.candidate_id);
}

export function workLogProposalSaveStateText(
  proposal: ProjectWorkLogExtractionProposal,
  savedCandidateIds: ReadonlySet<string>,
): string | null {
  if (!proposal.accepted) return null;
  return savedCandidateIds.has(proposal.candidate_id) ? "저장됨" : "저장 승인";
}

export function workLogExtractionFailureText(state: WorkLogExtractionState): string | null {
  if (state !== "failed") return null;
  return "AI 작업 추출 제안을 불러오지 못했습니다. provider 설정, 진행 로그 경로, 브리지 상태를 확인하세요.";
}

export function workLogExtractionReviewLabel(
  proposal: ProjectWorkLogExtractionProposal,
  result: ProjectWorkLogExtractionProposalsResult,
): string {
  if (proposal.accepted) {
    if (result.used_ai) return "AI 검증 저장 가능";
    if (result.provider === "local-extraction-rules") return "로컬 규칙 저장 가능";
    return "로컬 저장 가능";
  }
  return workLogExtractionRejectionReviewLabel(proposal.rejection_reason);
}

function workLogExtractionRejectionReviewLabel(reason: string | null): string {
  if (!reason) return "검증 실패 · 거절 사유 없음";
  const labels: Record<string, string> = {
    candidate_has_risk_flags: "건너뜀 · 위험 패턴 포함",
    date_not_in_source: "검증 실패 · 날짜가 원문에 없음",
    evidence_has_risk_flags: "건너뜀 · 근거 위험 패턴 포함",
    evidence_not_in_source: "검증 실패 · 근거가 원문에 없음",
    invalid_date: "검증 실패 · 날짜 형식 오류",
    local_fallback_requires_ai_review: "AI 검토 필요 · 로컬 확정 불가",
    missing_ai_proposal: "AI 검토 필요 · 제안 없음",
    missing_date: "검증 실패 · 날짜 없음",
    title_has_risk_flags: "건너뜀 · 제목 위험 패턴 포함",
    title_not_in_source: "검증 실패 · 제목이 원문에 없음",
  };
  return labels[reason] ?? `검증 실패 · ${reason}`;
}

export function workLogExtractionItemsActionLabel(
  state: WorkLogExtractionItemsState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "저장된 추출 작업 불러오는 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 저장된 추출 작업을 ${hasResult ? "새로고침" : "불러오기"}할 수 없습니다`;
  }
  return hasResult ? "저장된 추출 작업 새로고침" : "저장된 추출 작업 보기";
}

export function workLogExtractionItemsMetaText(
  state: WorkLogExtractionItemsState,
  result: ProjectWorkLogExtractionItemsResult | null,
): string {
  if (state === "loading") return "저장 추출 작업 불러오는 중";
  if (!result) return state === "failed" ? "저장 추출 작업을 사용할 수 없음" : "아직 불러온 저장 추출 작업 없음";
  return [
    `저장 ${result.total_items.toLocaleString()}개`,
    `표시 ${result.returned_item_count.toLocaleString()}개`,
    `${result.available_dates.length.toLocaleString()}일`,
    `${result.available_projects.length.toLocaleString()}개 프로젝트`,
  ].join(" · ");
}

export function workLogExtractionItemsFailureText(
  state: WorkLogExtractionItemsState,
): string | null {
  if (state !== "failed") return null;
  return "저장된 AI 작업 추출 항목을 불러오지 못했습니다. 데이터베이스 경로나 브리지 상태를 확인하세요.";
}

export function workLogExtractionRunsActionLabel(
  state: WorkLogExtractionRunsState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "작업 추출 실행 이력 불러오는 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 작업 추출 실행 이력을 ${hasResult ? "새로고침" : "불러오기"}할 수 없습니다`;
  }
  return hasResult ? "작업 추출 실행 이력 새로고침" : "실행 이력";
}

export function workLogExtractionRunsMetaText(
  state: WorkLogExtractionRunsState,
  result: ProjectWorkLogExtractionRunsResult | null,
): string {
  if (state === "loading") return "작업 추출 실행 이력 불러오는 중";
  if (!result) return state === "failed" ? "작업 추출 실행 이력을 사용할 수 없음" : "아직 불러온 작업 추출 실행 이력 없음";
  const latest = result.runs[0];
  const latestText = latest
    ? `최근 ${latest.trigger} · ${latest.status} · saved ${latest.saved_item_count.toLocaleString()}개`
    : "최근 실행 없음";
  return [
    `실행 ${result.total_runs.toLocaleString()}개`,
    `표시 ${result.returned_run_count.toLocaleString()}개`,
    latestText,
  ].join(" · ");
}

export function workLogExtractionRunsFailureText(
  state: WorkLogExtractionRunsState,
): string | null {
  if (state !== "failed") return null;
  return "작업 추출 실행 이력을 불러오지 못했습니다. 데이터베이스 경로나 브리지 상태를 확인하세요.";
}

export function workLogNormalizationCandidatesActionLabel(
  state: WorkLogNormalizationCandidatesState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "AI 정규화 후보 확인 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 AI 정규화 후보를 ${hasResult ? "새로고침" : "확인"}할 수 없습니다`;
  }
  return hasResult ? "AI 정규화 후보 새로고침" : "AI 정규화 후보 확인";
}

export function workLogNormalizationCandidatesMetaText(
  state: WorkLogNormalizationCandidatesState,
  result: ProjectWorkLogNormalizationCandidatesResult | null,
): string {
  if (state === "loading") return "AI 정규화 후보 확인 중";
  if (!result) {
    return state === "failed"
      ? "AI 정규화 후보를 사용할 수 없음"
      : "아직 확인한 AI 정규화 후보 없음";
  }
  const riskyCount = result.candidates.filter((candidate) => candidate.risk_flags.length > 0).length;
  return [
    `정규화 후보 ${result.total_candidate_count.toLocaleString()}개`,
    `표시 ${result.returned_candidate_count.toLocaleString()}개`,
    `원본 작업 ${result.report_total_items.toLocaleString()}개`,
    `${result.report_project_count.toLocaleString()}개 프로젝트`,
    `${result.report_date_count.toLocaleString()}일`,
    `위험표시 ${riskyCount.toLocaleString()}개`,
  ].join(" · ");
}

export function workLogNormalizationCandidatesFailureText(
  state: WorkLogNormalizationCandidatesState,
): string | null {
  if (state !== "failed") return null;
  return "AI 정규화 후보를 불러오지 못했습니다. 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.";
}

export function workLogNormalizationProposalsActionLabel(
  state: WorkLogNormalizationProposalsState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "AI 정규화 제안 생성 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 AI 정규화 제안을 ${hasResult ? "새로고침" : "생성"}할 수 없습니다`;
  }
  return hasResult ? "AI 정규화 제안 새로고침" : "AI 정규화 제안 생성";
}

export function workLogNormalizationProposalsMetaText(
  state: WorkLogNormalizationProposalsState,
  result: ProjectWorkLogNormalizationProposalsResult | null,
): string {
  if (state === "loading") return "AI 정규화 제안 생성 중";
  if (!result) {
    return state === "failed"
      ? "AI 정규화 제안을 사용할 수 없음"
      : "아직 생성한 AI 정규화 제안 없음";
  }
  const providerText = result.used_ai
    ? `${result.provider}${result.provider_model ? `/${result.provider_model}` : ""}`
    : result.provider;
  const parts = [
    `정규화 제안 ${result.returned_proposal_count.toLocaleString()}개`,
    `accepted ${result.accepted_count.toLocaleString()}개`,
    `review ${result.rejected_count.toLocaleString()}개`,
    `후보 ${result.total_candidate_count.toLocaleString()}개`,
    providerText,
    `${result.report_project_count.toLocaleString()}개 프로젝트`,
    `${result.report_date_count.toLocaleString()}일`,
  ];
  if (result.warnings.length > 0) {
    parts.push(`경고 ${result.warnings.length.toLocaleString()}개`);
  }
  return parts.join(" · ");
}

export function workLogNormalizationProposalsFailureText(
  state: WorkLogNormalizationProposalsState,
): string | null {
  if (state !== "failed") return null;
  return "AI 정규화 제안을 생성하지 못했습니다. provider 키, 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.";
}

export function workLogNormalizationProposalWarningNoticeText(
  result: ProjectWorkLogNormalizationProposalsResult | null,
): string | null {
  if (!result?.warnings.length) return null;
  const providerText = result.used_ai
    ? `AI ${result.provider}${result.provider_model ? `/${result.provider_model}` : ""} 사용`
    : "로컬 fallback 사용";
  return `${providerText} · 경고 ${result.warnings.length.toLocaleString()}개`;
}

export function workLogNormalizationProposalReviewLabel(
  proposal: Pick<ProjectWorkLogNormalizationProposal, "accepted" | "rejection_reason">,
): string {
  if (proposal.accepted) return "AI 정규화 accepted";
  return workLogNormalizationRejectionReviewLabel(proposal.rejection_reason);
}

export function workLogNormalizationRejectionReviewLabel(reason: string | null): string {
  if (!reason) return "검증 실패 · 거절 사유 없음";
  const labels: Record<string, string> = {
    candidate_has_risk_flags: "건너뜀 · 후보 위험 패턴 포함",
    empty_normalized_evidence: "검증 실패 · 근거 없음",
    empty_normalized_status: "검증 실패 · 상태 없음",
    empty_normalized_title: "검증 실패 · 제목 없음",
    evidence_not_in_candidate_evidence: "검증 실패 · 근거가 후보 원문에 없음",
    invalid_confidence: "검증 실패 · confidence 형식 오류",
    invalid_normalized_status: "검증 실패 · 상태 형식 오류",
    local_fallback_requires_ai_review: "AI 검토 필요 · 로컬 확정 불가",
    low_confidence: "검증 실패 · confidence 낮음",
    missing_ai_proposal: "AI 검토 필요 · 제안 없음",
    proposal_has_risk_flags: "건너뜀 · 제안 위험 패턴 포함",
  };
  return labels[reason] ?? `검증 실패 · ${reason}`;
}

export function workLogNormalizationReviewQueueActionLabel(
  state: WorkLogNormalizationReviewQueueState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "정규화 검토 큐 동기화 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 정규화 검토 큐를 ${hasResult ? "새로고침" : "동기화"}할 수 없습니다`;
  }
  return hasResult ? "정규화 검토 큐 새로고침" : "정규화 검토 큐 동기화";
}

export function workLogNormalizationReviewQueueMetaText(
  state: WorkLogNormalizationReviewQueueState,
  result: ProjectWorkLogNormalizationReviewQueueResult | null,
): string {
  if (state === "loading") return "정규화 검토 큐 동기화 중";
  if (!result) {
    return state === "failed"
      ? "정규화 검토 큐를 사용할 수 없음"
      : "아직 동기화한 정규화 검토 큐 없음";
  }
  const parts = [
    `정규화 큐 저장 ${result.total_items.toLocaleString()}개`,
    `표시 ${result.returned_item_count.toLocaleString()}개`,
    `동기화 ${result.synced_proposal_count.toLocaleString()}개`,
    `stale 전환 ${result.stale_proposal_count.toLocaleString()}개`,
    `검토 ${result.pending_review_count.toLocaleString()}개`,
    `stale ${result.stale_count.toLocaleString()}개`,
    `승인 ${result.approved_count.toLocaleString()}개`,
    `거절 ${result.rejected_count.toLocaleString()}개`,
    `AI accepted ${result.accepted_proposal_count.toLocaleString()}개`,
    `review ${result.rejected_proposal_count.toLocaleString()}개`,
  ];
  if (result.warnings.length > 0) {
    parts.push(`경고 ${result.warnings.length.toLocaleString()}개`);
  }
  return parts.join(" · ");
}

export function workLogNormalizationReviewQueueFailureText(
  state: WorkLogNormalizationReviewQueueState,
): string | null {
  if (state !== "failed") return null;
  return "정규화 검토 큐를 동기화하지 못했습니다. 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.";
}

export function canApproveWorkLogNormalizationReviewQueueItem(
  item: ProjectWorkLogNormalizationReviewQueueItem,
): boolean {
  return item.review_state === "pending_review";
}

export function canRejectWorkLogNormalizationReviewQueueItem(
  item: ProjectWorkLogNormalizationReviewQueueItem,
): boolean {
  return item.review_state === "pending_review" || item.review_state === "stale";
}

export function workLogNormalizationReviewQueueItemStateText(
  item: ProjectWorkLogNormalizationReviewQueueItem,
): string {
  const stateText = item.review_state === "pending_review"
    ? "검토 대기"
    : item.review_state === "stale"
      ? "stale"
      : item.review_state === "approved"
        ? "승인됨"
        : "거절됨";
  const proposalText = item.accepted
    ? "AI accepted"
    : workLogNormalizationRejectionReviewLabel(item.rejection_reason);
  const providerText = item.used_ai
    ? `${item.provider}${item.provider_model ? `/${item.provider_model}` : ""}`
    : item.provider;
  return [
    stateText,
    item.review_reason,
    proposalText,
    providerText,
    `confidence ${item.confidence.toFixed(2)}`,
  ].join(" · ");
}

export function workSessionEvidenceProposalsActionLabel(
  state: WorkSessionEvidenceProposalsState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "세션근거 제안 생성 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 세션근거 제안을 ${hasResult ? "새로고침" : "생성"}할 수 없습니다`;
  }
  return hasResult ? "세션근거 제안 새로고침" : "세션근거 제안 생성";
}

export function workSessionEvidenceProposalsMetaText(
  state: WorkSessionEvidenceProposalsState,
  result: ProjectWorkSessionEvidenceProposalsResult | null,
): string {
  if (state === "loading") return "세션근거 제안 생성 중";
  if (!result) {
    return state === "failed"
      ? "세션근거 제안 결과를 사용할 수 없음"
      : "세션근거 제안 결과 없음";
  }
  const providerText = result.used_ai
    ? `AI ${result.provider}${result.provider_model ? `/${result.provider_model}` : ""}`
    : `로컬 ${result.provider}`;
  const parts = [
    providerText,
    result.provider_runtime,
    `후보 ${result.total_candidate_count.toLocaleString()}개`,
    `표시 ${result.returned_proposal_count.toLocaleString()}개`,
    `검토가능 ${result.accepted_count.toLocaleString()}개`,
    `보류 ${result.rejected_count.toLocaleString()}개`,
    `세션인덱스 ${result.report_session_evidence_index_count.toLocaleString()}/${result.report_session_evidence_index_total_count.toLocaleString()}`,
  ];
  if (result.warnings.length > 0) {
    parts.push(`경고 ${result.warnings.length.toLocaleString()}개`);
  }
  return parts.join(" · ");
}

export function workSessionEvidenceProposalsFailureText(
  state: WorkSessionEvidenceProposalsState,
): string | null {
  if (state !== "failed") return null;
  return "세션근거 제안을 생성하지 못했습니다. 세션 인덱스, provider 설정, 브리지 상태를 확인하세요.";
}

export function workSessionEvidenceProposalWarningNoticeText(
  result: ProjectWorkSessionEvidenceProposalsResult | null,
): string | null {
  if (!result?.warnings.length) return null;
  const providerText = result.used_ai
    ? `AI ${result.provider}${result.provider_model ? `/${result.provider_model}` : ""} 사용`
    : "로컬 fallback 사용";
  return `${providerText} · 경고 ${result.warnings.length.toLocaleString()}개`;
}

function workSessionEvidenceProposalKindLabel(proposalKind: string): string {
  if (proposalKind === "source_log_trace") return "소스 로그 trace";
  if (proposalKind === "manual_session_search") return "수동 세션 검색";
  if (proposalKind === "title_normalization_first") return "제목 정규화 우선";
  return "보류";
}

export function workSessionEvidenceProposalKindText(
  proposal: ProjectWorkSessionEvidenceProposal,
): string {
  return workSessionEvidenceProposalKindLabel(proposal.proposal_kind);
}

export function workSessionEvidenceProposalStateText(
  proposal: ProjectWorkSessionEvidenceProposal,
): string {
  const stateText = proposal.accepted
    ? "승인 검토 가능"
    : proposal.rejection_reason ?? "보류";
  return [
    stateText,
    workSessionEvidenceProposalKindText(proposal),
    `confidence ${proposal.confidence.toFixed(2)}`,
    proposal.session_evidence_audit,
  ].join(" · ");
}

export function workSessionEvidenceSourceProposalBlockerText(
  blockerReason: string | null,
): string {
  if (blockerReason === "title_normalization_required_first") {
    return "제목 정규화가 먼저 필요";
  }
  if (blockerReason === "source_trace_not_copied_from_search_hit") {
    return "원본 hit에서 복사된 trace가 아님";
  }
  if (blockerReason === "source_hit_matches_only_project_identifier") {
    return "프로젝트명만 일치해 durable 승인 불가";
  }
  if (blockerReason === "source_hit_matches_only_project_or_generic_terms") {
    return "프로젝트명과 범용 git/status 용어만 일치해 durable 승인 불가";
  }
  if (blockerReason === "source_hit_date_too_far_from_candidate") {
    return "원본 세션 날짜가 작업일과 멀어 durable 승인 불가";
  }
  if (blockerReason === "candidate_or_source_hit_has_risk_flags") {
    return "후보 또는 원본 hit에 risk flag 있음";
  }
  if (blockerReason === "source_trace_is_instruction_only") {
    return "원본 trace가 지시문뿐이라 완료 근거로 승인 불가";
  }
  if (!blockerReason) return "차단 사유 없음";
  return `알 수 없는 차단 사유: ${blockerReason}`;
}

function workSessionEvidenceSourceProposalBlockerSummaryLabel(
  blockerReason: string | null,
): string {
  if (blockerReason === "title_normalization_required_first") return "제목 정규화 우선";
  if (blockerReason === "source_trace_not_copied_from_search_hit") return "trace 복사 불일치";
  if (blockerReason === "source_hit_matches_only_project_identifier") return "프로젝트명만 일치";
  if (blockerReason === "source_hit_matches_only_project_or_generic_terms") return "프로젝트명/범용어만 일치";
  if (blockerReason === "source_hit_date_too_far_from_candidate") return "세션 날짜 멀음";
  if (blockerReason === "candidate_or_source_hit_has_risk_flags") return "risk flag 있음";
  if (blockerReason === "source_trace_is_instruction_only") return "지시문 trace";
  if (!blockerReason) return "차단 사유 없음";
  return blockerReason;
}

export function workSessionEvidenceSourceProposalsBlockerSummaryText(
  result: Pick<
    ProjectWorkSessionEvidenceSourceProposalsResult,
    "blocked_count" | "proposals" | "returned_proposal_count" | "review_ready_count"
  >,
): string {
  const blockerCounts = new Map<string | null, number>();
  let riskProposalCount = 0;
  for (const proposal of result.proposals) {
    if (!proposal.review_ready) {
      blockerCounts.set(
        proposal.blocker_reason,
        (blockerCounts.get(proposal.blocker_reason) ?? 0) + 1,
      );
    }
    if (proposal.risk_flags.length > 0) {
      riskProposalCount += 1;
    }
  }
  const blockerSummary = [...blockerCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([blockerReason, count]) =>
      `${workSessionEvidenceSourceProposalBlockerSummaryLabel(blockerReason)} ${count.toLocaleString()}건`
    )
    .join(", ");
  const parts = [
    `검토 준비 ${result.review_ready_count.toLocaleString()}/${result.returned_proposal_count.toLocaleString()}`,
    `차단 ${result.blocked_count.toLocaleString()}건`,
  ];
  if (blockerSummary) {
    parts.push(`차단 사유 ${blockerSummary}`);
  }
  if (riskProposalCount > 0) {
    parts.push(`위험표시 ${riskProposalCount.toLocaleString()}건`);
  }
  return parts.join(" · ");
}

function workSessionEvidenceSourceAuditOutcomeLabel(outcome: string): string {
  if (outcome === "review_ready") return "검토 준비";
  if (outcome === "blocked") return "차단";
  if (outcome === "no_recommended_source") return "추천 원본 없음";
  if (outcome === "no_source_hits") return "원본 hit 없음";
  if (outcome === "source_not_indexed_for_project") return "프로젝트 색인 불일치";
  if (outcome === "nearby_error") return "근처 세션 오류";
  if (outcome === "source_search_error") return "원본 검색 오류";
  return outcome;
}

const WORK_SESSION_EVIDENCE_SOURCE_AUDIT_MANUAL_INSPECT_OUTCOMES = new Set([
  "no_source_hits",
  "source_not_indexed_for_project",
  "nearby_error",
  "source_search_error",
]);

function workSessionEvidenceSourceAuditFrequencySummaryText(
  items: { text: string; count: number }[],
  label: (text: string) => string,
): string {
  return items
    .map((item) => `${label(item.text)} ${item.count.toLocaleString()}건`)
    .join(", ");
}

export function workSessionEvidenceSourceAuditMetaText(
  result: Pick<
    ProjectWorkSessionEvidenceSourceAuditResult,
    | "audited_item_count"
    | "blocker_reason_counts"
    | "max_lines_used"
    | "nearby_limit_used"
    | "no_recommended_source_count"
    | "no_source_hit_count"
    | "outcome_counts"
    | "returned_item_count"
    | "risk_flag_counts"
    | "rows_with_blocked_proposals_count"
    | "rows_with_review_ready_count"
    | "source_limit_used"
    | "total_blocked_count"
    | "total_review_ready_count"
  >,
): string {
  const outcomeSummary = workSessionEvidenceSourceAuditFrequencySummaryText(
    result.outcome_counts,
    workSessionEvidenceSourceAuditOutcomeLabel,
  );
  const blockerSummary = workSessionEvidenceSourceAuditFrequencySummaryText(
    result.blocker_reason_counts,
    workSessionEvidenceSourceProposalBlockerSummaryLabel,
  );
  const riskSummary = workSessionEvidenceSourceAuditFrequencySummaryText(
    result.risk_flag_counts,
    riskFlagLabel,
  );
  const parts = [
    `감사 ${result.audited_item_count.toLocaleString()}/${result.returned_item_count.toLocaleString()}행`,
    `검토 준비 row ${result.rows_with_review_ready_count.toLocaleString()}개`,
    `review-ready proposal ${result.total_review_ready_count.toLocaleString()}개`,
    `차단 row ${result.rows_with_blocked_proposals_count.toLocaleString()}개`,
    `차단 proposal ${result.total_blocked_count.toLocaleString()}개`,
  ];
  if (result.no_recommended_source_count > 0) {
    parts.push(`추천 원본 없음 ${result.no_recommended_source_count.toLocaleString()}개`);
  }
  if (result.no_source_hit_count > 0) {
    parts.push(`원본 hit 없음 ${result.no_source_hit_count.toLocaleString()}개`);
  }
  if (outcomeSummary) {
    parts.push(`결과 ${outcomeSummary}`);
  }
  if (blockerSummary) {
    parts.push(`차단 사유 ${blockerSummary}`);
  }
  if (riskSummary) {
    parts.push(`위험표시 ${riskSummary}`);
  }
  parts.push(
    `근처 limit ${result.nearby_limit_used.toLocaleString()} · source limit ${result.source_limit_used.toLocaleString()} · max lines ${result.max_lines_used.toLocaleString()}`,
  );
  return parts.join(" · ");
}

export function workSessionEvidenceSourceAuditItemText(
  item: ProjectWorkSessionEvidenceSourceAuditResult["items"][number],
): string {
  const parts = [
    workSessionEvidenceSourceAuditOutcomeLabel(item.outcome),
    `근처 ${item.nearby_returned_item_count.toLocaleString()}/${item.nearby_total_match_count.toLocaleString()}`,
    `source hit ${item.source_search_returned_item_count.toLocaleString()}/${item.source_search_matched_line_count.toLocaleString()}`,
    `검토 준비 ${item.review_ready_count.toLocaleString()}개`,
    `차단 ${item.blocked_count.toLocaleString()}개`,
  ];
  const blockerSummary = workSessionEvidenceSourceAuditFrequencySummaryText(
    item.blocker_reason_counts,
    workSessionEvidenceSourceProposalBlockerSummaryLabel,
  );
  const riskSummary = workSessionEvidenceSourceAuditFrequencySummaryText(
    item.risk_flag_counts,
    riskFlagLabel,
  );
  if (item.recommended_prompt_date) {
    parts.push(`추천일 ${item.recommended_prompt_date}`);
  }
  if (item.recommended_match_score !== null) {
    parts.push(`match ${item.recommended_match_score.toLocaleString()}`);
  }
  if (blockerSummary) {
    parts.push(`차단 사유 ${blockerSummary}`);
  }
  if (riskSummary) {
    parts.push(`위험표시 ${riskSummary}`);
  }
  return parts.join(" · ");
}

export function canRejectWorkSessionEvidenceSourceAuditItem(
  item: ProjectWorkSessionEvidenceSourceAuditResult["items"][number],
): boolean {
  return (item.review_state === "pending_review" || item.review_state === "stale")
    && item.outcome !== "review_ready";
}

export function workSessionEvidenceSourceAuditNeedsManualInspect(
  item: ProjectWorkSessionEvidenceSourceAuditResult["items"][number],
): boolean {
  return canRejectWorkSessionEvidenceSourceAuditItem(item)
    && WORK_SESSION_EVIDENCE_SOURCE_AUDIT_MANUAL_INSPECT_OUTCOMES.has(item.outcome);
}

export function workSessionEvidenceSourceAuditManualInspectReasonText(
  item: ProjectWorkSessionEvidenceSourceAuditResult["items"][number],
): string | null {
  if (!workSessionEvidenceSourceAuditNeedsManualInspect(item)) return null;
  if (item.outcome === "no_source_hits") {
    return "수동 확인 필요 · 추천 원본 경로는 있지만 검색 hit 없음";
  }
  if (item.outcome === "source_not_indexed_for_project") {
    return "수동 확인 필요 · 추천 원본 경로가 현재 프로젝트 세션 색인에 없음";
  }
  if (item.outcome === "nearby_error") {
    return "수동 확인 필요 · 근처 세션 조회 실패";
  }
  if (item.outcome === "source_search_error") {
    return "수동 확인 필요 · 추천 원본 검색 실패";
  }
  return "수동 확인 필요";
}

export function canBulkRejectWorkSessionEvidenceSourceAuditItem(
  item: ProjectWorkSessionEvidenceSourceAuditResult["items"][number],
): boolean {
  return canRejectWorkSessionEvidenceSourceAuditItem(item)
    && !workSessionEvidenceSourceAuditNeedsManualInspect(item);
}

export function workSessionEvidenceSourceAuditRejectableItems(
  result: ProjectWorkSessionEvidenceSourceAuditResult | null,
): ProjectWorkSessionEvidenceSourceAuditResult["items"] {
  if (!result) return [];
  return result.items.filter(canRejectWorkSessionEvidenceSourceAuditItem);
}

export function workSessionEvidenceSourceAuditBulkRejectableItems(
  result: ProjectWorkSessionEvidenceSourceAuditResult | null,
): ProjectWorkSessionEvidenceSourceAuditResult["items"] {
  if (!result) return [];
  return result.items.filter(canBulkRejectWorkSessionEvidenceSourceAuditItem);
}

export function workSessionEvidenceSourceAuditManualInspectItems(
  result: ProjectWorkSessionEvidenceSourceAuditResult | null,
): ProjectWorkSessionEvidenceSourceAuditResult["items"] {
  if (!result) return [];
  return result.items.filter(workSessionEvidenceSourceAuditNeedsManualInspect);
}

export function filterWorkSessionEvidenceSourceAuditItems(
  items: ProjectWorkSessionEvidenceSourceAuditResult["items"],
  filter: WorkSessionEvidenceSourceAuditFilter,
): ProjectWorkSessionEvidenceSourceAuditResult["items"] {
  if (filter === "all") return items;
  if (filter === "manual-inspect") {
    return items.filter(workSessionEvidenceSourceAuditNeedsManualInspect);
  }
  if (filter === "bulk-rejectable") {
    return items.filter(canBulkRejectWorkSessionEvidenceSourceAuditItem);
  }
  return items.filter((item) => item.outcome === "review_ready");
}

export function workSessionEvidenceSourceAuditFilterLabel(
  filter: WorkSessionEvidenceSourceAuditFilter,
): string {
  const labels: Record<WorkSessionEvidenceSourceAuditFilter, string> = {
    all: "전체",
    "manual-inspect": "수동 확인 필요",
    "bulk-rejectable": "일괄 거절 가능",
    "review-ready": "검토 준비",
  };
  return labels[filter];
}

export function workSessionEvidenceSourceAuditFilterMetaText(
  filter: WorkSessionEvidenceSourceAuditFilter,
  items: ProjectWorkSessionEvidenceSourceAuditResult["items"],
  filteredItems: ProjectWorkSessionEvidenceSourceAuditResult["items"],
): string {
  const manualInspectCount = items.filter(workSessionEvidenceSourceAuditNeedsManualInspect).length;
  const bulkRejectableCount = items.filter(canBulkRejectWorkSessionEvidenceSourceAuditItem).length;
  const reviewReadyCount = items.filter((item) => item.outcome === "review_ready").length;
  return [
    `원본 감사 필터 ${workSessionEvidenceSourceAuditFilterLabel(filter)}`,
    `결과 ${filteredItems.length.toLocaleString()} / ${items.length.toLocaleString()}행`,
    `수동확인 ${manualInspectCount.toLocaleString()}행`,
    `일괄거절 ${bulkRejectableCount.toLocaleString()}행`,
    `검토준비 ${reviewReadyCount.toLocaleString()}행`,
  ].join(" · ");
}

export function workSessionEvidenceSourceAuditRejectableText(
  result: ProjectWorkSessionEvidenceSourceAuditResult | null,
): string {
  const count = workSessionEvidenceSourceAuditRejectableItems(result).length;
  if (count === 0) return "감사 판정 거절 가능 row 없음";
  return `감사 판정 거절 가능 ${count.toLocaleString()}개`;
}

export function workSessionEvidenceSourceAuditBulkRejectableText(
  result: ProjectWorkSessionEvidenceSourceAuditResult | null,
): string {
  const count = workSessionEvidenceSourceAuditBulkRejectableItems(result).length;
  if (count === 0) return "감사 판정 일괄 거절 가능 row 없음";
  return `감사 판정 일괄 거절 가능 ${count.toLocaleString()}개`;
}

export function workSessionEvidenceSourceAuditManualInspectText(
  result: ProjectWorkSessionEvidenceSourceAuditResult | null,
): string {
  const count = workSessionEvidenceSourceAuditManualInspectItems(result).length;
  if (count === 0) return "수동 확인 필요 row 없음";
  return `수동 확인 필요 ${count.toLocaleString()}개`;
}

export function workSessionEvidenceSourceAuditRejectReason(
  item: ProjectWorkSessionEvidenceSourceAuditResult["items"][number],
): string {
  if (item.outcome === "no_recommended_source") return "source_audit_no_recommended_source";
  if (item.outcome === "no_source_hits") return "source_audit_no_source_hits";
  if (item.outcome === "blocked") {
    const primaryBlocker = item.blocker_reason_counts[0]?.text.trim();
    return primaryBlocker
      ? `source_audit_blocked:${primaryBlocker}`
      : "source_audit_blocked";
  }
  if (item.outcome === "nearby_error" || item.outcome === "source_search_error") {
    return `source_audit_error:${item.outcome}`;
  }
  return `source_audit_${item.outcome || "manual_reject"}`;
}

export function workSessionEvidenceSourceProposalStateText(
  proposal: ProjectWorkSessionEvidenceSourceProposal,
): string {
  const stateText = proposal.review_ready
    ? "검토 준비"
    : `차단됨 · ${workSessionEvidenceSourceProposalBlockerText(proposal.blocker_reason)}`;
  const traceText = proposal.trace_validated ? "복사 trace 검증됨" : "복사 trace 미검증";
  return [
    stateText,
    workSessionEvidenceProposalKindLabel(proposal.proposal_kind),
    traceText,
    `confidence ${proposal.confidence.toFixed(2)}`,
  ].join(" · ");
}

export function workSessionEvidenceSourceProposalRiskText(
  proposal: ProjectWorkSessionEvidenceSourceProposal,
): string | null {
  if (!proposal.risk_flags.length) return null;
  const riskFlags = proposal.risk_flags.map(riskFlagLabel).filter((label) => label !== "알 수 없음");
  return `위험표시 ${riskFlags.length ? riskFlags.join(", ") : "알 수 없음"}`;
}

export function workSessionEvidenceCandidateReasonDiagnosticText(
  reason: string,
): string | null {
  const tokens = reason
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  const nearestDate = tokens
    .find((token) => token.startsWith("nearest_same_project_session_date="))
    ?.split("=", 2)[1]
    ?.trim();
  const nearestDistanceDays = tokens
    .find((token) => token.startsWith("nearest_same_project_session_distance_days="))
    ?.split("=", 2)[1]
    ?.trim();
  const distanceText = nearestDistanceDays && /^\d+$/.test(nearestDistanceDays)
    ? ` · ${nearestDistanceDays}일 차이`
    : "";

  if (tokens.includes("same_project_session_same_date_unmatched")) {
    return "같은 날짜 세션 후보 있음 · 자동 연결 실패 확인 필요";
  }
  if (tokens.includes("same_project_session_other_dates")) {
    return nearestDate
      ? `같은 프로젝트 다른 날짜 세션 있음 · 가장 가까운 날짜 ${nearestDate}${distanceText} · 자동 연결 아님`
      : "같은 프로젝트 다른 날짜 세션 있음 · 자동 연결 아님";
  }
  if (tokens.includes("no_same_project_session_dates")) {
    return "같은 프로젝트 세션 날짜 없음 · 수동 검색 필요";
  }
  return null;
}

export function workSessionEvidenceReviewQueueDateDiagnosticText(
  item: Pick<
    ProjectWorkSessionEvidenceReviewQueueItem,
    | "candidate_reason"
    | "same_project_same_date_session_count"
    | "same_project_other_session_date_count"
    | "nearest_same_project_other_session_date"
  >,
): string | null {
  if (item.same_project_same_date_session_count > 0) {
    return "같은 날짜 세션 후보 있음 · 자동 연결 실패 확인 필요";
  }
  if (item.same_project_other_session_date_count > 0) {
    if (item.nearest_same_project_other_session_date) {
      const reasonHasMatchingNearestDate = item.candidate_reason
        .split(",")
        .map((token) => token.trim())
        .includes(`nearest_same_project_session_date=${item.nearest_same_project_other_session_date}`);
      const reasonDiagnostic = reasonHasMatchingNearestDate
        ? workSessionEvidenceCandidateReasonDiagnosticText(item.candidate_reason)
        : null;
      return reasonDiagnostic
        ?? `같은 프로젝트 다른 날짜 세션 있음 · 가장 가까운 날짜 ${item.nearest_same_project_other_session_date} · 자동 연결 아님`;
    }
    return "같은 프로젝트 다른 날짜 세션 있음 · 자동 연결 아님";
  }
  return workSessionEvidenceCandidateReasonDiagnosticText(item.candidate_reason);
}

export function workSessionEvidenceNearbyQueryText(
  item: Pick<ProjectWorkSessionEvidenceReviewQueueItem, "project" | "date" | "top_titles" | "sample_evidence">,
): string {
  return [item.project, item.date, ...item.top_titles, item.sample_evidence]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

export function recommendedWorkSessionEvidenceSourceSearchSession(
  result: Pick<ProjectWorkSessionEvidenceNearbyResult, "items">,
): ProjectWorkSessionEvidenceNearbyItem | null {
  return result.items.find((item) => item.match_score > 0 && !isWeakMetadataOnlyNearbySession(item))
    ?? result.items.find((item) => !isWeakMetadataOnlyNearbySession(item))
    ?? null;
}

function isWeakMetadataOnlyNearbySession(
  session: Pick<ProjectWorkSessionEvidenceNearbyItem, "source" | "matched_terms" | "match_score" | "excerpt">,
): boolean {
  const source = session.source.trim().toLowerCase();
  const excerpt = session.excerpt.trim().toLowerCase();
  const isSessionMetadata = source.includes("session metadata");
  const isProjectTargetIndex = excerpt.includes("session project targets")
    || excerpt.includes("indexed session project targets");
  const isProjectOnlyMatch = session.match_score <= 1 || session.matched_terms.length <= 1;
  return isSessionMetadata && isProjectTargetIndex && isProjectOnlyMatch;
}

export function workSessionEvidenceSourceSearchQueryText(
  nearbyResult: Pick<ProjectWorkSessionEvidenceNearbyResult, "project" | "date" | "query">,
  session: Pick<ProjectWorkSessionEvidenceNearbyItem, "matched_terms" | "excerpt">,
): string {
  return [
    nearbyResult.project,
    nearbyResult.date,
    nearbyResult.query ?? "",
    session.matched_terms.join(" "),
    session.excerpt,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

export function workSessionEvidenceReviewQueueActionLabel(
  state: WorkSessionEvidenceReviewQueueState,
  hasResult: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "세션 근거 검토 큐 동기화 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 세션 근거 검토 큐를 ${hasResult ? "새로고침" : "동기화"}할 수 없습니다`;
  }
  return hasResult ? "세션 근거 검토 큐 새로고침" : "세션 근거 검토 큐 동기화";
}

export function workSessionEvidenceReviewQueueMetaText(
  state: WorkSessionEvidenceReviewQueueState,
  result: ProjectWorkSessionEvidenceReviewQueueResult | null,
): string {
  if (state === "loading") return "세션 근거 검토 큐 동기화 중";
  if (!result) {
    return state === "failed"
      ? "세션 근거 검토 큐를 사용할 수 없음"
      : "아직 동기화한 세션 근거 검토 큐 없음";
  }
  const parts = [
    `세션근거 큐 저장 ${result.total_items.toLocaleString()}개`,
    `표시 ${result.returned_item_count.toLocaleString()}개`,
    `동기화 ${result.synced_candidate_count.toLocaleString()}개`,
    `stale 전환 ${result.stale_candidate_count.toLocaleString()}개`,
    `검토 ${result.pending_review_count.toLocaleString()}개`,
    `stale ${result.stale_count.toLocaleString()}개`,
    `검토완료 ${result.approved_count.toLocaleString()}개`,
    `거절 ${result.rejected_count.toLocaleString()}개`,
    `제목정규화 ${result.needs_title_normalization_count.toLocaleString()}개`,
  ];
  if (result.warnings.length > 0) {
    parts.push(`경고 ${result.warnings.length.toLocaleString()}개`);
  }
  return parts.join(" · ");
}

export function workSessionEvidenceReviewQueueFailureText(
  state: WorkSessionEvidenceReviewQueueState,
): string | null {
  if (state !== "failed") return null;
  return "세션 근거 검토 큐를 동기화하지 못했습니다. 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.";
}

export function canApproveWorkSessionEvidenceReviewQueueItem(
  item: ProjectWorkSessionEvidenceReviewQueueItem,
): boolean {
  return item.review_state === "pending_review" && !item.needs_title_normalization;
}

export function canRejectWorkSessionEvidenceReviewQueueItem(
  item: ProjectWorkSessionEvidenceReviewQueueItem,
): boolean {
  return item.review_state === "pending_review" || item.review_state === "stale";
}

export function workSessionEvidenceReviewQueueItemStateText(
  item: ProjectWorkSessionEvidenceReviewQueueItem,
): string {
  const stateText = item.review_state === "pending_review"
    ? "검토 대기"
    : item.review_state === "stale"
      ? "stale"
      : item.review_state === "approved"
        ? "검토 완료"
        : "거절됨";
  const titleText = item.needs_title_normalization ? "제목 정규화 필요" : "제목 확인됨";
  return [
    stateText,
    item.review_reason,
    item.session_evidence_audit,
    titleText,
  ].join(" · ");
}

export function workSessionEvidenceReviewQueueSourceRolesText(
  item: Pick<ProjectWorkSessionEvidenceReviewQueueItem, "latest_source_role" | "source_file_roles">,
): string {
  if (!item.source_file_roles.length) return "로그 유형 없음";
  return [
    `로그 유형 · ${workSourceFileRolesInlineText(item.source_file_roles)}`,
    `최근 ${workSourceFileRoleLabel(item.latest_source_role)}`,
  ].join(" · ");
}

export function workLogNormalizationApplyActionLabel(
  state: WorkLogNormalizationApplyState,
  hasApprovedRows: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "승인된 정규화 row 적용 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 승인된 정규화 row를 적용할 수 없습니다`;
  }
  if (!hasApprovedRows) return "승인된 정규화 큐 row가 없어 적용할 수 없습니다";
  return "승인된 정규화 큐 row를 durable table에 적용";
}

export function workLogNormalizationApplyMetaText(
  state: WorkLogNormalizationApplyState,
  result: ProjectWorkLogNormalizationApplyResult | null,
): string {
  if (state === "loading") return "승인된 정규화 row 적용 중";
  if (!result) {
    return state === "failed"
      ? "정규화 적용 결과를 사용할 수 없음"
      : "아직 적용한 승인 정규화 row 없음";
  }
  return [
    `승인 큐 ${result.approved_queue_count.toLocaleString()}개`,
    `처리 ${result.processed_queue_count.toLocaleString()}개`,
    `적용 ${result.applied_item_count.toLocaleString()}개`,
    `중복 ${result.skipped_existing_count.toLocaleString()}개`,
    `저장 총 ${result.total_applied_item_count.toLocaleString()}개`,
    `표시 ${result.returned_item_count.toLocaleString()}개`,
  ].join(" · ");
}

export function workLogNormalizedItemsForDisplay(
  applyResult: ProjectWorkLogNormalizationApplyResult | null,
  normalizedItemsResult: ProjectWorkLogNormalizedItemsResult | null,
): ProjectWorkLogNormalizedItem[] {
  return normalizedItemsResult?.items ?? applyResult?.items ?? [];
}

export function workLogNormalizedItemsTotalCount(
  applyResult: ProjectWorkLogNormalizationApplyResult | null,
  normalizedItemsResult: ProjectWorkLogNormalizedItemsResult | null,
): number {
  return normalizedItemsResult?.total_items
    ?? applyResult?.total_applied_item_count
    ?? workLogNormalizedItemsForDisplay(applyResult, normalizedItemsResult).length;
}

export function workLogNormalizationApplyFailureText(
  state: WorkLogNormalizationApplyState,
): string | null {
  if (state !== "failed") return null;
  return "승인된 정규화 row를 durable table에 적용하지 못했습니다. 데이터베이스 경로, 승인 큐 상태, 브리지 상태를 확인하세요.";
}

export function workLogNormalizedItemsActionLabel(
  state: WorkLogNormalizedItemsState,
  hasNormalizedItems: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "저장된 정규화 row 불러오는 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 저장된 정규화 row를 불러올 수 없습니다`;
  }
  if (hasNormalizedItems) return "저장된 정규화 row 다시 불러오기";
  return "저장된 정규화 row 불러오기";
}

export function workLogNormalizedItemsMetaText(
  state: WorkLogNormalizedItemsState,
  result: ProjectWorkLogNormalizedItemsResult | null,
): string {
  if (state === "loading") return "저장된 정규화 row 불러오는 중";
  if (!result) {
    return state === "failed"
      ? "저장된 정규화 row를 사용할 수 없음"
      : "저장된 정규화 row를 아직 불러오지 않음";
  }
  return [
    `저장 총 ${result.total_items.toLocaleString()}개`,
    `표시 ${result.returned_item_count.toLocaleString()}개`,
    `날짜 ${result.available_dates.length.toLocaleString()}개`,
    `프로젝트 ${result.available_projects.length.toLocaleString()}개`,
  ].join(" · ");
}

export function workLogNormalizedItemsFailureText(
  state: WorkLogNormalizedItemsState,
): string | null {
  if (state !== "failed") return null;
  return "저장된 정규화 row를 불러오지 못했습니다. 데이터베이스 경로와 브리지 상태를 확인하세요.";
}

export function workSessionEvidenceReviewApplyActionLabel(
  state: WorkSessionEvidenceReviewApplyState,
  hasApprovedRows: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "승인된 세션근거 검토결과 저장 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 승인된 세션근거 검토결과를 저장할 수 없습니다`;
  }
  if (!hasApprovedRows) return "승인된 세션근거 검토 row가 없어 저장할 수 없습니다";
  return "승인된 세션근거 검토결과를 durable audit table에 저장";
}

export function workSessionEvidenceReviewApplyMetaText(
  state: WorkSessionEvidenceReviewApplyState,
  result: ProjectWorkSessionEvidenceReviewApplyResult | null,
): string {
  if (state === "loading") return "승인된 세션근거 검토결과 저장 중";
  if (!result) {
    return state === "failed"
      ? "세션근거 검토결과 저장 결과를 사용할 수 없음"
      : "아직 저장한 승인 세션근거 검토 row 없음";
  }
  return [
    `승인 큐 ${result.approved_queue_count.toLocaleString()}개`,
    `처리 ${result.processed_queue_count.toLocaleString()}개`,
    `저장 ${result.applied_item_count.toLocaleString()}개`,
    `중복 ${result.skipped_existing_count.toLocaleString()}개`,
    `감사 총 ${result.total_reviewed_item_count.toLocaleString()}개`,
    `표시 ${result.returned_item_count.toLocaleString()}개`,
  ].join(" · ");
}

export function workSessionEvidenceReviewApplyFailureText(
  state: WorkSessionEvidenceReviewApplyState,
): string | null {
  if (state !== "failed") return null;
  return "승인된 세션근거 검토결과를 durable audit table에 저장하지 못했습니다. 데이터베이스 경로, 승인 큐 상태, 브리지 상태를 확인하세요.";
}

export function workSessionEvidenceReviewedItemsActionLabel(
  state: WorkSessionEvidenceReviewedItemsState,
  hasReviewedItems: boolean,
  lockState: ActionLockState,
): string {
  if (state === "loading") return "저장된 세션근거 검토결과 불러오는 중";
  const lockReason = activeActionLockReason(lockState);
  if (lockReason) {
    return `${lockReason}에는 저장된 세션근거 검토결과를 불러올 수 없습니다`;
  }
  if (hasReviewedItems) return "저장된 세션근거 검토결과 다시 불러오기";
  return "저장된 세션근거 검토결과 불러오기";
}

export function workSessionEvidenceReviewedItemsMetaText(
  state: WorkSessionEvidenceReviewedItemsState,
  result: ProjectWorkSessionEvidenceReviewedItemsResult | null,
): string {
  if (state === "loading") return "저장된 세션근거 검토결과 불러오는 중";
  if (!result) {
    return state === "failed"
      ? "저장된 세션근거 검토결과를 사용할 수 없음"
      : "저장된 세션근거 검토결과를 아직 불러오지 않음";
  }
  return [
    `감사 총 ${result.total_items.toLocaleString()}개`,
    `표시 ${result.returned_item_count.toLocaleString()}개`,
    `날짜 ${result.available_dates.length.toLocaleString()}개`,
    `프로젝트 ${result.available_projects.length.toLocaleString()}개`,
  ].join(" · ");
}

export function workSessionEvidenceReviewedItemsFailureText(
  state: WorkSessionEvidenceReviewedItemsState,
): string | null {
  if (state !== "failed") return null;
  return "저장된 세션근거 검토결과를 불러오지 못했습니다. 데이터베이스 경로와 브리지 상태를 확인하세요.";
}

export function workSummarySnapshotVisibleSummaries(
  snapshot: ProjectWorkSummarySnapshot,
  limit = WORK_SUMMARY_SNAPSHOT_DETAIL_LIMIT,
): ProjectWorkSummary[] {
  return snapshot.summaries.slice(0, Math.max(0, limit));
}

export function workSummarySnapshotDisplaySummaries(
  snapshot: ProjectWorkSummarySnapshot,
  expanded: boolean,
  limit = WORK_SUMMARY_SNAPSHOT_DETAIL_LIMIT,
): ProjectWorkSummary[] {
  if (expanded) return snapshot.summaries;
  return workSummarySnapshotVisibleSummaries(snapshot, limit);
}

export function workSummarySnapshotSummaryOverflowText(
  snapshot: ProjectWorkSummarySnapshot,
  visibleCount: number,
): string | null {
  const hiddenSummaryCount = Math.max(0, snapshot.summaries.length - visibleCount);
  if (!hiddenSummaryCount) return null;
  return `그 외 프로젝트/일자 요약 ${hiddenSummaryCount.toLocaleString()}개`;
}

export function workSummarySnapshotDetailToggleText(
  snapshot: ProjectWorkSummarySnapshot,
  expanded: boolean,
  limit = WORK_SUMMARY_SNAPSHOT_DETAIL_LIMIT,
): string | null {
  const hiddenSummaryCount = Math.max(0, snapshot.summaries.length - Math.max(0, limit));
  if (!hiddenSummaryCount) return null;
  return expanded ? "프로젝트/일자 요약 접기" : `전체 프로젝트/일자 요약 ${snapshot.summaries.length.toLocaleString()}개 보기`;
}

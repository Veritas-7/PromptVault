import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import { pathDisplayText } from "./promptRowA11y.ts";
import { riskFlagLabel } from "./riskLabels.ts";
import type {
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionCandidate,
  ProjectWorkLogExtractionCandidatesResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogNormalizationCandidatesResult,
  ProjectWorkLogExtractionProposal,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkLogExtractionRunsResult,
  ProjectWorkLogReviewQueueItem,
  ProjectWorkLogNormalizationProposalsResult,
  ProjectWorkLogNormalizationApplyResult,
  ProjectWorkLogNormalizationReviewQueueItem,
  ProjectWorkLogNormalizationReviewQueueResult,
  ProjectWorkLogReviewQueueResult,
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
export type WorkLogReviewQueueState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionItemsState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionRunsState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizationCandidatesState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizationProposalsState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizationReviewQueueState = "idle" | "loading" | "ready" | "failed";
export type WorkLogNormalizationApplyState = "idle" | "loading" | "ready" | "failed";
export type WorkManagementRefreshState = "idle" | "loading" | "ready" | "failed";
export type WorkManagementFreezeState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionRunMode = "ai" | "local";

export const WORK_SUMMARY_SNAPSHOT_DETAIL_LIMIT = 3;

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
  ];
  if (result.rows_truncated) parts.push("표시 제한");
  return parts.join(" · ");
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

export function workStatusExportIndexStatusText(result: ProjectWorkStatusExportResult): string {
  const indexState = result.report_session_evidence_index_updated
    ? "세션 인덱스 갱신"
    : result.report_session_evidence_index_used
      ? "세션 인덱스 사용"
      : "세션 직접 스캔";
  return [
    indexState,
    workSummarySessionEvidenceModeLabel(result.report_session_evidence_mode),
    `스캔 ${result.report_session_scan_prompt_count.toLocaleString()}개`,
    `보관 ${result.report_session_evidence_index_count.toLocaleString()}개`,
    `매칭 ${result.report_session_evidence_count.toLocaleString()}건`,
    `고유 ${result.report_unique_session_evidence_count.toLocaleString()}건`,
  ].join(" · ");
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

export function workStatusExportRowSourceStatusesText(row: ProjectWorkStatusExportRow): string {
  if (!row.source_statuses.length) return "진행 상태값 없음";
  return `진행 상태 · ${frequencyItemsInlineText(row.source_statuses)}`;
}

export function workStatusExportRowSessionSourcesText(row: ProjectWorkStatusExportRow): string {
  if (row.session_evidence_count <= 0 || !row.session_sources.length) {
    return "매칭된 세션 근거 없음";
  }
  return [
    `세션 소스 · ${frequencyItemsInlineText(row.session_sources)}`,
    `고유 ${row.unique_session_evidence_count.toLocaleString()}건`,
  ].join(" · ");
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
  return [
    `${result.files_seen.toLocaleString()}개 로그`,
    `parsed ${result.parsed_file_count.toLocaleString()}개`,
    `unparsed ${result.unparsed_file_count.toLocaleString()}개`,
    `${result.project_count.toLocaleString()}개 프로젝트`,
    `작업 ${result.work_item_count.toLocaleString()}개`,
  ].join(" · ");
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
  return [
    `정규화 제안 ${result.returned_proposal_count.toLocaleString()}개`,
    `accepted ${result.accepted_count.toLocaleString()}개`,
    `review ${result.rejected_count.toLocaleString()}개`,
    `후보 ${result.total_candidate_count.toLocaleString()}개`,
    providerText,
    `${result.report_project_count.toLocaleString()}개 프로젝트`,
    `${result.report_date_count.toLocaleString()}일`,
  ].join(" · ");
}

export function workLogNormalizationProposalsFailureText(
  state: WorkLogNormalizationProposalsState,
): string | null {
  if (state !== "failed") return null;
  return "AI 정규화 제안을 생성하지 못했습니다. provider 키, 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.";
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
  return [
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
  ].join(" · ");
}

export function workLogNormalizationReviewQueueFailureText(
  state: WorkLogNormalizationReviewQueueState,
): string | null {
  if (state !== "failed") return null;
  return "정규화 검토 큐를 동기화하지 못했습니다. 데이터베이스 경로, 세션 인덱스, 브리지 상태를 확인하세요.";
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
    : `review 필요 · ${item.rejection_reason ?? "rejected"}`;
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

export function workLogNormalizationApplyFailureText(
  state: WorkLogNormalizationApplyState,
): string | null {
  if (state !== "failed") return null;
  return "승인된 정규화 row를 durable table에 적용하지 못했습니다. 데이터베이스 경로, 승인 큐 상태, 브리지 상태를 확인하세요.";
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

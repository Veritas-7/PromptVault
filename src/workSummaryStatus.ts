import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import { riskFlagLabel } from "./riskLabels.ts";
import type {
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionCandidate,
  ProjectWorkLogExtractionCandidatesResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposal,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkSummary,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshot,
  ProjectWorkSummarySnapshotsResult,
} from "./types.ts";

export type WorkSummaryState = "idle" | "loading" | "ready" | "failed";
export type WorkSummarySnapshotsState = "idle" | "loading" | "ready" | "failed";
export type WorkLogCoverageState = "idle" | "loading" | "ready" | "failed";
export type WorkLogCandidatesState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionState = "idle" | "loading" | "ready" | "failed";
export type WorkLogExtractionItemsState = "idle" | "loading" | "ready" | "failed";
export type WorkManagementRefreshState = "idle" | "loading" | "ready" | "failed";
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

export function workSummaryFailureText(state: WorkSummaryState): string | null {
  if (state !== "failed") return null;
  return "프로젝트 작업 요약을 불러오지 못했습니다. 브리지 상태나 진행 로그 스캔 범위를 확인하세요.";
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

export function workSummaryIndexStatusText(result: ProjectWorkSummaryResult): string {
  const indexState = result.report.session_evidence_index_updated
    ? "세션 인덱스 갱신"
    : result.report.session_evidence_index_used
      ? "세션 인덱스 사용"
      : "세션 직접 스캔";
  return [
    indexState,
    `스캔 ${result.report.session_scan_prompt_count.toLocaleString()}개`,
    `보관 ${result.report.session_evidence_index_count.toLocaleString()}개`,
    `매칭 ${result.report.session_evidence_count.toLocaleString()}건`,
    `고유 ${result.report.session_evidence_unique_count.toLocaleString()}건`,
  ].join(" · ");
}

export function workSummaryPersistenceText(result: ProjectWorkSummaryResult): string | null {
  if (!result.persistence) return null;
  return [
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
    `후보 ${result.candidate_count.toLocaleString()}개`,
    `parsed 제외 ${result.skipped_parsed_file_count.toLocaleString()}개`,
    `unreadable ${result.skipped_unreadable_file_count.toLocaleString()}개`,
    `empty ${result.skipped_empty_file_count.toLocaleString()}개`,
    `pointer ${result.skipped_pointer_file_count.toLocaleString()}개`,
  ].join(" · ");
}

export function workLogCandidatesFailureText(state: WorkLogCandidatesState): string | null {
  if (state !== "failed") return null;
  return "AI 추출 후보를 불러오지 못했습니다. 진행 로그 경로나 브리지 상태를 확인하세요.";
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
    result.used_ai ? `AI ${result.provider}` : `로컬 ${result.provider}`,
    `후보 ${result.candidate_count.toLocaleString()}개`,
    `accepted ${result.accepted_count.toLocaleString()}개`,
    `rejected ${result.rejected_count.toLocaleString()}개`,
  ].join(" · ");
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

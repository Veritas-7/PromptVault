import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import type {
  ProjectWorkSummary,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshot,
  ProjectWorkSummarySnapshotsResult,
} from "./types.ts";

export type WorkSummaryState = "idle" | "loading" | "ready" | "failed";
export type WorkSummarySnapshotsState = "idle" | "loading" | "ready" | "failed";

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
  return [
    `${result.report.project_count.toLocaleString()}개 프로젝트`,
    `${result.report.date_count.toLocaleString()}일`,
    `${result.report.total_items.toLocaleString()}개 작업`,
    `세션 근거 ${result.report.session_evidence_count.toLocaleString()}건`,
  ].join(" · ");
}

export function workSummaryIndexStatusText(result: ProjectWorkSummaryResult): string {
  const indexState = result.report.session_evidence_index_updated
    ? "세션 인덱스 갱신"
    : result.report.session_evidence_index_used
      ? "세션 인덱스 사용"
      : "세션 직접 스캔";
  return [
    indexState,
    `${result.report.session_evidence_index_count.toLocaleString()}개 근거 보관`,
    `고유 근거 ${result.report.session_evidence_unique_count.toLocaleString()}건`,
  ].join(" · ");
}

export function workSummaryPersistenceText(result: ProjectWorkSummaryResult): string | null {
  if (!result.persistence) return null;
  return [
    `스냅샷 #${result.persistence.snapshot_id.toLocaleString()} 저장`,
    `총 ${result.persistence.snapshot_count.toLocaleString()}개`,
  ].join(" · ");
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

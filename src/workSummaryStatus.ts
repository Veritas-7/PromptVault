import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import type { ProjectWorkSummaryResult } from "./types.ts";

export type WorkSummaryState = "idle" | "loading" | "ready" | "failed";

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

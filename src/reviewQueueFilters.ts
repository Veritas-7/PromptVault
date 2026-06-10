import { storedFilterSuggestionValues } from "./storedFilters.ts";
import type {
  ProjectWorkLogReviewQueueItem,
  ProjectWorkLogNormalizationReviewQueueItem,
  ProjectWorkSessionEvidenceReviewQueueItem,
} from "./types.ts";

export type WorkReviewQueueStateFilter =
  | ""
  | "pending_ai_review"
  | "pending_review"
  | "risk_blocked"
  | "stale"
  | "deferred"
  | "approved"
  | "rejected";

export interface WorkReviewQueueFilters {
  date: string;
  project: string;
  reason: string;
  state: WorkReviewQueueStateFilter;
}

export function emptyWorkReviewQueueFilters(): WorkReviewQueueFilters {
  return {
    date: "",
    project: "",
    reason: "",
    state: "",
  };
}

export function activeWorkReviewQueueFilterCount(filters: WorkReviewQueueFilters): number {
  return [
    filters.date,
    filters.project,
    filters.reason,
    filters.state,
  ].filter((value) => value.trim()).length;
}

export function filterWorkLogNormalizationReviewQueueItems(
  items: readonly ProjectWorkLogNormalizationReviewQueueItem[],
  filters: WorkReviewQueueFilters,
): ProjectWorkLogNormalizationReviewQueueItem[] {
  return items.filter((item) =>
    matchesCommonReviewQueueFilters(item, filters)
    && matchesReasonFilter(filters.reason, [
      item.reason,
      item.review_reason,
      item.rejection_reason ?? "",
      item.original_title,
      item.normalized_title,
      item.provider_runtime,
    ])
  );
}

export function filterWorkLogReviewQueueItems(
  items: readonly ProjectWorkLogReviewQueueItem[],
  filters: WorkReviewQueueFilters,
): ProjectWorkLogReviewQueueItem[] {
  return items.filter((item) =>
    matchesCommonReviewQueueFilters(item, filters)
    && matchesReasonFilter(filters.reason, [
      item.review_reason,
      item.candidate_reason,
      item.provider_route,
      item.source_file,
      item.source_path,
      item.excerpt,
      item.risk_flags.join(" "),
    ])
  );
}

export function filterWorkSessionEvidenceReviewQueueItems(
  items: readonly ProjectWorkSessionEvidenceReviewQueueItem[],
  filters: WorkReviewQueueFilters,
): ProjectWorkSessionEvidenceReviewQueueItem[] {
  return items.filter((item) =>
    matchesCommonReviewQueueFilters(item, filters)
    && matchesReasonFilter(filters.reason, [
      item.review_reason,
      item.candidate_reason,
      item.session_evidence_audit,
      item.operational_status,
      item.latest_source_role,
      item.top_titles.join(" "),
    ])
  );
}

export function workReviewQueueDateSuggestions(
  items: readonly { date: string }[],
): string[] {
  return storedFilterSuggestionValues(items.map((item) => item.date));
}

export function workReviewQueueProjectSuggestions(
  items: readonly { project: string }[],
): string[] {
  return storedFilterSuggestionValues(items.map((item) => item.project));
}

export function workReviewQueueReasonSuggestions(
  items: readonly (
    ProjectWorkLogReviewQueueItem
    | ProjectWorkLogNormalizationReviewQueueItem
    | ProjectWorkSessionEvidenceReviewQueueItem
  )[],
): string[] {
  return storedFilterSuggestionValues(items.flatMap((item) => {
    if ("candidate_reason" in item) {
      if ("provider_route" in item) {
        return [
          item.review_reason,
          item.candidate_reason,
          item.provider_route,
          ...item.risk_flags,
        ];
      }
      return [
        item.review_reason,
        item.candidate_reason,
        item.session_evidence_audit,
        item.operational_status,
      ];
    }
    return [
      item.reason,
      item.review_reason,
      item.rejection_reason ?? "",
      item.provider_runtime,
    ];
  }));
}

export function workReviewQueueFilterMetaText(
  label: string,
  filteredCount: number,
  totalCount: number,
  activeFilterCount: number,
  filters?: WorkReviewQueueFilters,
): string {
  const filterText = activeFilterCount === 0
    ? "필터 없음"
    : `필터 ${activeFilterCount.toLocaleString()}개`;
  const conditionText = filters && activeFilterCount > 0
    ? ` · 조건 ${workReviewQueueFilterConditionText(filters)}`
    : "";
  return `${label} 필터 · ${filterText}${conditionText} · 결과 ${filteredCount.toLocaleString()} / ${
    totalCount.toLocaleString()
  }개`;
}

function workReviewQueueFilterConditionText(filters: WorkReviewQueueFilters): string {
  return [
    filters.date.trim() ? `날짜 ${filters.date.trim()}` : null,
    filters.project.trim() ? `프로젝트 ${filters.project.trim()}` : null,
    filters.state ? `상태 ${workReviewQueueStateFilterText(filters.state)}` : null,
    filters.reason.trim() ? `사유 ${filters.reason.trim()}` : null,
  ].filter((part): part is string => part !== null).join(", ");
}

function workReviewQueueStateFilterText(filter: WorkReviewQueueStateFilter): string {
  const labels: Record<Exclude<WorkReviewQueueStateFilter, "">, string> = {
    pending_ai_review: "AI 검토 대기",
    pending_review: "검토 대기",
    risk_blocked: "위험 차단",
    stale: "stale",
    deferred: "보류/수동확인",
    approved: "승인/완료",
    rejected: "거절",
  };
  return filter ? labels[filter] : "전체 상태";
}

function matchesCommonReviewQueueFilters(
  item: { date?: string; project: string; review_state: string },
  filters: WorkReviewQueueFilters,
): boolean {
  const date = filters.date.trim();
  const project = filters.project.trim();
  if (date && item.date !== date) return false;
  if (project && item.project !== project) return false;
  if (filters.state && item.review_state !== filters.state) return false;
  return true;
}

function matchesReasonFilter(filter: string, values: readonly string[]): boolean {
  const reason = filter.trim().toLocaleLowerCase();
  if (!reason) return true;
  return values.some((value) => value.toLocaleLowerCase().includes(reason));
}

import { storedFilterSuggestionValues } from "./storedFilters.ts";
import type {
  ProjectWorkLogNormalizationReviewQueueItem,
  ProjectWorkSessionEvidenceReviewQueueItem,
} from "./types.ts";

export type WorkReviewQueueStateFilter =
  | ""
  | "pending_review"
  | "stale"
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
    ProjectWorkLogNormalizationReviewQueueItem
    | ProjectWorkSessionEvidenceReviewQueueItem
  )[],
): string[] {
  return storedFilterSuggestionValues(items.flatMap((item) => {
    if ("candidate_reason" in item) {
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
): string {
  const filterText = activeFilterCount === 0
    ? "필터 없음"
    : `필터 ${activeFilterCount.toLocaleString()}개`;
  return `${label} 필터 · ${filterText} · 결과 ${filteredCount.toLocaleString()} / ${
    totalCount.toLocaleString()
  }개`;
}

function matchesCommonReviewQueueFilters(
  item: { date: string; project: string; review_state: string },
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

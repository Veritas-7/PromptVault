import { storedFilterSuggestionValues } from "./storedFilters.ts";
import type { ProjectWorkLogCoverageFile } from "./types.ts";

export type WorkLogCoverageStatusFilter =
  | ""
  | "needs_review"
  | "parsed"
  | "pointer"
  | "unparsed"
  | "unreadable";

export interface WorkLogCoverageFilters {
  project: string;
  status: WorkLogCoverageStatusFilter;
}

export function emptyWorkLogCoverageFilters(): WorkLogCoverageFilters {
  return {
    project: "",
    status: "",
  };
}

export function activeWorkLogCoverageFilterCount(filters: WorkLogCoverageFilters): number {
  return [
    filters.project,
    filters.status,
  ].filter((value) => value.trim()).length;
}

export function filterWorkLogCoverageFiles(
  files: readonly ProjectWorkLogCoverageFile[],
  filters: WorkLogCoverageFilters,
): ProjectWorkLogCoverageFile[] {
  return files.filter((file) => {
    const project = filters.project.trim();
    if (project && file.project !== project) return false;
    if (!filters.status) return true;
    if (filters.status === "needs_review") {
      return file.status === "unparsed" || file.status === "unreadable";
    }
    return file.status === filters.status;
  });
}

export function workLogCoverageProjectSuggestions(
  files: readonly ProjectWorkLogCoverageFile[],
): string[] {
  return storedFilterSuggestionValues(files.map((file) => file.project));
}

export function workLogCoverageFilterMetaText(
  filteredCount: number,
  totalCount: number,
  activeFilterCount: number,
): string {
  const filterText = activeFilterCount === 0
    ? "필터 없음"
    : `필터 ${activeFilterCount.toLocaleString()}개`;
  return `작업로그 필터 · ${filterText} · 결과 ${filteredCount.toLocaleString()} / ${
    totalCount.toLocaleString()
  }개`;
}

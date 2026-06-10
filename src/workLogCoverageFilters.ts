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
  sourceFile: string;
  status: WorkLogCoverageStatusFilter;
}

export function emptyWorkLogCoverageFilters(): WorkLogCoverageFilters {
  return {
    project: "",
    sourceFile: "",
    status: "",
  };
}

export function activeWorkLogCoverageFilterCount(filters: WorkLogCoverageFilters): number {
  return [
    filters.project,
    filters.sourceFile,
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
    const sourceFile = filters.sourceFile.trim();
    if (sourceFile && file.source_file !== sourceFile) return false;
    if (!filters.status) return true;
    if (filters.status === "needs_review") {
      return file.status === "unparsed" || file.status === "unreadable";
    }
    return file.status === filters.status;
  });
}

export function workLogCoverageStatusLabel(status: WorkLogCoverageStatusFilter | string): string {
  if (status === "") return "전체 상태";
  if (status === "needs_review") return "문제 로그";
  if (status === "parsed") return "파싱 완료";
  if (status === "pointer") return "주 로그 참조";
  if (status === "unparsed") return "추출 필요";
  if (status === "unreadable") return "읽기 실패";
  return status;
}

export function workLogCoverageProjectSuggestions(
  files: readonly ProjectWorkLogCoverageFile[],
): string[] {
  return storedFilterSuggestionValues(files.map((file) => file.project));
}

export function workLogCoverageSourceFileSuggestions(
  files: readonly ProjectWorkLogCoverageFile[],
): string[] {
  return storedFilterSuggestionValues(files.map((file) => file.source_file));
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

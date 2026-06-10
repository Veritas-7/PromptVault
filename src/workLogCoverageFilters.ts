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
  latestDate: string;
  project: string;
  sourceFile: string;
  status: WorkLogCoverageStatusFilter;
}

export function emptyWorkLogCoverageFilters(): WorkLogCoverageFilters {
  return {
    latestDate: "",
    project: "",
    sourceFile: "",
    status: "",
  };
}

export function activeWorkLogCoverageFilterCount(filters: WorkLogCoverageFilters): number {
  return [
    filters.latestDate,
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
    const latestDate = filters.latestDate.trim();
    if (latestDate && file.latest_date !== latestDate) return false;
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

export function workLogCoverageLatestDateSuggestions(
  files: readonly ProjectWorkLogCoverageFile[],
): string[] {
  return storedFilterSuggestionValues(files.map((file) => file.latest_date ?? ""));
}

export function workLogCoverageSourceFileSuggestions(
  files: readonly ProjectWorkLogCoverageFile[],
): string[] {
  return storedFilterSuggestionValues(files.map((file) => file.source_file));
}

export function workLogCoverageFilterConditionText(filters: WorkLogCoverageFilters): string {
  const conditions = [];
  const project = filters.project.trim();
  if (project) conditions.push(`프로젝트 ${project}`);
  const latestDate = filters.latestDate.trim();
  if (latestDate) conditions.push(`날짜 ${latestDate}`);
  if (filters.status) conditions.push(`상태 ${workLogCoverageStatusLabel(filters.status)}`);
  const sourceFile = filters.sourceFile.trim();
  if (sourceFile) conditions.push(`파일 ${sourceFile}`);
  return conditions.length ? ` · 조건 ${conditions.join(" · ")}` : "";
}

export function workLogCoverageFilterMetaText(
  filteredCount: number,
  totalCount: number,
  filters: WorkLogCoverageFilters,
): string {
  const activeFilterCount = activeWorkLogCoverageFilterCount(filters);
  const filterText = activeFilterCount === 0
    ? "필터 없음"
    : `필터 ${activeFilterCount.toLocaleString()}개`;
  return `작업로그 필터 · ${filterText}${workLogCoverageFilterConditionText(filters)} · 결과 ${filteredCount.toLocaleString()} / ${
    totalCount.toLocaleString()
  }개`;
}

import { previewSortForMode, type PreviewMode } from "./previewMode.ts";
import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import type { StoredPromptsOptions } from "./promptVaultApi";

export interface StoredPromptFilters {
  query: string;
  source: string;
  date: string;
  workspace: string;
}

export function emptyStoredPromptFilters(): StoredPromptFilters {
  return {
    date: "",
    query: "",
    source: "",
    workspace: "",
  };
}

export function storedPromptFiltersSnapshot(filters: StoredPromptFilters): StoredPromptFilters {
  return {
    date: filters.date,
    query: filters.query,
    source: filters.source,
    workspace: filters.workspace,
  };
}

function trimmedOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function activeStoredPromptFilterCount(filters: StoredPromptFilters): number {
  return [
    filters.query,
    filters.source,
    filters.date,
    filters.workspace,
  ].filter((value) => value.trim()).length;
}

export function storedResultFilterCount(
  resultOrigin: "scan" | "stored" | null,
  loadedStoredFilters: StoredPromptFilters,
): number {
  if (resultOrigin !== "stored") return 0;
  return activeStoredPromptFilterCount(loadedStoredFilters);
}

export function storedFilterResetCount(
  draftFilterCount: number,
  resultFilterCount: number,
): number {
  return Math.max(0, draftFilterCount, resultFilterCount);
}

export function storedFilterResetLabel(activeFilterCount: number, lockState: ActionLockState): string {
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 저장소 필터를 초기화할 수 없습니다`;
  if (activeFilterCount === 0) return "초기화할 저장소 필터 없음";
  if (activeFilterCount === 1) return "저장소 필터 1개 초기화";
  return `저장소 필터 ${activeFilterCount.toLocaleString()}개 초기화`;
}

export function storedFilterApplyLabel(activeFilterCount: number, lockState: ActionLockState): string {
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 저장소 필터를 적용할 수 없습니다`;
  if (activeFilterCount === 0) return "필터 없이 저장 프롬프트 불러오기";
  if (activeFilterCount === 1) return "저장소 필터 1개 적용";
  return `저장소 필터 ${activeFilterCount.toLocaleString()}개 적용`;
}

export function storedFilterInputLabel(fieldLabel: string, lockState: ActionLockState): string {
  const reason = activeActionLockReason(lockState);
  const labelMap: Record<string, string> = {
    date: "날짜",
    source: "소스",
    text: "텍스트",
    workspace: "작업공간",
  };
  const label = labelMap[fieldLabel] ?? fieldLabel;
  if (reason) {
    return `${reason}에는 저장소 ${label} 필터를 편집할 수 없습니다`;
  }
  return `저장소 ${label} 필터`;
}

export function storedPromptLoadOptions(
  filters: StoredPromptFilters,
  previewMode: PreviewMode,
  limit: number,
): StoredPromptsOptions {
  return {
    date: trimmedOptional(filters.date),
    limit,
    preview_sort: previewSortForMode(previewMode),
    query: trimmedOptional(filters.query),
    source: trimmedOptional(filters.source),
    workspace: trimmedOptional(filters.workspace),
  };
}

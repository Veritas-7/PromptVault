import { previewSortForMode, type PreviewMode } from "./previewMode.ts";
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

export function storedFilterResetLabel(activeFilterCount: number, actionLocked: boolean): string {
  if (actionLocked) return "Cannot reset stored filters while another action is running";
  if (activeFilterCount === 0) return "No stored filters to reset";
  if (activeFilterCount === 1) return "Reset 1 stored filter";
  return `Reset ${activeFilterCount.toLocaleString()} stored filters`;
}

export function storedFilterApplyLabel(activeFilterCount: number, actionLocked: boolean): string {
  if (actionLocked) return "Cannot apply stored filters while another action is running";
  if (activeFilterCount === 0) return "Load stored prompts without filters";
  if (activeFilterCount === 1) return "Apply 1 stored filter";
  return `Apply ${activeFilterCount.toLocaleString()} stored filters`;
}

export function storedFilterInputLabel(fieldLabel: string, actionLocked: boolean): string {
  if (actionLocked) {
    return `Cannot edit Stored Vault ${fieldLabel} filter while another action is running`;
  }
  return `Stored Vault ${fieldLabel} filter`;
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

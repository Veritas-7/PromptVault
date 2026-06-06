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

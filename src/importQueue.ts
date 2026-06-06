import type { SourcePlan } from "./types";

export function toggleSourceSelection(
  selectedSourceIds: string[],
  sourceId: string,
  checked: boolean,
): string[] {
  if (checked) {
    return selectedSourceIds.includes(sourceId) ? selectedSourceIds : [...selectedSourceIds, sourceId];
  }
  return selectedSourceIds.filter((id) => id !== sourceId);
}

export function selectedQueueSourceIds(
  selectedSourceIds: string[],
  sources: SourcePlan[],
): string[] {
  const availableSourceIds = new Set(
    sources.filter((source) => source.file_count > 0).map((source) => source.id),
  );
  return selectedSourceIds.filter((sourceId) => availableSourceIds.has(sourceId));
}

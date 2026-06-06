import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import type { SourcePlan } from "./types";

export type ImportQueueFinalRunState = "ready" | "stopped";

export interface ImportQueueFinalState {
  completedSourceCount: number;
  state: ImportQueueFinalRunState;
}

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

export function importQueueActionLabel(
  selectedSourceCount: number,
  isRunning: boolean,
  lockState: ActionLockState,
): string {
  const boundedSelectedSourceCount = Math.max(0, selectedSourceCount);
  const sourceText = boundedSelectedSourceCount === 1 ? "source" : "sources";
  if (isRunning) {
    return `Running import queue for ${boundedSelectedSourceCount.toLocaleString()} selected ${sourceText}`;
  }
  if (boundedSelectedSourceCount === 0) {
    return "Select import sources before running queue";
  }
  const actionLockReason = activeActionLockReason(lockState);
  if (actionLockReason) {
    return `Cannot run selected import sources while ${actionLockReason}`;
  }
  return `Run ${boundedSelectedSourceCount.toLocaleString()} selected import ${sourceText}`;
}

export function importQueueFinalState(
  queueLength: number,
  completedSourceCount: number,
  stopRequested: boolean,
): ImportQueueFinalState {
  const boundedCompletedSourceCount = Math.max(
    0,
    Math.min(completedSourceCount, queueLength),
  );
  const queueCompleted = queueLength > 0 && boundedCompletedSourceCount >= queueLength;
  return {
    completedSourceCount: boundedCompletedSourceCount,
    state: stopRequested && !queueCompleted ? "stopped" : "ready",
  };
}

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
  if (isRunning) {
    return `선택한 소스 ${boundedSelectedSourceCount.toLocaleString()}개의 가져오기 대기열 실행 중`;
  }
  if (boundedSelectedSourceCount === 0) {
    return "대기열을 실행하기 전에 가져올 소스를 선택하세요";
  }
  const actionLockReason = activeActionLockReason(lockState);
  if (actionLockReason) {
    return `${actionLockReason}에는 선택한 소스를 가져올 수 없습니다`;
  }
  return `선택한 소스 ${boundedSelectedSourceCount.toLocaleString()}개 가져오기`;
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

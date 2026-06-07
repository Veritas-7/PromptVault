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
  const availableSourceIds = new Set(availableQueueSourceIds(sources));
  return selectedSourceIds.filter((sourceId) => availableSourceIds.has(sourceId));
}

export function availableQueueSourceIds(sources: SourcePlan[]): string[] {
  return sources.filter((source) => source.file_count > 0).map((source) => source.id);
}

export function importQueueSelectAllLabel(
  availableSourceCount: number,
  selectedSourceCount: number,
  lockState: ActionLockState,
): string {
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 가져오기 소스를 전체 선택할 수 없습니다`;
  const boundedAvailableSourceCount = Math.max(0, availableSourceCount);
  const boundedSelectedSourceCount = Math.max(0, selectedSourceCount);
  if (boundedAvailableSourceCount === 0) return "전체 선택할 가져오기 소스 없음";
  if (boundedSelectedSourceCount >= boundedAvailableSourceCount) {
    return "가져올 수 있는 소스 모두 선택됨";
  }
  return `가져올 수 있는 소스 ${boundedAvailableSourceCount.toLocaleString()}개 전체 선택`;
}

export function importQueueClearSelectionLabel(
  selectedSourceCount: number,
  lockState: ActionLockState,
): string {
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 가져오기 소스 선택을 해제할 수 없습니다`;
  const boundedSelectedSourceCount = Math.max(0, selectedSourceCount);
  if (boundedSelectedSourceCount === 0) return "해제할 가져오기 소스 선택 없음";
  return `선택한 가져오기 소스 ${boundedSelectedSourceCount.toLocaleString()}개 해제`;
}

export function importQueueSelectionSummaryLabel(
  selectedSourceCount: number,
  availableSourceCount: number,
): string {
  const boundedAvailableSourceCount = Math.max(0, availableSourceCount);
  if (boundedAvailableSourceCount === 0) return "선택 가능한 소스 없음";
  const boundedSelectedSourceCount = Math.min(
    Math.max(0, selectedSourceCount),
    boundedAvailableSourceCount,
  );
  return `${boundedSelectedSourceCount.toLocaleString()} / ${boundedAvailableSourceCount.toLocaleString()}개 선택됨`;
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

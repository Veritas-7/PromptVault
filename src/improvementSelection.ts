import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import type { ImprovePromptRequest } from "./promptVaultApi.ts";
import type { PromptRecord } from "./types.ts";

export function activeImprovementForSelection<T>(
  improvement: T | null,
  improvementPromptId: string | null,
  selectedPromptId: string | null,
): T | null {
  if (!improvement || !improvementPromptId || !selectedPromptId) return null;
  return improvementPromptId === selectedPromptId ? improvement : null;
}

export function improvementRequestStarted<T>(promptId: string): {
  improvement: T | null;
  improvementPromptId: string;
} {
  return {
    improvement: null,
    improvementPromptId: promptId,
  };
}

export function shouldClearImprovementOnPromptSelect(
  clickedPromptId: string,
  selectedPromptId: string | null,
): boolean {
  return clickedPromptId !== selectedPromptId;
}

export function improvementFailureText(
  failedPromptId: string | null,
  selectedPromptId: string | null,
): string | null {
  if (!failedPromptId || failedPromptId !== selectedPromptId) return null;
  return "이 프롬프트 추천을 생성하지 못했습니다. 위 오류를 확인한 뒤 다시 시도하세요.";
}

export function improvementActionLabel(
  hasSelectedPrompt: boolean,
  improving: boolean,
  lockState: ActionLockState,
): string {
  if (improving) return "선택한 프롬프트 추천 생성 중";
  if (!hasSelectedPrompt) return "추천을 생성하기 전에 프롬프트를 선택하세요";
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 선택한 프롬프트 추천을 생성할 수 없습니다`;
  return "선택한 프롬프트 추천 생성";
}

export function buildImprovePromptRequest(
  prompt: PromptRecord,
  databasePath: string | null | undefined,
  forceLocal: boolean,
): ImprovePromptRequest {
  const request: ImprovePromptRequest = {
    prompt: prompt.text,
    context: `${prompt.source} · ${prompt.cwd ?? "작업공간 없음"}`,
    prompt_id: prompt.id,
    source: prompt.source,
    persist: true,
  };
  if (databasePath) {
    request.database_path = databasePath;
  }
  if (forceLocal) {
    request.force_local = true;
  }
  return request;
}

export interface ImprovementSelectionChange<T> {
  error: string | null;
  improvement: T | null;
  improvementFailureErrorText: string | null;
  improvementFailurePromptId: string | null;
  improvementPromptId: string | null;
}

export function improvementSelectionChanged<T>(
  currentError: string | null,
  improvementFailureErrorText: string | null,
): ImprovementSelectionChange<T> {
  return {
    error: currentError && currentError === improvementFailureErrorText ? null : currentError,
    improvement: null,
    improvementFailureErrorText: null,
    improvementFailurePromptId: null,
    improvementPromptId: null,
  };
}

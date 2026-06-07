export type StoredLoadState = "idle" | "loading" | "ready" | "failed";

export function storedLoadFailureText(
  state: StoredLoadState,
  activeFilterCount: number,
): string | null {
  if (state !== "failed") return null;
  return activeFilterCount
    ? "현재 필터로 저장된 프롬프트를 불러오지 못했습니다. 위 오류를 확인하고 필터를 조정하거나 다시 시도하세요."
    : "저장된 프롬프트를 불러오지 못했습니다. 위 오류를 확인한 뒤 다시 시도하세요.";
}

export interface StoredLoadFailureReset {
  error: string | null;
  failureErrorText: string | null;
  state: StoredLoadState;
}

export function storedFilterChangedAfterFailure(
  state: StoredLoadState,
  currentError: string | null,
  failureErrorText: string | null,
  hasResult: boolean,
): StoredLoadFailureReset {
  if (state !== "failed") {
    return {
      error: currentError,
      failureErrorText,
      state,
    };
  }

  return {
    error: currentError === failureErrorText ? null : currentError,
    failureErrorText: null,
    state: hasResult ? "ready" : "idle",
  };
}

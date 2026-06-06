export type StoredLoadState = "idle" | "loading" | "ready" | "failed";

export function storedLoadFailureText(
  state: StoredLoadState,
  activeFilterCount: number,
): string | null {
  if (state !== "failed") return null;
  return activeFilterCount
    ? "Could not load stored prompts with the current filters. Check the error above, adjust filters, or retry."
    : "Could not load stored prompts. Check the error above and retry.";
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

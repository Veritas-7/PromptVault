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

export function improvementFailureText(
  failedPromptId: string | null,
  selectedPromptId: string | null,
): string | null {
  if (!failedPromptId || failedPromptId !== selectedPromptId) return null;
  return "Could not improve this prompt. Check the error above and retry.";
}

export function improvementActionLabel(
  hasSelectedPrompt: boolean,
  improving: boolean,
  actionLocked: boolean,
): string {
  if (improving) return "Improving selected prompt";
  if (!hasSelectedPrompt) return "Select a prompt before improving";
  if (actionLocked) return "Cannot improve selected prompt while another action is running";
  return "Improve selected prompt";
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

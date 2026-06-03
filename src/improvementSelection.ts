export function activeImprovementForSelection<T>(
  improvement: T | null,
  improvementPromptId: string | null,
  selectedPromptId: string | null,
): T | null {
  if (!improvement || !improvementPromptId || !selectedPromptId) return null;
  return improvementPromptId === selectedPromptId ? improvement : null;
}

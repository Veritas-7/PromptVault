export function selectedPromptForView<T extends { id: string }>(
  visiblePrompts: T[],
  selectedId: string | null,
): T | null {
  return visiblePrompts.find((prompt) => prompt.id === selectedId) ?? visiblePrompts[0] ?? null;
}

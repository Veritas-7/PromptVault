export function promptListEmptyText(hasResult: boolean, filterText: string): string | null {
  if (!hasResult) return null;
  return filterText.trim() ? "No prompts match the current filter." : "No prompts were loaded.";
}

export function selectedPromptEmptyText(hasResult: boolean, filterText: string): string {
  if (!hasResult) return "Run a scan or load stored prompts.";
  return filterText.trim()
    ? "No prompt is visible with the current filter."
    : "No prompt is available in this result.";
}

export function recommendationEmptyText(
  hasSelectedPrompt: boolean,
  hasResult: boolean,
  filterText: string,
): string {
  if (hasSelectedPrompt) return "Run improvement for the selected prompt.";
  if (hasResult && filterText.trim()) {
    return "Clear the prompt filter or select a visible prompt before improving.";
  }
  return "Select a prompt and run improvement.";
}

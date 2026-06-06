export function promptListEmptyText(
  hasResult: boolean,
  filterText: string,
  activeStoredFilterCount = 0,
): string | null {
  if (!hasResult) return null;
  if (filterText.trim()) return "No prompts match the current filter.";
  if (activeStoredFilterCount > 0) {
    return "No stored prompts match the current Stored Vault filters.";
  }
  return "No prompts were loaded.";
}

export function selectedPromptEmptyText(
  hasResult: boolean,
  filterText: string,
  activeStoredFilterCount = 0,
): string {
  if (!hasResult) return "Run a scan or load stored prompts.";
  if (filterText.trim()) return "No prompt is visible with the current filter.";
  if (activeStoredFilterCount > 0) {
    return "No prompt matches the current Stored Vault filters.";
  }
  return "No prompt is available in this result.";
}

export function recommendationEmptyText(
  hasSelectedPrompt: boolean,
  hasResult: boolean,
  filterText: string,
  activeStoredFilterCount = 0,
): string {
  if (hasSelectedPrompt) return "Run improvement for the selected prompt.";
  if (hasResult && filterText.trim()) {
    return "Clear the prompt filter or select a visible prompt before improving.";
  }
  if (hasResult && activeStoredFilterCount > 0) {
    return "Adjust or reset Stored Vault filters before improving.";
  }
  return "Select a prompt and run improvement.";
}

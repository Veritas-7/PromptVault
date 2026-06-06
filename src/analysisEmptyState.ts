export function sourceSummariesEmptyText(hasResult: boolean): string {
  return hasResult
    ? "No source summaries are available for this result."
    : "Run a scan or load stored prompts to see source coverage.";
}

export function frequencyEmptyText(hasResult: boolean, title: string): string {
  if (!hasResult) return "Run a scan or load stored prompts to see frequency data.";
  return `No ${title.toLowerCase()} data in this result.`;
}

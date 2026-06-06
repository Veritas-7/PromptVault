export type StoredFacetsState = "idle" | "loading" | "ready" | "failed";

export interface StoredFacetSummaryResult {
  dates: readonly unknown[];
  sources: readonly unknown[];
  total_prompts: number;
  workspaces: readonly unknown[];
}

export function storedFacetsFailureText(state: StoredFacetsState): string | null {
  return state === "failed"
    ? "Could not refresh stored facets. Filter suggestions may be stale."
    : null;
}

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : `${singular}s`}`;
}

export function storedFacetSummaryText(
  state: StoredFacetsState,
  activeFilterCount: number,
  result: StoredFacetSummaryResult | null,
): string {
  const activeFilterText = countLabel(activeFilterCount, "filter");
  if (result) {
    const sourceCount = countLabel(result.sources.length, "source");
    const dateCount = countLabel(result.dates.length, "date");
    const workspaceCount = countLabel(result.workspaces.length, "workspace");
    return `${result.total_prompts.toLocaleString()} stored, ${sourceCount}, ${dateCount}, ${workspaceCount}`;
  }
  if (state === "loading") return "loading stored facets";
  if (state === "failed") {
    return activeFilterCount
      ? `facet refresh failed, ${activeFilterText} active`
      : "stored facets unavailable";
  }
  return activeFilterCount ? `${activeFilterText} active` : "all stored prompts";
}

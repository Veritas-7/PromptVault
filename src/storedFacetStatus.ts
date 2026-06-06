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

export function storedFacetSummaryText(
  state: StoredFacetsState,
  activeFilterCount: number,
  result: StoredFacetSummaryResult | null,
): string {
  if (result) {
    return `${result.total_prompts.toLocaleString()} stored, ${result.sources.length.toLocaleString()} sources, ${result.dates.length.toLocaleString()} dates, ${result.workspaces.length.toLocaleString()} workspaces`;
  }
  if (state === "loading") return "loading stored facets";
  if (state === "failed") {
    return activeFilterCount
      ? `facet refresh failed, ${activeFilterCount.toLocaleString()} filters active`
      : "stored facets unavailable";
  }
  return activeFilterCount ? `${activeFilterCount.toLocaleString()} filters active` : "all stored prompts";
}

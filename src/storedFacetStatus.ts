export type StoredFacetsState = "idle" | "loading" | "ready" | "failed";

export interface StoredFacetSummaryResult {
  dates: readonly unknown[];
  sources: readonly unknown[];
  total_prompts: number;
  workspaces: readonly unknown[];
}

export function storedFacetsFailureText(state: StoredFacetsState): string | null {
  return state === "failed"
    ? "저장소 필터 후보를 새로고침하지 못했습니다. 필터 후보가 오래되었을 수 있습니다."
    : null;
}

function countLabel(count: number, singular: string): string {
  return `${singular} ${count.toLocaleString()}개`;
}

export function storedFacetSummaryText(
  state: StoredFacetsState,
  activeFilterCount: number,
  result: StoredFacetSummaryResult | null,
): string {
  const activeFilterText = countLabel(activeFilterCount, "필터");
  if (result) {
    const sourceCount = countLabel(result.sources.length, "소스");
    const dateCount = countLabel(result.dates.length, "날짜");
    const workspaceCount = countLabel(result.workspaces.length, "작업공간");
    return `${result.total_prompts.toLocaleString()}개 저장됨, ${sourceCount}, ${dateCount}, ${workspaceCount}`;
  }
  if (state === "loading") return "저장소 필터 후보 불러오는 중";
  if (state === "failed") {
    return activeFilterCount
      ? `필터 후보 새로고침 실패, ${activeFilterText} 활성`
      : "저장소 필터 후보를 사용할 수 없음";
  }
  return activeFilterCount ? `${activeFilterText} 활성` : "전체 저장 프롬프트";
}

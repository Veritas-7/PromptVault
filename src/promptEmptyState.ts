export function promptListEmptyText(
  hasResult: boolean,
  filterText: string,
  activeStoredFilterCount = 0,
  isLoading = false,
): string | null {
  if (isLoading) return "프롬프트를 불러오는 중입니다.";
  if (!hasResult) return "스캔하거나 저장소 불러오기를 실행하면 프롬프트가 여기에 표시됩니다.";
  if (filterText.trim()) return "현재 필터와 일치하는 프롬프트가 없습니다.";
  if (activeStoredFilterCount > 0) {
    return "현재 저장소 필터와 일치하는 저장 프롬프트가 없습니다.";
  }
  return "불러온 프롬프트가 없습니다.";
}

export function selectedPromptEmptyText(
  hasResult: boolean,
  filterText: string,
  activeStoredFilterCount = 0,
  isLoading = false,
): string {
  if (isLoading) return "프롬프트를 불러오는 중입니다.";
  if (!hasResult) return "스캔하거나 저장된 프롬프트를 불러오세요.";
  if (filterText.trim()) return "현재 필터에서 보이는 프롬프트가 없습니다.";
  if (activeStoredFilterCount > 0) {
    return "현재 저장소 필터와 일치하는 프롬프트가 없습니다.";
  }
  return "이 결과에서 사용할 수 있는 프롬프트가 없습니다.";
}

export function recommendationEmptyText(
  hasSelectedPrompt: boolean,
  hasResult: boolean,
  filterText: string,
  activeStoredFilterCount = 0,
  isLoading = false,
  isImproving = false,
  hasSelectedPromptFailure = false,
): string | null {
  if (isLoading) return "프롬프트를 불러온 뒤 추천을 생성할 수 있습니다.";
  if (isImproving) return "선택한 프롬프트 추천을 생성하는 중입니다.";
  if (hasSelectedPromptFailure) return null;
  if (hasSelectedPrompt) return "선택한 프롬프트의 추천을 생성하세요.";
  if (hasResult && filterText.trim()) {
    return "추천을 생성하기 전에 프롬프트 필터를 지우거나 보이는 프롬프트를 선택하세요.";
  }
  if (hasResult && activeStoredFilterCount > 0) {
    return "추천을 생성하기 전에 저장소 필터를 조정하거나 초기화하세요.";
  }
  return "프롬프트를 선택하고 추천을 생성하세요.";
}

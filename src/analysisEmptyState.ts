export function sourceSummariesEmptyText(hasResult: boolean): string {
  return hasResult
    ? "이 결과에는 소스 요약이 없습니다."
    : "스캔하거나 저장된 프롬프트를 불러오면 소스 범위를 볼 수 있습니다.";
}

export function frequencyEmptyText(hasResult: boolean, title: string): string {
  if (!hasResult) return "스캔하거나 저장된 프롬프트를 불러오면 통계를 볼 수 있습니다.";
  return `이 결과에는 ${title} 데이터가 없습니다.`;
}

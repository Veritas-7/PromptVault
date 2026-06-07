export const MAX_SCAN_LIMIT = 100000;
export const RECOMMENDED_SCAN_LIMIT = 25;

export function recommendedInitialScanLimit(): string {
  return String(RECOMMENDED_SCAN_LIMIT);
}

export function parseRequiredScanLimit(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(
      "스캔 전에 제한값을 입력하세요. 큰 기록 저장소는 계획 또는 재개 가능한 가져오기를 사용하세요.",
    );
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("제한값은 양의 정수여야 합니다.");
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_SCAN_LIMIT) {
    throw new Error(`제한값은 1부터 ${MAX_SCAN_LIMIT} 사이여야 합니다.`);
  }
  return parsed;
}

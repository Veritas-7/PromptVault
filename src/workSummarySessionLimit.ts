export const WORK_SUMMARY_DEFAULT_SESSION_LIMIT = 20;
export const WORK_SUMMARY_MAX_SESSION_LIMIT = 50_000;

export function parseWorkSummarySessionLimit(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > WORK_SUMMARY_MAX_SESSION_LIMIT) {
    return null;
  }
  return parsed;
}

export function workSummarySessionLimitStatusText(value: string): string {
  const parsed = parseWorkSummarySessionLimit(value);
  if (parsed === null) {
    return `세션 스캔 범위는 1-${WORK_SUMMARY_MAX_SESSION_LIMIT.toLocaleString()} 사이 숫자`;
  }
  return `세션 스캔 ${parsed.toLocaleString()}개 기준`;
}

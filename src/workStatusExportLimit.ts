export const WORK_STATUS_EXPORT_DEFAULT_LIMIT = 12;
export const WORK_STATUS_EXPORT_MAX_LIMIT = 100;

export function parseWorkStatusExportLimit(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > WORK_STATUS_EXPORT_MAX_LIMIT) {
    return null;
  }
  return parsed;
}

export function workStatusExportLimitStatusText(value: string): string {
  const parsed = parseWorkStatusExportLimit(value);
  if (parsed === null) {
    return `상태 export 표시 행은 1-${WORK_STATUS_EXPORT_MAX_LIMIT.toLocaleString()} 사이 숫자`;
  }
  return `상태 export 표시 ${parsed.toLocaleString()}행 기준`;
}

export const MAX_SCAN_LIMIT = 100000;

export function parseRequiredScanLimit(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(
      "Enter a scan limit before scanning. Use Plan or resumable imports for large historical stores.",
    );
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Limit must be a positive whole number.");
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_SCAN_LIMIT) {
    throw new Error(`Limit must be between 1 and ${MAX_SCAN_LIMIT}.`);
  }
  return parsed;
}

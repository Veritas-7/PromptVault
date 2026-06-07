const QUALITY_BAND_LABELS: Record<string, string> = {
  excellent: "우수",
  good: "좋음",
  strong: "강함",
  weak: "약함",
  workable: "보통",
};

export function qualityBandLabel(band: string): string {
  const normalized = band.trim().toLowerCase();
  if (!normalized) return "알 수 없음";
  return QUALITY_BAND_LABELS[normalized] ?? band.trim();
}

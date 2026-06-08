const QUALITY_BAND_LABELS: Record<string, string> = {
  excellent: "우수",
  good: "좋음",
  medium: "보통",
  strong: "강함",
  weak: "약함",
  workable: "보통",
};

const QUALITY_BAND_CLASSES: Record<string, string> = {
  excellent: "excellent",
  good: "good",
  medium: "workable",
  strong: "strong",
  weak: "weak",
  workable: "workable",
};

export function qualityBandLabel(band: string): string {
  const normalized = band.trim().toLowerCase();
  if (!normalized) return "알 수 없음";
  return QUALITY_BAND_LABELS[normalized] ?? band.trim();
}

export function qualityBandClass(band: string): string {
  const normalized = band.trim().toLowerCase();
  return QUALITY_BAND_CLASSES[normalized] ?? "unknown";
}

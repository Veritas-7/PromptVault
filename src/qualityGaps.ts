const QUALITY_GAP_DISPLAY_LIMIT = 4;

const QUALITY_GAP_LABELS: Record<string, string> = {
  action_verb: "작업 동사",
  context: "맥락",
  constraints: "제약",
  output_format: "출력 형식",
  sensitive_content_risk: "민감정보 위험",
  specific_goal: "구체적 목표",
  success_criteria: "성공 기준",
  too_long: "과도한 길이",
  verification: "검증",
};

function normalizedQualityGap(gap: string): string {
  return gap.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function qualityGapLabel(gap: string): string {
  const trimmed = gap.trim();
  if (!trimmed) return "알 수 없음";
  return QUALITY_GAP_LABELS[normalizedQualityGap(gap)] ?? trimmed;
}

export function qualityGapSummary(gaps: string[]): string {
  const visible = gaps
    .slice(0, QUALITY_GAP_DISPLAY_LIMIT)
    .map(qualityGapLabel)
    .join(", ");
  const hiddenCount = gaps.length - QUALITY_GAP_DISPLAY_LIMIT;
  return hiddenCount > 0 ? `${visible} 외 ${hiddenCount.toLocaleString()}개` : visible;
}

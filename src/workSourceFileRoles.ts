import type { FrequencyItem } from "./types.ts";

export function workSourceFileRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    "handoff-log": "핸드오프 로그",
    "work-log": "작업 로그",
    "project-status": "프로젝트 상태",
    "progress-log": "진행 로그",
    "generated-report": "생성 리포트",
    "dated-work-log": "날짜별 작업 로그",
    "progress-artifact": "진행 산출물",
  };
  return labels[role] ?? role;
}

export function workSourceFileRolesInlineText(
  items: readonly FrequencyItem[],
  visibleCount = 4,
): string {
  return items
    .slice(0, visibleCount)
    .map((item) => `${workSourceFileRoleLabel(item.text)} ${item.count.toLocaleString()}개`)
    .join(", ");
}

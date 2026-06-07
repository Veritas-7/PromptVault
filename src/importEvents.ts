import type { ImportEvent } from "./types";

export function importEventStatusLabel(event: ImportEvent): string {
  if (event.completed) return "완료";
  if (event.batch_file_count === 0) return "파일 없음";
  return "재개 가능";
}

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()}개 ${singular}`;
}

export function importEventBatchSummary(event: ImportEvent): string {
  return `${countLabel(event.batch_file_count, "파일")} · ${countLabel(event.batch_prompt_count, "프롬프트")}`;
}

export function importEventWarningSummary(event: ImportEvent): string {
  return event.warnings.length ? countLabel(event.warnings.length, "경고") : "경고 없음";
}

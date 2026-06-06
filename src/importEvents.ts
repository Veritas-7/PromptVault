import type { ImportEvent } from "./types";

export function importEventStatusLabel(event: ImportEvent): string {
  if (event.completed) return "complete";
  if (event.batch_file_count === 0) return "no files";
  return "resumable";
}

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : `${singular}s`}`;
}

export function importEventBatchSummary(event: ImportEvent): string {
  return `${countLabel(event.batch_file_count, "file")} · ${countLabel(event.batch_prompt_count, "prompt")}`;
}

export function importEventWarningSummary(event: ImportEvent): string {
  return event.warnings.length ? countLabel(event.warnings.length, "warning") : "no warnings";
}

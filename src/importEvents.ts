import type { ImportEvent } from "./types";

export function importEventStatusLabel(event: ImportEvent): string {
  if (event.completed) return "complete";
  if (event.batch_file_count === 0) return "no files";
  return "resumable";
}

export function importEventBatchSummary(event: ImportEvent): string {
  return `${event.batch_file_count.toLocaleString()} files · ${event.batch_prompt_count.toLocaleString()} prompts`;
}

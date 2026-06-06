import type { ImportBatchResult } from "./types";

export type ImportRunState = "idle" | "importing" | "stopped" | "ready" | "failed";
export type ImportRunMode = "single" | "continuous";

export function importProgressPercent(result: ImportBatchResult | null): number {
  if (!result) return 0;
  if (result.state.total_files === 0) return result.state.completed ? 100 : 0;
  const ratio = result.state.processed_files / result.state.total_files;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function importStatusLabel(
  result: ImportBatchResult | null,
  runState: ImportRunState,
  mode: ImportRunMode | null,
  stopRequested: boolean,
): string {
  if (runState === "failed") return "Failed";
  if (runState === "importing" && stopRequested) return "Stopping after current batch";
  if (runState === "importing" && mode === "continuous") return "Running";
  if (runState === "importing") return "Importing";
  if (result?.state.completed) return "Complete";
  if (runState === "stopped") return "Stopped";
  if (result) return "Resumable";
  return "Idle";
}

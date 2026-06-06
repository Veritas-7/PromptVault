import type { ImportBatchResult, ImportState } from "./types";

export type ImportRunState = "idle" | "importing" | "stopped" | "ready" | "failed";
export type ImportRunMode = "single" | "continuous" | "queue";

export interface ImportProgressDisplay {
  batchSummary: string;
  percent: number;
  processedFiles: number;
  sourceLabel: string;
  totalFiles: number;
}

export function importProgressPercent(result: ImportBatchResult | null): number {
  if (!result) return 0;
  if (result.state.total_files === 0) return result.state.completed ? 100 : 0;
  const ratio = result.state.processed_files / result.state.total_files;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function importStateProgressPercent(state: ImportState | null): number {
  if (!state) return 0;
  if (state.total_files === 0) return state.completed ? 100 : 0;
  const ratio = state.processed_files / state.total_files;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : `${singular}s`}`;
}

export function importProgressValueText(processedFiles: number, totalFiles: number): string {
  return `${processedFiles.toLocaleString()} of ${countLabel(totalFiles, "file")}`;
}

export function importProgressDisplay(
  result: ImportBatchResult | null,
  savedState: ImportState | null,
  fallbackSourceLabel: string | null,
  fallbackTotalFiles: number,
  batchFileSize: number,
): ImportProgressDisplay {
  const state = result?.state ?? savedState;
  const fallbackLabel = fallbackSourceLabel?.trim();
  const sourceLabel = result?.state.source_label
    ?? savedState?.source_label
    ?? (fallbackLabel ? fallbackLabel : "Selected source");
  const processedFiles = state?.processed_files ?? 0;
  const totalFiles = state?.total_files ?? fallbackTotalFiles;
  const percent = result
    ? importProgressPercent(result)
    : importStateProgressPercent(savedState);
  const batchSummary = result
    ? `${countLabel(result.batch_file_count, "file")} · ${countLabel(result.batch_prompt_count, "prompt")}`
    : `${countLabel(batchFileSize, "file")} per batch`;

  return {
    batchSummary,
    percent,
    processedFiles,
    sourceLabel,
    totalFiles,
  };
}

export function importStatusLabel(
  result: ImportBatchResult | null,
  runState: ImportRunState,
  mode: ImportRunMode | null,
  stopRequested: boolean,
): string {
  if (runState === "failed") return "Failed";
  if (runState === "importing" && stopRequested) return "Stopping after current batch";
  if (runState === "importing" && mode === "queue") return "Running queue";
  if (runState === "importing" && mode === "continuous") return "Running";
  if (runState === "importing") return "Importing";
  if (runState === "stopped") return "Stopped";
  if (result?.state.completed) return "Complete";
  if (result) return "Resumable";
  return "Idle";
}

export function importStopActionLabel(mode: ImportRunMode | null, stopRequested: boolean): string {
  const target = mode === "queue" ? "import queue after current source" : "import after current batch";
  return stopRequested ? `Stopping ${target}` : `Stop ${target}`;
}

export function importRunFailureText(
  runState: ImportRunState,
  sourceLabel: string | null,
): string | null {
  if (runState !== "failed") return null;
  const target = sourceLabel?.trim();
  return target
    ? `Could not import ${target}. Check the error above and retry from the import plan.`
    : "Could not import the selected source. Check the error above and retry from the import plan.";
}

export function importStopNoticeText(
  runState: ImportRunState,
  mode: ImportRunMode | null,
  sourceLabel: string | null,
  completedQueueSourceCount = 0,
  queueLength = 0,
): string | null {
  if (runState !== "stopped") return null;

  if (mode === "queue") {
    const boundedCompletedSourceCount = Math.max(
      0,
      Math.min(completedQueueSourceCount, queueLength),
    );
    const progressText = queueLength > 0
      ? ` ${boundedCompletedSourceCount.toLocaleString()} of ${countLabel(queueLength, "source")} completed.`
      : "";
    return `Import queue stopped after the current source.${progressText} Run Selected again to continue.`;
  }

  const target = sourceLabel?.trim();
  if (mode === "continuous") {
    return target
      ? `Stopped importing ${target} after the current batch. Run Until Done again to resume from the saved cursor.`
      : "Stopped importing after the current batch. Run Until Done again to resume from the saved cursor.";
  }

  return target
    ? `Stopped importing ${target}. Retry from the import plan to resume.`
    : "Stopped importing the selected source. Retry from the import plan to resume.";
}

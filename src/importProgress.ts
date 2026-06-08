import type { ImportBatchResult, ImportState } from "./types";
import { dateTimeDisplayText } from "./dateDisplay.ts";
import { sourceLabelDisplayText } from "./promptRowA11y.ts";

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
  return `${count.toLocaleString()}개 ${singular}`;
}

export function importProgressValueText(processedFiles: number, totalFiles: number): string {
  return `${processedFiles.toLocaleString()} / ${countLabel(totalFiles, "파일")}`;
}

export function importProgressLabel(sourceLabel: string | null | undefined): string {
  const target = sourceLabel?.trim()
    ? sourceLabelDisplayText(sourceLabel)
    : "선택한 소스";
  return `${target} 가져오기 진행`;
}

export function importRunTimestampText(generatedAt: string | null | undefined, runState: ImportRunState): string {
  if (generatedAt?.trim()) return dateTimeDisplayText(generatedAt);
  if (runState === "failed") return "실패";
  if (runState === "stopped") return "중지됨";
  return "시작 중";
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
    ?? (fallbackLabel ? fallbackLabel : "선택한 소스");
  const processedFiles = state?.processed_files ?? 0;
  const totalFiles = state?.total_files ?? fallbackTotalFiles;
  const percent = result
    ? importProgressPercent(result)
    : importStateProgressPercent(savedState);
  const batchSummary = result
    ? `${countLabel(result.batch_file_count, "파일")} · ${countLabel(result.batch_prompt_count, "프롬프트")}`
    : `배치당 ${countLabel(batchFileSize, "파일")}`;

  return {
    batchSummary,
    percent,
    processedFiles,
    sourceLabel: sourceLabelDisplayText(sourceLabel),
    totalFiles,
  };
}

export function importStatusLabel(
  result: ImportBatchResult | null,
  runState: ImportRunState,
  mode: ImportRunMode | null,
  stopRequested: boolean,
): string {
  if (runState === "failed") return "실패";
  if (runState === "importing" && stopRequested) return "현재 배치 후 중지 중";
  if (runState === "importing" && mode === "queue") return "대기열 실행 중";
  if (runState === "importing" && mode === "continuous") return "실행 중";
  if (runState === "importing") return "가져오는 중";
  if (runState === "stopped") return "중지됨";
  if (result?.state.completed) return "완료";
  if (result) return "재개 가능";
  return "대기";
}

export function importStopActionLabel(mode: ImportRunMode | null, stopRequested: boolean): string {
  const target = mode === "queue" ? "현재 배치 후 가져오기 대기열" : "현재 배치 후 가져오기";
  return stopRequested ? `${target} 중지 중` : `${target} 중지`;
}

export function importRunFailureText(
  runState: ImportRunState,
  sourceLabel: string | null,
): string | null {
  if (runState !== "failed") return null;
  const target = sourceLabel?.trim();
  return target
    ? `${sourceLabelDisplayText(target)} 가져오기에 실패했습니다. 위 오류를 확인한 뒤 가져오기 계획에서 다시 시도하세요.`
    : "선택한 소스를 가져오지 못했습니다. 위 오류를 확인한 뒤 가져오기 계획에서 다시 시도하세요.";
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
      ? ` ${countLabel(queueLength, "소스")} 중 ${boundedCompletedSourceCount.toLocaleString()}개 완료.`
      : "";
    return `가져오기 대기열이 현재 배치 후 중지되었습니다.${progressText} 계속하려면 선택 실행을 다시 누르세요.`;
  }

  const target = sourceLabel?.trim();
  if (mode === "continuous") {
    return target
      ? `${sourceLabelDisplayText(target)} 가져오기가 현재 배치 후 중지되었습니다. 저장된 커서에서 재개하려면 끝까지 실행을 다시 누르세요.`
      : "가져오기가 현재 배치 후 중지되었습니다. 저장된 커서에서 재개하려면 끝까지 실행을 다시 누르세요.";
  }

  return target
    ? `${sourceLabelDisplayText(target)} 가져오기가 중지되었습니다. 재개하려면 가져오기 계획에서 다시 시도하세요.`
    : "선택한 소스 가져오기가 중지되었습니다. 재개하려면 가져오기 계획에서 다시 시도하세요.";
}

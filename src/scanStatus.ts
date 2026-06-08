import type { ScanProgress } from "./types";
import { dateTimeDisplayText } from "./dateDisplay.ts";
import { sourceLabelDisplayText } from "./promptRowA11y.ts";

export type ScanRunState = "idle" | "scanning" | "canceling" | "ready" | "failed";
export type ScanStopFailure = "not_active" | "request_failed";

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()}개 ${singular}`;
}

export function scanProgressLabel(progress: ScanProgress | null): string {
  if (!progress) return "스캔 진행 상황을 준비 중입니다.";
  const source = progress.source_label ? sourceLabelDisplayText(progress.source_label) : "소스 준비 중";
  const fileTotal = progress.source_file_count === null
    ? progress.source_files_discovered
      ? `파일 찾는 중 · ${countLabel(progress.source_files_discovered, "파일")} 발견`
      : "파일 찾는 중"
    : `${progress.source_files_seen.toLocaleString()} / ${countLabel(progress.source_file_count, "파일")}`;
  const sourcePosition = progress.source_count
    ? `소스 ${progress.source_index.toLocaleString()} / ${progress.source_count.toLocaleString()}`
    : "소스 대기 중";
  const limit = progress.limit === null ? "" : ` · 제한 ${progress.limit.toLocaleString()}`;
  return `${source}: ${fileTotal} · ${countLabel(progress.prompts_found, "프롬프트")} · ${sourcePosition}${limit}`;
}

export function scanResultTimestampText(generatedAt: string | null | undefined): string {
  return dateTimeDisplayText(generatedAt, "아직 스캔 안 함");
}

export function scanRunFailureText(state: ScanRunState, hasResult: boolean): string | null {
  if (state !== "failed") return null;
  return hasResult
    ? "스캔 결과를 새로고침하지 못했습니다. 기존 결과를 계속 표시합니다. 위 오류를 확인하고 제한값을 조정하거나 다시 시도하세요."
    : "프롬프트를 스캔하지 못했습니다. 위 오류를 확인하고 제한값을 조정하거나 다시 시도하세요.";
}

export function scanStopFailureText(failure: ScanStopFailure | null): string | null {
  if (failure === "request_failed") {
    return "실행 중인 스캔을 중지하지 못했습니다. 아직 실행 중이므로 위 오류를 확인하거나 중지를 다시 시도하세요.";
  }
  if (failure === "not_active") {
    return "중지할 실행 중 스캔을 찾지 못했습니다. 스캔이 이미 끝났을 수 있습니다.";
  }
  return null;
}

export interface ScanFailureReset {
  error: string | null;
  failureErrorText: string | null;
  state: ScanRunState;
}

export function scanLimitChangedAfterFailure(
  state: ScanRunState,
  currentError: string | null,
  failureErrorText: string | null,
  hasResult: boolean,
): ScanFailureReset {
  if (state !== "failed") {
    return {
      error: currentError,
      failureErrorText,
      state,
    };
  }

  return {
    error: currentError === failureErrorText ? null : currentError,
    failureErrorText: null,
    state: hasResult ? "ready" : "idle",
  };
}

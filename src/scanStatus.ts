import type { ScanProgress } from "./types";

export type ScanRunState = "idle" | "scanning" | "canceling" | "ready" | "failed";
export type ScanStopFailure = "not_active" | "request_failed";

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : `${singular}s`}`;
}

export function scanProgressLabel(progress: ScanProgress | null): string {
  if (!progress) return "Preparing scan progress.";
  const source = progress.source_label ?? "Preparing source";
  const fileTotal = progress.source_file_count === null
    ? progress.source_files_discovered
      ? `discovering files · ${progress.source_files_discovered.toLocaleString()} found`
      : "discovering files"
    : `${progress.source_files_seen.toLocaleString()} / ${countLabel(progress.source_file_count, "file")}`;
  const sourcePosition = progress.source_count
    ? `source ${progress.source_index.toLocaleString()} / ${progress.source_count.toLocaleString()}`
    : "source pending";
  const limit = progress.limit === null ? "" : ` · limit ${progress.limit.toLocaleString()}`;
  return `${source}: ${fileTotal} · ${countLabel(progress.prompts_found, "prompt")} · ${sourcePosition}${limit}`;
}

export function scanRunFailureText(state: ScanRunState, hasResult: boolean): string | null {
  if (state !== "failed") return null;
  return hasResult
    ? "Could not refresh scan results. Existing results are still shown. Check the error above, adjust the limit, or retry."
    : "Could not scan prompts. Check the error above, adjust the limit, or retry.";
}

export function scanStopFailureText(failure: ScanStopFailure | null): string | null {
  if (failure === "request_failed") {
    return "Could not stop the active scan. It is still running; check the error above or try Stop again.";
  }
  if (failure === "not_active") {
    return "No active scan was found to stop. The scan may have already finished.";
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

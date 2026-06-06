export type ScanRunState = "idle" | "scanning" | "canceling" | "ready" | "failed";
export type ScanStopFailure = "not_active" | "request_failed";

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

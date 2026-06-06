export type ScanRunState = "idle" | "scanning" | "canceling" | "ready" | "failed";

export function scanRunFailureText(state: ScanRunState, hasResult: boolean): string | null {
  if (state !== "failed") return null;
  return hasResult
    ? "Could not refresh scan results. Existing results are still shown. Check the error above, adjust the limit, or retry."
    : "Could not scan prompts. Check the error above, adjust the limit, or retry.";
}

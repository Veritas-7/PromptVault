export type ImportRefreshState = "idle" | "loading" | "ready" | "failed";

export function importRefreshFailureText(state: ImportRefreshState, label: string): string | null {
  if (state !== "failed") return null;
  return `Could not refresh ${label}. Existing data may be stale.`;
}

export function importRefreshUnavailableText(state: ImportRefreshState, label: string): string {
  if (state === "failed") return `${label} is unavailable. Use Refresh to try again.`;
  return `Loading ${label}.`;
}

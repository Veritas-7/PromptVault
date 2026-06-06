export type ImportRefreshState = "idle" | "loading" | "ready" | "failed";

export function importRefreshFailureText(state: ImportRefreshState, label: string): string | null {
  if (state !== "failed") return null;
  return `Could not refresh ${label}. Existing data may be stale.`;
}

function sentenceStart(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Data";
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

export function importRefreshUnavailableText(state: ImportRefreshState, label: string): string {
  const target = sentenceStart(label);
  if (state === "failed") return `${target} is unavailable. Use Refresh to try again.`;
  return `Loading ${label}.`;
}

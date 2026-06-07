export const QUICK_SCAN_SOURCE_IDS = [
  "codex-cx",
  "claude-code-history",
  "antigravity-cli-history",
  "gemini-tmp-chat",
] as const;

export function quickScanSourceIds(): string[] {
  return [...QUICK_SCAN_SOURCE_IDS];
}

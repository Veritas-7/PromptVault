export const QUICK_SCAN_SOURCE_IDS = [
  "antigravity-cli-conversation-db",
  "antigravity-ide-conversation-db",
  "gemini-tmp-chat",
  "antigravity-cli-history",
  "claude-code-history",
  "codex-cx",
] as const;

export const QUICK_SCAN_SOURCE_LIMIT = 5;

export function quickScanSourceIds(): string[] {
  return [...QUICK_SCAN_SOURCE_IDS];
}

import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";

export type PanelRefreshState = "idle" | "loading" | "ready" | "failed";

export function refreshGlobalErrorAfterSuccess(
  quiet: boolean,
  currentError: string | null,
): string | null {
  return quiet ? currentError : null;
}

function objectParticle(label: string): "을" | "를" {
  const trimmed = label.trim();
  const lastChar = trimmed.charAt(trimmed.length - 1);
  if (!lastChar) return "을";
  const codePoint = lastChar.charCodeAt(0);
  if (codePoint < 0xac00 || codePoint > 0xd7a3) return "을";
  const hasFinalConsonant = (codePoint - 0xac00) % 28 !== 0;
  return hasFinalConsonant ? "을" : "를";
}

export function panelRefreshActionLabel(
  label: string,
  state: PanelRefreshState,
  lockState: ActionLockState,
): string {
  if (state === "loading") return `${label} 새로고침 중`;
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 ${label}${objectParticle(label)} 새로고침할 수 없습니다`;
  return `${label} 새로고침`;
}

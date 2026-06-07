import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";

export type PanelRefreshState = "idle" | "loading" | "ready" | "failed";

export function refreshGlobalErrorAfterSuccess(
  quiet: boolean,
  currentError: string | null,
): string | null {
  return quiet ? currentError : null;
}

export function panelRefreshActionLabel(
  label: string,
  state: PanelRefreshState,
  lockState: ActionLockState,
): string {
  if (state === "loading") return `${label} 새로고침 중`;
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 ${label}을 새로고침할 수 없습니다`;
  return `${label} 새로고침`;
}

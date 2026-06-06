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
  if (state === "loading") return `Refreshing ${label}`;
  const reason = activeActionLockReason(lockState);
  if (reason) return `Cannot refresh ${label} while ${reason}`;
  return `Refresh ${label}`;
}

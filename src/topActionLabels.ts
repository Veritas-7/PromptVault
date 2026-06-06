import type { ActionLockState } from "./actionLocks";
import type { PlanRunState } from "./planStatus";
import type { ScanRunState } from "./scanStatus";
import type { StoredLoadState } from "./storedLoadStatus";

export function activeActionLockReason(state: ActionLockState): string | null {
  if (state.scanRunning) return "a scan is running";
  if (state.planRunning) return "an import plan is running";
  if (state.importRunning) return "an import is running";
  if (state.storedLoadRunning) return "stored prompts are loading";
  if (state.improvementRunning) return "an improvement is running";
  return null;
}

export function scanActionLabel(scanState: ScanRunState, lockState: ActionLockState): string {
  if (scanState === "canceling") return "Stopping active scan";
  if (scanState === "scanning") return "Scanning prompts";
  const reason = activeActionLockReason(lockState);
  if (reason) return `Cannot scan prompts while ${reason}`;
  return "Scan prompts";
}

export function scanStopActionLabel(scanState: ScanRunState): string {
  if (scanState === "canceling") return "Stopping active scan";
  return "Stop active scan";
}

export function storedLoadActionLabel(
  storedLoadState: StoredLoadState,
  lockState: ActionLockState,
): string {
  if (storedLoadState === "loading") return "Loading stored prompts";
  const reason = activeActionLockReason(lockState);
  if (reason) return `Cannot load stored prompts while ${reason}`;
  return "Load stored prompts";
}

export function planActionLabel(planState: PlanRunState, lockState: ActionLockState): string {
  if (planState === "planning") return "Planning import sources";
  const reason = activeActionLockReason(lockState);
  if (reason) return `Cannot plan import sources while ${reason}`;
  return planState === "failed" ? "Retry import source plan" : "Plan import sources";
}

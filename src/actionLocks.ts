export interface ActionLockState {
  importRunning: boolean;
  improvementRunning: boolean;
  planRunning: boolean;
  scanRunning: boolean;
  storedLoadRunning: boolean;
}

export interface ExclusiveActionClaim {
  current: boolean;
}

export function topLevelActionLocked(state: ActionLockState): boolean {
  return (
    state.scanRunning ||
    state.planRunning ||
    state.importRunning ||
    state.storedLoadRunning ||
    state.improvementRunning
  );
}

export function importActionLocked(state: ActionLockState): boolean {
  return topLevelActionLocked(state);
}

export function activeActionLockReason(state: ActionLockState): string | null {
  if (state.scanRunning) return "a scan is running";
  if (state.planRunning) return "an import plan is running";
  if (state.importRunning) return "an import is running";
  if (state.storedLoadRunning) return "stored prompts are loading";
  if (state.improvementRunning) return "an improvement is running";
  return null;
}

export function claimExclusiveAction(claim: ExclusiveActionClaim): boolean {
  if (claim.current) return false;
  claim.current = true;
  return true;
}

export function releaseExclusiveAction(claim: ExclusiveActionClaim): void {
  claim.current = false;
}

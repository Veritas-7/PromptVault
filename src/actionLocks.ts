export interface ActionLockState {
  importRunning: boolean;
  improvementRunning: boolean;
  scanRunning: boolean;
  storedLoadRunning: boolean;
}

export interface ExclusiveActionClaim {
  current: boolean;
}

export function topLevelActionLocked(state: ActionLockState): boolean {
  return (
    state.scanRunning ||
    state.importRunning ||
    state.storedLoadRunning ||
    state.improvementRunning
  );
}

export function importActionLocked(state: ActionLockState): boolean {
  return topLevelActionLocked(state);
}

export function claimExclusiveAction(claim: ExclusiveActionClaim): boolean {
  if (claim.current) return false;
  claim.current = true;
  return true;
}

export function releaseExclusiveAction(claim: ExclusiveActionClaim): void {
  claim.current = false;
}

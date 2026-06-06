export interface ActionLockState {
  importRunning: boolean;
  improvementRunning: boolean;
  scanRunning: boolean;
  storedLoadRunning: boolean;
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

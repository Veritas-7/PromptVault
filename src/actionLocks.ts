export interface ActionLockState {
  importRunning: boolean;
  scanRunning: boolean;
  storedLoadRunning: boolean;
}

export function topLevelActionLocked(state: ActionLockState): boolean {
  return state.scanRunning || state.importRunning || state.storedLoadRunning;
}

export function importActionLocked(state: ActionLockState): boolean {
  return state.importRunning || state.scanRunning || state.storedLoadRunning;
}

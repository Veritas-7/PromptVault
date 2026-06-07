export interface ActionLockState {
  browserBridgeChecking?: boolean;
  browserBridgeDisconnected?: boolean;
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
    state.improvementRunning ||
    Boolean(state.browserBridgeChecking) ||
    Boolean(state.browserBridgeDisconnected)
  );
}

export function importActionLocked(state: ActionLockState): boolean {
  return topLevelActionLocked(state);
}

export function activeActionLockReason(state: ActionLockState): string | null {
  if (state.scanRunning) return "스캔 실행 중";
  if (state.planRunning) return "가져오기 계획 생성 중";
  if (state.importRunning) return "가져오기 실행 중";
  if (state.storedLoadRunning) return "저장된 프롬프트 불러오는 중";
  if (state.improvementRunning) return "프롬프트 추천 생성 중";
  if (state.browserBridgeChecking) return "브라우저 브리지 확인 중";
  if (state.browserBridgeDisconnected) return "브라우저 브리지 연결 전";
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

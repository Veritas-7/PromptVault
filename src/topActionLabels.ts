import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import type { PlanRunState } from "./planStatus";
import type { PreviewMode } from "./previewMode";
import type { ScanRunState } from "./scanStatus";
import type { StoredLoadState } from "./storedLoadStatus";

export { activeActionLockReason } from "./actionLocks.ts";

export type BrowserBridgeCheckState = "native" | "checking" | "connected" | "disconnected";

function activeWorkActionLockReason(state: ActionLockState): string | null {
  if (state.scanRunning) return "스캔 실행 중";
  if (state.planRunning) return "가져오기 계획 생성 중";
  if (state.importRunning) return "가져오기 실행 중";
  if (state.storedLoadRunning) return "저장된 프롬프트 불러오는 중";
  if (state.improvementRunning) return "프롬프트 추천 생성 중";
  return null;
}

export function browserBridgeCheckActionDisabled(
  status: BrowserBridgeCheckState,
  lockState: ActionLockState,
): boolean {
  return status === "checking" || activeWorkActionLockReason(lockState) !== null;
}

export function browserBridgeCheckActionLabel(
  status: BrowserBridgeCheckState,
  lockState: ActionLockState,
): string {
  if (status === "checking") return "브라우저 브리지 확인 중";
  const reason = activeWorkActionLockReason(lockState);
  if (reason) return `${reason}에는 브라우저 브리지 연결을 다시 확인할 수 없습니다`;
  return status === "disconnected"
    ? "브라우저 브리지 연결 다시 확인"
    : "브라우저 브리지 다시 확인";
}

export function scanActionLabel(scanState: ScanRunState, lockState: ActionLockState): string {
  if (scanState === "canceling") return "실행 중인 스캔 중지 중";
  if (scanState === "scanning") return "빠른 프롬프트 스캔 중";
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 빠른 프롬프트를 스캔할 수 없습니다`;
  return "빠른 프롬프트 스캔";
}

export function scanStopActionLabel(scanState: ScanRunState): string {
  if (scanState === "canceling") return "실행 중인 스캔 중지 중";
  return "실행 중인 스캔 중지";
}

export function storedLoadActionLabel(
  storedLoadState: StoredLoadState,
  lockState: ActionLockState,
): string {
  if (storedLoadState === "loading") return "저장된 프롬프트 불러오는 중";
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 저장된 프롬프트를 불러올 수 없습니다`;
  return "저장된 프롬프트 불러오기";
}

export function planActionLabel(planState: PlanRunState, lockState: ActionLockState): string {
  if (planState === "planning") return "가져오기 소스 계획 중";
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 가져오기 소스를 계획할 수 없습니다`;
  return planState === "failed" ? "가져오기 소스 계획 다시 시도" : "가져오기 소스 계획";
}

export function planPanelActionLabel(
  planState: PlanRunState,
  hasPlan: boolean,
  lockState: ActionLockState,
): string {
  if (planState === "planning") {
    return hasPlan ? "가져오기 소스 계획 새로고침 중" : "가져오기 소스 계획 중";
  }

  const lockedAction = hasPlan
    ? "가져오기 소스 계획을 새로고침할"
    : "가져오기 소스 계획을 다시 시도할";
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 ${lockedAction} 수 없습니다`;

  return hasPlan ? "가져오기 소스 계획 새로고침" : "가져오기 소스 계획 다시 시도";
}

export function previewModeActionLabel(
  targetMode: PreviewMode,
  currentMode: PreviewMode,
  lockState: ActionLockState,
): string {
  const targetLabel = targetMode === "latest" ? "최신 프롬프트 미리보기" : "개선 우선 프롬프트 미리보기";
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 ${targetLabel}로 전환할 수 없습니다`;
  return targetMode === currentMode
    ? `${targetLabel} 선택됨`
    : `${targetLabel}로 전환`;
}

export function scanLimitInputLabel(lockState: ActionLockState): string {
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 스캔 프롬프트 제한을 편집할 수 없습니다`;
  return "스캔 프롬프트 제한";
}

export function promptFilterInputLabel(lockState: ActionLockState): string {
  const reason = activeActionLockReason(lockState);
  if (reason) return `${reason}에는 프롬프트 필터를 편집할 수 없습니다`;
  return "프롬프트 필터";
}

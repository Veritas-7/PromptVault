import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  activeActionLockReason,
  planActionLabel,
  planPanelActionLabel,
  previewModeActionLabel,
  promptFilterInputLabel,
  scanActionLabel,
  scanLimitInputLabel,
  scanStopActionLabel,
  storedLoadActionLabel,
} from "../src/topActionLabels.ts";

function lockState(overrides: Partial<ActionLockState> = {}): ActionLockState {
  return {
    importRunning: false,
    improvementRunning: false,
    planRunning: false,
    scanRunning: false,
    storedLoadRunning: false,
    ...overrides,
  };
}

test("active action lock reason names the blocking operation", () => {
  assert.equal(activeActionLockReason(lockState()), null);
  assert.equal(activeActionLockReason(lockState({ scanRunning: true })), "스캔 실행 중");
  assert.equal(activeActionLockReason(lockState({ planRunning: true })), "가져오기 계획 생성 중");
  assert.equal(activeActionLockReason(lockState({ importRunning: true })), "가져오기 실행 중");
  assert.equal(
    activeActionLockReason(lockState({ storedLoadRunning: true })),
    "저장된 프롬프트 불러오는 중",
  );
  assert.equal(
    activeActionLockReason(lockState({ improvementRunning: true })),
    "프롬프트 추천 생성 중",
  );
  assert.equal(
    activeActionLockReason(lockState({ browserBridgeChecking: true })),
    "브라우저 브리지 확인 중",
  );
  assert.equal(
    activeActionLockReason(lockState({ browserBridgeDisconnected: true })),
    "브라우저 브리지 연결 전",
  );
});

test("scan action label explains running and locked states", () => {
  assert.equal(scanActionLabel("idle", lockState()), "빠른 프롬프트 스캔");
  assert.equal(scanActionLabel("scanning", lockState({ scanRunning: true })), "빠른 프롬프트 스캔 중");
  assert.equal(scanActionLabel("canceling", lockState({ scanRunning: true })), "실행 중인 스캔 중지 중");
  assert.equal(
    scanActionLabel("idle", lockState({ importRunning: true })),
    "가져오기 실행 중에는 빠른 프롬프트를 스캔할 수 없습니다",
  );
  assert.equal(
    scanActionLabel("idle", lockState({ browserBridgeDisconnected: true })),
    "브라우저 브리지 연결 전에는 빠른 프롬프트를 스캔할 수 없습니다",
  );
});

test("scan stop action label explains the canceling state", () => {
  assert.equal(scanStopActionLabel("scanning"), "실행 중인 스캔 중지");
  assert.equal(scanStopActionLabel("canceling"), "실행 중인 스캔 중지 중");
});

test("stored load action label explains loading and locked states", () => {
  assert.equal(storedLoadActionLabel("idle", lockState()), "저장된 프롬프트 불러오기");
  assert.equal(storedLoadActionLabel("loading", lockState({ storedLoadRunning: true })), "저장된 프롬프트 불러오는 중");
  assert.equal(
    storedLoadActionLabel("idle", lockState({ improvementRunning: true })),
    "프롬프트 추천 생성 중에는 저장된 프롬프트를 불러올 수 없습니다",
  );
});

test("plan action label explains planning, failed, and locked states", () => {
  assert.equal(planActionLabel("idle", lockState()), "가져오기 소스 계획");
  assert.equal(planActionLabel("ready", lockState()), "가져오기 소스 계획");
  assert.equal(planActionLabel("failed", lockState()), "가져오기 소스 계획 다시 시도");
  assert.equal(planActionLabel("planning", lockState({ planRunning: true })), "가져오기 소스 계획 중");
  assert.equal(
    planActionLabel("ready", lockState({ storedLoadRunning: true })),
    "저장된 프롬프트 불러오는 중에는 가져오기 소스를 계획할 수 없습니다",
  );
});

test("plan panel action label explains refresh, retry, and locked states", () => {
  assert.equal(planPanelActionLabel("ready", true, lockState()), "가져오기 소스 계획 새로고침");
  assert.equal(planPanelActionLabel("failed", false, lockState()), "가져오기 소스 계획 다시 시도");
  assert.equal(
    planPanelActionLabel("planning", true, lockState({ planRunning: true })),
    "가져오기 소스 계획 새로고침 중",
  );
  assert.equal(
    planPanelActionLabel("ready", true, lockState({ importRunning: true })),
    "가져오기 실행 중에는 가져오기 소스 계획 새로고침를 할 수 없습니다",
  );
  assert.equal(
    planPanelActionLabel("failed", false, lockState({ scanRunning: true })),
    "스캔 실행 중에는 가져오기 소스 계획 다시 시도를 할 수 없습니다",
  );
});

test("preview mode action label explains selected, switch, and locked states", () => {
  assert.equal(previewModeActionLabel("latest", "latest", lockState()), "최신 프롬프트 미리보기 선택됨");
  assert.equal(previewModeActionLabel("weakest", "latest", lockState()), "개선 우선 프롬프트 미리보기로 전환");
  assert.equal(
    previewModeActionLabel("weakest", "latest", lockState({ scanRunning: true })),
    "스캔 실행 중에는 개선 우선 프롬프트 미리보기로 전환할 수 없습니다",
  );
});

test("scan limit input label explains locked states", () => {
  assert.equal(scanLimitInputLabel(lockState()), "스캔 프롬프트 제한");
  assert.equal(
    scanLimitInputLabel(lockState({ planRunning: true })),
    "가져오기 계획 생성 중에는 스캔 프롬프트 제한을 편집할 수 없습니다",
  );
});

test("prompt filter input label explains locked states", () => {
  assert.equal(promptFilterInputLabel(lockState()), "프롬프트 필터");
  assert.equal(
    promptFilterInputLabel(lockState({ improvementRunning: true })),
    "프롬프트 추천 생성 중에는 프롬프트 필터를 편집할 수 없습니다",
  );
});

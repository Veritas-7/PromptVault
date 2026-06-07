import assert from "node:assert/strict";
import test from "node:test";
import { panelRefreshActionLabel, refreshGlobalErrorAfterSuccess } from "../src/panelRefresh.ts";

const lockState = (overrides = {}) => ({
  importRunning: false,
  improvementRunning: false,
  planRunning: false,
  scanRunning: false,
  storedLoadRunning: false,
  ...overrides,
});

test("manual panel refresh success clears stale global errors", () => {
  assert.equal(refreshGlobalErrorAfterSuccess(false, "previous failure"), null);
});

test("quiet panel refresh success preserves existing global errors", () => {
  assert.equal(
    refreshGlobalErrorAfterSuccess(true, "import failed"),
    "import failed",
  );
});

test("panel refresh labels explain ready, loading, and locked states", () => {
  assert.equal(
    panelRefreshActionLabel("저장된 가져오기 진행", "ready", lockState()),
    "저장된 가져오기 진행 새로고침",
  );
  assert.equal(
    panelRefreshActionLabel("저장된 가져오기 진행", "loading", lockState()),
    "저장된 가져오기 진행 새로고침 중",
  );
  assert.equal(
    panelRefreshActionLabel("저장소 필터 후보", "ready", lockState({ importRunning: true })),
    "가져오기 실행 중에는 저장소 필터 후보를 새로고침할 수 없습니다",
  );
  assert.equal(
    panelRefreshActionLabel("최근 가져오기 기록", "failed", lockState({ scanRunning: true })),
    "스캔 실행 중에는 최근 가져오기 기록을 새로고침할 수 없습니다",
  );
});

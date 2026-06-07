import assert from "node:assert/strict";
import test from "node:test";
import {
  importQueueActionLabel,
  importQueueFinalState,
  selectedQueueSourceIds,
  toggleSourceSelection,
} from "../src/importQueue.ts";
import type { ActionLockState } from "../src/actionLocks.ts";
import type { SourcePlan } from "../src/types.ts";

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

function source(id: string, fileCount: number): SourcePlan {
  return {
    id,
    label: id,
    root_path: `/tmp/${id}`,
    status: fileCount > 0 ? "ok" : "missing",
    file_count: fileCount,
    byte_count: 0,
    large_file_count: 0,
    largest_file_bytes: 0,
    newest_modified_at: null,
    notes: [],
  };
}

test("source selection toggles without duplicates", () => {
  assert.deepEqual(toggleSourceSelection([], "a", true), ["a"]);
  assert.deepEqual(toggleSourceSelection(["a"], "a", true), ["a"]);
  assert.deepEqual(toggleSourceSelection(["a", "b"], "a", false), ["b"]);
});

test("queue keeps selected order and skips unavailable sources", () => {
  const sources = [source("a", 10), source("b", 0), source("c", 2)];

  assert.deepEqual(selectedQueueSourceIds(["c", "b", "a", "missing"], sources), ["c", "a"]);
});

test("queue action label explains disabled zero-selection state", () => {
  assert.equal(importQueueActionLabel(0, false, lockState()), "대기열을 실행하기 전에 가져올 소스를 선택하세요");
  assert.equal(
    importQueueActionLabel(0, false, lockState({ scanRunning: true })),
    "대기열을 실행하기 전에 가져올 소스를 선택하세요",
  );
});

test("queue action label includes selected source count", () => {
  assert.equal(importQueueActionLabel(1, false, lockState()), "선택한 소스 1개 가져오기");
  assert.equal(importQueueActionLabel(2, false, lockState()), "선택한 소스 2개 가져오기");
});

test("queue action label announces running queue state", () => {
  assert.equal(
    importQueueActionLabel(3, true, lockState({ importRunning: true })),
    "선택한 소스 3개의 가져오기 대기열 실행 중",
  );
});

test("queue action label explains top-level lock reasons", () => {
  assert.equal(
    importQueueActionLabel(2, false, lockState({ scanRunning: true })),
    "스캔 실행 중에는 선택한 소스를 가져올 수 없습니다",
  );
  assert.equal(
    importQueueActionLabel(2, false, lockState({ storedLoadRunning: true })),
    "저장된 프롬프트 불러오는 중에는 선택한 소스를 가져올 수 없습니다",
  );
});

test("queue final state treats stop after final source completion as ready", () => {
  assert.deepEqual(importQueueFinalState(1, 1, true), {
    completedSourceCount: 1,
    state: "ready",
  });
});

test("queue final state reports stopped when stop leaves sources remaining", () => {
  assert.deepEqual(importQueueFinalState(3, 1, true), {
    completedSourceCount: 1,
    state: "stopped",
  });
});

test("queue final state bounds completed source count", () => {
  assert.deepEqual(importQueueFinalState(2, 5, false), {
    completedSourceCount: 2,
    state: "ready",
  });
});

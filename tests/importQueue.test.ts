import assert from "node:assert/strict";
import test from "node:test";
import {
  availableQueueSourceIds,
  importQueueActionLabel,
  importQueueClearSelectionLabel,
  importQueueFinalState,
  importQueueSelectionSummaryLabel,
  importQueueSelectAllLabel,
  plannedQueueSourceIds,
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

test("available queue source ids keep plan order and omit empty sources", () => {
  assert.deepEqual(
    availableQueueSourceIds([source("a", 10), source("b", 0), source("c", 2)]),
    ["a", "c"],
  );
});

test("plan defaults to all available queue sources when no previous selection exists", () => {
  assert.deepEqual(
    plannedQueueSourceIds([], [source("a", 10), source("b", 0), source("c", 2)]),
    ["a", "c"],
  );
});

test("plan preserves available previous queue selection", () => {
  assert.deepEqual(
    plannedQueueSourceIds(["c", "b"], [source("a", 10), source("b", 0), source("c", 2)]),
    ["c"],
  );
});

test("queue select all label explains availability and lock states", () => {
  assert.equal(importQueueSelectAllLabel(0, 0, lockState()), "전체 선택할 가져오기 소스 없음");
  assert.equal(importQueueSelectAllLabel(3, 3, lockState()), "가져올 수 있는 소스 모두 선택됨");
  assert.equal(importQueueSelectAllLabel(3, 1, lockState()), "가져올 수 있는 소스 3개 전체 선택");
  assert.equal(
    importQueueSelectAllLabel(3, 1, lockState({ planRunning: true })),
    "가져오기 계획 생성 중에는 가져오기 소스를 전체 선택할 수 없습니다",
  );
});

test("queue clear selection label explains empty and lock states", () => {
  assert.equal(importQueueClearSelectionLabel(0, lockState()), "해제할 가져오기 소스 선택 없음");
  assert.equal(importQueueClearSelectionLabel(2, lockState()), "선택한 가져오기 소스 2개 해제");
  assert.equal(
    importQueueClearSelectionLabel(2, lockState({ importRunning: true })),
    "가져오기 실행 중에는 가져오기 소스 선택을 해제할 수 없습니다",
  );
});

test("queue selection summary includes available source count", () => {
  assert.equal(importQueueSelectionSummaryLabel(0, 0), "선택 가능한 소스 없음");
  assert.equal(importQueueSelectionSummaryLabel(0, 11), "0 / 11개 선택됨");
  assert.equal(importQueueSelectionSummaryLabel(3, 11), "3 / 11개 선택됨");
  assert.equal(importQueueSelectionSummaryLabel(99, 11), "11 / 11개 선택됨");
  assert.equal(importQueueSelectionSummaryLabel(-3, 11), "0 / 11개 선택됨");
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

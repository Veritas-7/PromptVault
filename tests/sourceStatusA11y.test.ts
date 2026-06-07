import assert from "node:assert/strict";
import test from "node:test";
import {
  planSourceActionLabel,
  planSourceSelectionLabel,
  planSourceStatusLabel,
  sourceSummaryStatusLabel,
} from "../src/sourceStatusA11y.ts";
import type { ActionLockState } from "../src/actionLocks.ts";

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

test("plan source status labels include availability, file count, and size", () => {
  assert.equal(
    planSourceStatusLabel("Codex", "ok", 25105, "32.8 GiB"),
    "Codex 소스 사용 가능: 25,105개 파일, 32.8 GiB",
  );
  assert.equal(
    planSourceStatusLabel("Small source", "ok", 1, "8 KiB"),
    "Small source 소스 사용 가능: 1개 파일, 8 KiB",
  );
});

test("plan source status labels include empty-source notes", () => {
  assert.equal(
    planSourceStatusLabel("Antigravity IDE alt transcripts", "empty", 0, "0 B", [
      "일치하는 프롬프트 파일을 찾지 못했습니다.",
    ]),
    "Antigravity IDE alt transcripts 소스 비어 있음: 0개 파일, 0 B. 일치하는 프롬프트 파일을 찾지 못했습니다.",
  );
});

test("plan source selection labels include source status context", () => {
  assert.equal(
    planSourceSelectionLabel("Codex", "ok", 25105, "32.8 GiB"),
    "Codex 소스 사용 가능: 25,105개 파일, 32.8 GiB 가져오기 대기열 선택",
  );
});

test("plan source selection labels include disabled empty-source reason", () => {
  assert.equal(
    planSourceSelectionLabel("Antigravity IDE alt transcripts", "empty", 0, "0 B", [
      "일치하는 프롬프트 파일을 찾지 못했습니다.",
    ]),
    "Antigravity IDE alt transcripts 소스 비어 있음: 0개 파일, 0 B. 일치하는 프롬프트 파일을 찾지 못했습니다. 가져오기 대기열 선택",
  );
});

test("plan source selection labels explain top-level lock reasons", () => {
  assert.equal(
    planSourceSelectionLabel("Codex", "ok", 25105, "32.8 GiB", [], lockState({ scanRunning: true })),
    "스캔 실행 중에는 Codex 소스 사용 가능: 25,105개 파일, 32.8 GiB의 가져오기 대기열 선택을 바꿀 수 없습니다",
  );
});

test("plan source action labels include enabled source status context", () => {
  assert.equal(
    planSourceActionLabel("batch", "Codex", "ok", 25105, "32.8 GiB"),
    "Codex 소스 사용 가능: 25,105개 파일, 32.8 GiB 한 배치 가져오기",
  );
});

test("plan source action labels include disabled empty-source reason", () => {
  assert.equal(
    planSourceActionLabel("continuous", "Antigravity IDE alt transcripts", "empty", 0, "0 B", [
      "일치하는 프롬프트 파일을 찾지 못했습니다.",
    ]),
    "Antigravity IDE alt transcripts 소스 비어 있음: 0개 파일, 0 B. 일치하는 프롬프트 파일을 찾지 못했습니다.은 파일이 없어 끝까지 가져오기를 실행할 수 없습니다",
  );
});

test("plan source action labels explain top-level lock reasons", () => {
  assert.equal(
    planSourceActionLabel(
      "batch",
      "Codex",
      "ok",
      25105,
      "32.8 GiB",
      [],
      lockState({ importRunning: true }),
    ),
    "가져오기 실행 중에는 Codex 소스 사용 가능: 25,105개 파일, 32.8 GiB의 한 배치 가져오기를 실행할 수 없습니다",
  );
  assert.equal(
    planSourceActionLabel(
      "continuous",
      "Claude Code projects",
      "ok",
      1722,
      "714.2 MiB",
      [],
      lockState({ storedLoadRunning: true }),
    ),
    "저장된 프롬프트 불러오는 중에는 Claude Code projects 소스 사용 가능: 1,722개 파일, 714.2 MiB의 끝까지 가져오기를 실행할 수 없습니다",
  );
});

test("plan source action labels keep empty-source reasons before lock reasons", () => {
  assert.equal(
    planSourceActionLabel("batch", "Empty", "empty", 0, "0 B", [], lockState({ scanRunning: true })),
    "Empty 소스 비어 있음: 0개 파일, 0 B은 파일이 없어 한 배치 가져오기를 실행할 수 없습니다",
  );
});

test("source summary status labels include stored prompt counts", () => {
  assert.equal(
    sourceSummaryStatusLabel("Codex", "stored", 925),
    "Codex 소스 저장됨: 925개 프롬프트 발견",
  );
  assert.equal(
    sourceSummaryStatusLabel("Small source", "stored", 1),
    "Small source 소스 저장됨: 1개 프롬프트 발견",
  );
});

test("source summary status labels preserve unknown backend statuses", () => {
  assert.equal(
    sourceSummaryStatusLabel("Claude", "degraded", 12),
    "Claude 소스 degraded: 12개 프롬프트 발견",
  );
});

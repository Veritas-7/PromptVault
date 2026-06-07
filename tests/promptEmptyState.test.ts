import assert from "node:assert/strict";
import test from "node:test";
import {
  promptListEmptyText,
  recommendationEmptyText,
  selectedPromptEmptyText,
} from "../src/promptEmptyState.ts";

test("prompt list explains how to load data before data is loaded", () => {
  assert.equal(
    promptListEmptyText(false, ""),
    "스캔하거나 저장소 불러오기를 실행하면 프롬프트가 여기에 표시됩니다.",
  );
});

test("prompt list explains in-flight loading before empty data", () => {
  assert.equal(promptListEmptyText(true, "", 0, true), "프롬프트를 불러오는 중입니다.");
});

test("prompt list explains empty loaded data", () => {
  assert.equal(promptListEmptyText(true, " "), "불러온 프롬프트가 없습니다.");
});

test("prompt list explains filter misses", () => {
  assert.equal(promptListEmptyText(true, "missing"), "현재 필터와 일치하는 프롬프트가 없습니다.");
});

test("prompt list explains stored filter misses", () => {
  assert.equal(
    promptListEmptyText(true, "", 2),
    "현재 저장소 필터와 일치하는 저장 프롬프트가 없습니다.",
  );
});

test("selected prompt empty state preserves load guidance before data exists", () => {
  assert.equal(selectedPromptEmptyText(false, "missing"), "스캔하거나 저장된 프롬프트를 불러오세요.");
});

test("selected prompt empty state explains in-flight loading", () => {
  assert.equal(selectedPromptEmptyText(true, "", 0, true), "프롬프트를 불러오는 중입니다.");
});

test("selected prompt empty state explains filtered-out selections", () => {
  assert.equal(
    selectedPromptEmptyText(true, "missing"),
    "현재 필터에서 보이는 프롬프트가 없습니다.",
  );
});

test("selected prompt empty state explains stored filter misses", () => {
  assert.equal(
    selectedPromptEmptyText(true, "", 1),
    "현재 저장소 필터와 일치하는 프롬프트가 없습니다.",
  );
});

test("recommendation empty state prompts improvement for a selected prompt", () => {
  assert.equal(
    recommendationEmptyText(true, true, ""),
    "선택한 프롬프트의 추천을 생성하세요.",
  );
});

test("recommendation empty state explains in-flight loading", () => {
  assert.equal(
    recommendationEmptyText(false, true, "", 0, true),
    "프롬프트를 불러온 뒤 추천을 생성할 수 있습니다.",
  );
});

test("recommendation empty state explains in-flight improvement", () => {
  assert.equal(
    recommendationEmptyText(true, true, "", 0, false, true),
    "선택한 프롬프트 추천을 생성하는 중입니다.",
  );
});

test("recommendation empty state defers to selected prompt failure warnings", () => {
  assert.equal(recommendationEmptyText(true, true, "", 0, false, false, true), null);
});

test("recommendation empty state keeps prompt loading ahead of improvement loading", () => {
  assert.equal(
    recommendationEmptyText(true, true, "", 0, true, true),
    "프롬프트를 불러온 뒤 추천을 생성할 수 있습니다.",
  );
});

test("recommendation empty state explains filter-hidden selections", () => {
  assert.equal(
    recommendationEmptyText(false, true, "missing"),
    "추천을 생성하기 전에 프롬프트 필터를 지우거나 보이는 프롬프트를 선택하세요.",
  );
});

test("recommendation empty state explains stored filter misses", () => {
  assert.equal(
    recommendationEmptyText(false, true, "", 1),
    "추천을 생성하기 전에 저장소 필터를 조정하거나 초기화하세요.",
  );
});

test("recommendation empty state keeps selection guidance before data exists", () => {
  assert.equal(recommendationEmptyText(false, false, ""), "프롬프트를 선택하고 추천을 생성하세요.");
});

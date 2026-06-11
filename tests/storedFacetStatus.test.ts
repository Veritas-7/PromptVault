import assert from "node:assert/strict";
import test from "node:test";
import {
  storedFacetSummaryText,
  storedFacetsFailureText,
  type StoredFacetsState,
} from "../src/storedFacetStatus.ts";

const readyResult = {
  dates: [{ text: "2026-06-06", count: 3 }],
  projects: [{ text: "PromptVault", count: 12 }],
  sources: [{ text: "Codex", count: 200 }],
  total_prompts: 362,
  workspaces: [{ text: "PromptVault", count: 12 }],
};

test("stored facet failure text is only shown after failed refreshes", () => {
  const failed: StoredFacetsState = "failed";
  assert.equal(
    storedFacetsFailureText(failed),
    "저장소 필터 후보를 새로고침하지 못했습니다. 필터 후보가 오래되었을 수 있습니다.",
  );
  assert.equal(storedFacetsFailureText("ready"), null);
});

test("stored facet summary uses live facet result when available", () => {
  assert.equal(
    storedFacetSummaryText("ready", 0, readyResult),
    "362개 저장됨, 소스 1개, 날짜 1개, 프로젝트 1개, 작업공간 1개",
  );
  assert.equal(
    storedFacetSummaryText("ready", 0, {
      dates: [],
      projects: [{ text: "PromptVault", count: 12 }],
      sources: [{ text: "Codex", count: 200 }, { text: "Claude", count: 20 }],
      total_prompts: 220,
      workspaces: [{ text: "PromptVault", count: 12 }, { text: "Other", count: 2 }],
    }),
    "220개 저장됨, 소스 2개, 날짜 0개, 프로젝트 1개, 작업공간 2개",
  );
});

test("stored facet summary distinguishes loading and failed states without data", () => {
  assert.equal(storedFacetSummaryText("loading", 0, null), "저장소 필터 후보 불러오는 중");
  assert.equal(storedFacetSummaryText("failed", 0, null), "저장소 필터 후보를 사용할 수 없음");
  assert.equal(
    storedFacetSummaryText("failed", 1, null),
    "필터 후보 새로고침 실패, 필터 1개 활성",
  );
  assert.equal(
    storedFacetSummaryText("failed", 2, null),
    "필터 후보 새로고침 실패, 필터 2개 활성",
  );
  assert.equal(storedFacetSummaryText("ready", 1, null), "필터 1개 활성");
  assert.equal(storedFacetSummaryText("ready", 2, null), "필터 2개 활성");
});

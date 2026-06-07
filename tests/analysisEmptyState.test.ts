import assert from "node:assert/strict";
import test from "node:test";
import { frequencyEmptyText, sourceSummariesEmptyText } from "../src/analysisEmptyState.ts";

test("source summaries empty state explains the pre-load state", () => {
  assert.equal(
    sourceSummariesEmptyText(false),
    "스캔하거나 저장된 프롬프트를 불러오면 소스 범위를 볼 수 있습니다.",
  );
});

test("source summaries empty state explains loaded results without summaries", () => {
  assert.equal(sourceSummariesEmptyText(true), "이 결과에는 소스 요약이 없습니다.");
});

test("frequency empty state explains the pre-load state", () => {
  assert.equal(
    frequencyEmptyText(false, "Words"),
    "스캔하거나 저장된 프롬프트를 불러오면 통계를 볼 수 있습니다.",
  );
});

test("frequency empty state names the empty loaded column", () => {
  assert.equal(frequencyEmptyText(true, "Quality gaps"), "이 결과에는 Quality gaps 데이터가 없습니다.");
});

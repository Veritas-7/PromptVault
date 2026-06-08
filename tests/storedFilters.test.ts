import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  activeStoredPromptFilterCount,
  emptyStoredPromptFilters,
  storedFilterApplyLabel,
  storedFilterInputLabel,
  storedFilterResetCount,
  storedFilterResetLabel,
  storedFilterSuggestionValues,
  storedPromptFiltersSnapshot,
  storedPromptLoadOptions,
  storedResultFilterCount,
  type StoredPromptFilters,
} from "../src/storedFilters.ts";
import { pathDisplayText, sourceLabelDisplayText } from "../src/promptRowA11y.ts";

const emptyFilters: StoredPromptFilters = {
  date: "",
  query: "",
  source: "",
  workspace: "",
};

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

test("stored prompt options trim and omit empty filters", () => {
  assert.deepEqual(storedPromptLoadOptions(emptyFilters, "latest", 1000), {
    date: undefined,
    limit: 1000,
    preview_sort: "latest",
    query: undefined,
    source: undefined,
    workspace: undefined,
  });
});

test("empty stored prompt filters use the full unfiltered shape", () => {
  assert.deepEqual(emptyStoredPromptFilters(), emptyFilters);
});

test("stored prompt options preserve exact source and date filters", () => {
  const options = storedPromptLoadOptions(
    {
      date: "2026-06-06",
      query: " cmux ",
      source: "Codex",
      workspace: " PromptVault ",
    },
    "weakest",
    25,
  );

  assert.deepEqual(options, {
    date: "2026-06-06",
    limit: 25,
    preview_sort: "quality_asc",
    query: "cmux",
    source: "Codex",
    workspace: "PromptVault",
  });
});

test("active stored prompt filter count ignores whitespace", () => {
  assert.equal(activeStoredPromptFilterCount(emptyFilters), 0);
  assert.equal(
    activeStoredPromptFilterCount({
      date: "2026-06-06",
      query: " ",
      source: "Codex",
      workspace: "PromptVault",
    }),
    3,
  );
});

test("stored prompt filter snapshots preserve loaded filter values", () => {
  const filters = {
    date: "2026-06-06",
    query: "cmux",
    source: "Codex",
    workspace: "PromptVault",
  };

  const snapshot = storedPromptFiltersSnapshot(filters);

  assert.deepEqual(snapshot, filters);
  assert.notEqual(snapshot, filters);
});

test("stored result filter count follows the last loaded stored result", () => {
  const loadedFilters = {
    date: "2026-06-06",
    query: "",
    source: "Codex",
    workspace: "PromptVault",
  };

  assert.equal(storedResultFilterCount("stored", loadedFilters), 3);
  assert.equal(storedResultFilterCount("stored", emptyFilters), 0);
  assert.equal(storedResultFilterCount("scan", loadedFilters), 0);
  assert.equal(storedResultFilterCount(null, loadedFilters), 0);
});

test("stored filter reset count includes draft and loaded result filters", () => {
  assert.equal(storedFilterResetCount(0, 0), 0);
  assert.equal(storedFilterResetCount(2, 0), 2);
  assert.equal(storedFilterResetCount(0, 1), 1);
  assert.equal(storedFilterResetCount(2, 1), 2);
  assert.equal(storedFilterResetCount(-1, 1), 1);
});

test("stored filter reset label explains disabled and active states", () => {
  assert.equal(storedFilterResetLabel(0, lockState()), "초기화할 저장소 필터 없음");
  assert.equal(
    storedFilterResetLabel(2, lockState({ importRunning: true })),
    "가져오기 실행 중에는 저장소 필터를 초기화할 수 없습니다",
  );
  assert.equal(storedFilterResetLabel(1, lockState()), "저장소 필터 1개 초기화");
  assert.equal(storedFilterResetLabel(3, lockState()), "저장소 필터 3개 초기화");
});

test("stored filter apply label explains unfiltered, active, and locked states", () => {
  assert.equal(storedFilterApplyLabel(0, lockState()), "필터 없이 저장 프롬프트 불러오기");
  assert.equal(storedFilterApplyLabel(1, lockState()), "저장소 필터 1개 적용");
  assert.equal(storedFilterApplyLabel(3, lockState()), "저장소 필터 3개 적용");
  assert.equal(
    storedFilterApplyLabel(2, lockState({ scanRunning: true })),
    "스캔 실행 중에는 저장소 필터를 적용할 수 없습니다",
  );
});

test("stored filter input labels explain field and locked state", () => {
  assert.equal(storedFilterInputLabel("text", lockState()), "저장소 텍스트 필터");
  assert.equal(storedFilterInputLabel("source", lockState()), "저장소 소스 필터");
  assert.equal(storedFilterInputLabel("date", lockState()), "저장소 날짜 필터");
  assert.equal(storedFilterInputLabel("workspace", lockState()), "저장소 작업공간 필터");
  assert.equal(
    storedFilterInputLabel("text", lockState({ storedLoadRunning: true })),
    "저장된 프롬프트 불러오는 중에는 저장소 텍스트 필터를 편집할 수 없습니다",
  );
  assert.equal(
    storedFilterInputLabel("workspace", lockState({ improvementRunning: true })),
    "프롬프트 추천 생성 중에는 저장소 작업공간 필터를 편집할 수 없습니다",
  );
});

test("stored filter suggestions trim, dedupe, and sort display values", () => {
  assert.deepEqual(
    storedFilterSuggestionValues([" Codex ", "", "Claude", "Codex", "  "]),
    ["Claude", "Codex"],
  );
});

test("stored filter suggestions redact secret-like source and workspace values", () => {
  const sourceFlag = ["--api", "key"].join("-");
  const sourceSecret = ["stored", "source", "secret"].join("-");
  const workspaceFlag = ["--cookie"].join("");
  const workspaceSecret = ["stored", "workspace", "secret"].join("-");

  const sourceSuggestions = storedFilterSuggestionValues(
    [`Codex ${sourceFlag} ${sourceSecret}`],
    sourceLabelDisplayText,
  );
  const workspaceSuggestions = storedFilterSuggestionValues(
    [`/tmp/project ${workspaceFlag} session=${workspaceSecret}`],
    pathDisplayText,
  );

  assert.deepEqual(sourceSuggestions, ["Codex [REDACTED_POSSIBLE_SECRET]"]);
  assert.deepEqual(workspaceSuggestions, ["/tmp/project [REDACTED_POSSIBLE_SECRET]"]);
  assert.doesNotMatch(
    `${sourceSuggestions.join(" ")} ${workspaceSuggestions.join(" ")}`,
    new RegExp(`${sourceFlag}|${sourceSecret}|${workspaceSecret}`),
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  importRefreshFailureText,
  importRefreshUnavailableText,
  type ImportRefreshState,
} from "../src/importRefreshState.ts";

test("import refresh failure text is only shown for failed refreshes", () => {
  assert.equal(
    importRefreshFailureText("failed", "saved import progress"),
    "saved import progress 새로고침에 실패했습니다. 기존 데이터가 오래되었을 수 있습니다.",
  );
  assert.equal(importRefreshFailureText("ready", "saved import progress"), null);
});

test("import refresh unavailable text differentiates loading and failed states", () => {
  const loading: ImportRefreshState = "loading";
  const failed: ImportRefreshState = "failed";

  assert.equal(importRefreshUnavailableText(loading, "import activity"), "import activity을 불러오는 중입니다.");
  assert.equal(
    importRefreshUnavailableText(failed, "import activity"),
    "import activity을 사용할 수 없습니다. 새로고침으로 다시 시도하세요.",
  );
  assert.equal(
    importRefreshUnavailableText(failed, "  "),
    "데이터를 사용할 수 없습니다. 새로고침으로 다시 시도하세요.",
  );
});

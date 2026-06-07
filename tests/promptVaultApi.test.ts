import assert from "node:assert/strict";
import test from "node:test";
import { scanPrompts } from "../src/promptVaultApi.ts";

test("browser bridge responses report malformed JSON without raw parser errors", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("not json", { status: 200 });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 1 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답을 JSON으로 해석하지 못했습니다/);
      assert.doesNotMatch(error.message, /Unexpected token|SyntaxError/);
      return true;
    },
  );
});

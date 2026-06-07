import assert from "node:assert/strict";
import test from "node:test";
import {
  listImportEvents,
  listImportStates,
  listStoredPromptFacets,
  scanPrompts,
} from "../src/promptVaultApi.ts";

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

test("browser bridge responses report unreadable bodies without raw stream errors", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => {
      throw new Error("body stream failure");
    },
  } as Response);
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 1 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답을 읽지 못했습니다/);
      assert.doesNotMatch(error.message, /body stream failure|TypeError/);
      return true;
    },
  );
});

test("browser bridge import states reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ database_path: "/tmp/promptvault.sqlite" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => listImportStates(),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import events reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ database_path: "/tmp/promptvault.sqlite" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => listImportEvents(),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge stored facets reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ database_path: "/tmp/promptvault.sqlite" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => listStoredPromptFacets(),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

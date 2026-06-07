import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelScan,
  importBatch,
  improvePrompt,
  loadStoredPrompts,
  listImportEvents,
  listImportStates,
  listStoredPromptFacets,
  planScan,
  scanProgress,
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

test("browser bridge HTTP errors omit raw response bodies", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("TypeError: Cannot read properties of undefined\n    at scan", {
    status: 500,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 1 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지가 HTTP 500를 반환했습니다/);
      assert.doesNotMatch(error.message, /TypeError|Cannot read properties|undefined|at scan/);
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

test("browser bridge import states reject impossible numeric payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    states: [{
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      total_files: -5,
      total_bytes: -1024,
      next_file_index: -1,
      processed_files: -2,
      imported_prompt_count: -3,
      completed: false,
      updated_at: "2026-06-07T00:00:00Z",
    }],
    total_sources: -1,
    completed_sources: -1,
    total_files: -5,
    processed_files: -2,
    imported_prompt_count: -3,
  }), {
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
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

test("browser bridge import events reject impossible numeric payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    events: [{
      id: -1,
      generated_at: "2026-06-07T00:00:00Z",
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      batch_start_index: -1,
      batch_file_count: -5,
      batch_prompt_count: -3,
      processed_files: -2,
      total_files: -5,
      completed: false,
      warnings: [],
    }],
    total_events: -1,
  }), {
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
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

test("browser bridge scan progress rejects malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ run_id: "scan-run-1" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanProgress("scan-run-1"),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan progress rejects impossible numeric payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: true,
    canceled: false,
    source_id: "codex",
    source_label: "Codex",
    source_index: 1,
    source_count: 2,
    files_seen: -1,
    source_files_seen: -1,
    source_files_discovered: -1,
    source_file_count: -5,
    prompts_found: -3,
    limit: -10,
    updated_at: "2026-06-07T00:00:00Z",
  }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanProgress("scan-run-1"),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ generated_at: "2026-06-07T00:00:00Z" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 1 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge stored prompt loads reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ generated_at: "2026-06-07T00:00:00Z" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => loadStoredPrompts({ limit: 1 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan plans reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ generated_at: "2026-06-07T00:00:00Z" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => planScan(),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan plans reject impossible numeric payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    total_sources: 1,
    available_sources: 1,
    total_files: -1,
    total_bytes: -1024,
    large_file_count: -1,
    largest_file_bytes: -512,
    sources: [{
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: -5,
      byte_count: -2048,
      large_file_count: -1,
      largest_file_bytes: -1024,
      newest_modified_at: null,
      notes: [],
    }],
    warnings: [],
  }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => planScan(),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge cancel scan results reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ run_id: "scan-run-1" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => cancelScan("scan-run-1"),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import batches reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ generated_at: "2026-06-07T00:00:00Z" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => importBatch({ source_id: "codex" }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject malformed successful payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ provider: "local" }), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => improvePrompt({ prompt: "Improve this prompt." }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

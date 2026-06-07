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

test("browser bridge import states reject progress counters beyond totals", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    states: [{
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      total_files: 10,
      total_bytes: 1024,
      next_file_index: 11,
      processed_files: 12,
      imported_prompt_count: 0,
      completed: false,
      updated_at: "2026-06-07T00:00:00Z",
    }],
    total_sources: 1,
    completed_sources: 0,
    total_files: 10,
    processed_files: 12,
    imported_prompt_count: 0,
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
      assert.doesNotMatch(error.message, /12 \/ 10|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import states reject aggregate counters beyond totals", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    states: [{
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      total_files: 10,
      total_bytes: 1024,
      next_file_index: 10,
      processed_files: 10,
      imported_prompt_count: 0,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    }],
    total_sources: 1,
    completed_sources: 2,
    total_files: 10,
    processed_files: 12,
    imported_prompt_count: 0,
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
      assert.doesNotMatch(error.message, /2 \/ 1|12 \/ 10|toLocaleString|RangeError|undefined/);
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

test("browser bridge import events reject progress counters beyond totals", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    events: [{
      id: 1,
      generated_at: "2026-06-07T00:00:00Z",
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      batch_start_index: 9,
      batch_file_count: 3,
      batch_prompt_count: 1,
      processed_files: 12,
      total_files: 10,
      completed: false,
      warnings: [],
    }],
    total_events: 1,
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
      assert.doesNotMatch(error.message, /12 \/ 10|toLocaleString|RangeError|undefined/);
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

test("browser bridge stored facets reject impossible numeric payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_prompts: -1,
    sources: [{ text: "codex", count: -5 }],
    dates: [{ text: "2026-06-07", count: -3 }],
    workspaces: [{ text: "PromptVault", count: -2 }],
  }), {
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
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

test("browser bridge scan progress rejects progress counters beyond totals", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: true,
    canceled: false,
    source_id: "codex",
    source_label: "Codex",
    source_index: 2,
    source_count: 1,
    files_seen: 12,
    source_files_seen: 12,
    source_files_discovered: 10,
    source_file_count: 10,
    prompts_found: 1,
    limit: 5,
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
      assert.doesNotMatch(error.message, /12 \/ 10|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan results reject invalid generated timestamps", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "not-a-date",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 0,
      total_files: 0,
      total_words: 0,
      average_words: 0,
      average_quality: 0,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [],
    },
    prompts: [],
    returned_prompt_count: 0,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /Invalid Date|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject unsupported preview sort values", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 0,
      total_files: 0,
      total_words: 0,
      average_words: 0,
      average_quality: 0,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [],
    },
    prompts: [],
    returned_prompt_count: 0,
    prompts_truncated: false,
    preview_sort: "quality_desc",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /quality_desc|최신순|개선 우선|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject impossible numeric payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: -1,
      total_files: -2,
      total_words: -3,
      average_words: -4,
      average_quality: -5,
      weak_prompt_count: -6,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: -1,
        prompts_found: -2,
        average_quality: -3,
        weak_prompt_count: -4,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "prompt-1",
      source: "codex",
      session_id: "session-1",
      path: "/tmp/codex/history.jsonl",
      timestamp: null,
      cwd: null,
      text: "Improve this prompt.",
      word_count: -3,
      char_count: -20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: -1,
        band: "weak",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: -1,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: -1,
      inserted_prompt_count: -2,
      updated_prompt_count: -3,
      date_count: -4,
    },
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject fractional integer payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1.5,
      total_files: 1,
      total_words: 3,
      average_words: 3.5,
      average_quality: 42.5,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 42.5,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "prompt-1",
      source: "codex",
      session_id: "session-1",
      path: "/tmp/codex/history.jsonl",
      timestamp: null,
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3.5,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42.5,
        band: "weak",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: 1.5,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject quality values above scoring cap", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 3,
      average_words: 3,
      average_quality: 101,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 101,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "prompt-1",
      source: "codex",
      session_id: "session-1",
      path: "/tmp/codex/history.jsonl",
      timestamp: null,
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 101,
        band: "strong",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: 1,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /101|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject returned counts beyond totals", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: "/tmp/promptvault.md",
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 3,
      average_words: 3,
      average_quality: 42.5,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 42.5,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "prompt-1",
      source: "codex",
      session_id: "session-1",
      path: "/tmp/codex/history.jsonl",
      timestamp: null,
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "weak",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: 2,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /2 \/ 1|2개 로드됨|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject unmarked truncated previews", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 2,
      total_files: 1,
      total_words: 6,
      average_words: 3,
      average_quality: 42.5,
      weak_prompt_count: 1,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 42.5,
        weak_prompt_count: 1,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "prompt-1",
      source: "codex",
      session_id: "session-1",
      path: "/tmp/codex/history.jsonl",
      timestamp: null,
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "weak",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: 1,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /1개 로드됨|1 \/ 2|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject weak counts beyond totals", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 3,
      average_words: 3,
      average_quality: 42.5,
      weak_prompt_count: 2,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 42.5,
        weak_prompt_count: 1,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "prompt-1",
      source: "codex",
      session_id: "session-1",
      path: "/tmp/codex/history.jsonl",
      timestamp: null,
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "weak",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: 1,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /약함|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject source weak counts beyond found prompts", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 3,
      average_words: 3,
      average_quality: 42.5,
      weak_prompt_count: 1,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 42.5,
        weak_prompt_count: 2,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "prompt-1",
      source: "codex",
      session_id: "session-1",
      path: "/tmp/codex/history.jsonl",
      timestamp: null,
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "weak",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: 1,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /약함 2|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject source file totals that mismatch aggregate files", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 3,
      average_words: 3,
      average_quality: 42.5,
      weak_prompt_count: 1,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 2,
        prompts_found: 1,
        average_quality: 42.5,
        weak_prompt_count: 1,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "prompt-1",
      source: "codex",
      session_id: "session-1",
      path: "/tmp/codex/history.jsonl",
      timestamp: null,
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "weak",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: 1,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /파일\s*1|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan plans reject aggregate counters beyond totals", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    total_sources: 1,
    available_sources: 2,
    total_files: 10,
    total_bytes: 1024,
    large_file_count: 11,
    largest_file_bytes: 2048,
    sources: [{
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 10,
      byte_count: 1024,
      large_file_count: 1,
      largest_file_bytes: 512,
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
      assert.doesNotMatch(error.message, /2 \/ 1|11|2 KB|toLocaleString|RangeError|undefined/);
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

test("browser bridge import batches reject invalid nested timestamps", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    source: {
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 0,
      byte_count: 0,
      large_file_count: 0,
      largest_file_bytes: 0,
      newest_modified_at: null,
      notes: [],
    },
    state: {
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      total_files: 0,
      total_bytes: 0,
      next_file_index: 0,
      processed_files: 0,
      imported_prompt_count: 0,
      completed: true,
      updated_at: "not-a-date",
    },
    batch_start_index: 0,
    batch_file_count: 0,
    batch_prompt_count: 0,
    returned_prompt_count: 0,
    prompts: [],
    stats: {
      total_prompts: 0,
      total_files: 0,
      total_words: 0,
      average_words: 0,
      average_quality: 0,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [],
    },
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 0,
      inserted_prompt_count: 0,
      updated_prompt_count: 0,
      date_count: 0,
    },
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /Invalid Date|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import batches reject impossible numeric payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    source: {
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 10,
      byte_count: 1024,
      large_file_count: 0,
      largest_file_bytes: 0,
      newest_modified_at: null,
      notes: [],
    },
    state: {
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      total_files: 10,
      total_bytes: 1024,
      next_file_index: 1,
      processed_files: 1,
      imported_prompt_count: 0,
      completed: false,
      updated_at: "2026-06-07T00:00:00Z",
    },
    batch_start_index: -1,
    batch_file_count: -5,
    batch_prompt_count: -3,
    returned_prompt_count: -2,
    prompts: [],
    stats: {
      total_prompts: 0,
      total_files: 0,
      total_words: 0,
      average_words: 0,
      average_quality: 0,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [],
      source_summaries: [],
    },
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 0,
      inserted_prompt_count: 0,
      updated_prompt_count: 0,
      date_count: 0,
    },
    warnings: [],
  }), {
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
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

test("browser bridge improvements reject impossible persistence counters", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    provider: "local",
    used_ai: false,
    revised_prompt: "Improve this prompt by adding context and success criteria.",
    rationale: ["Added context."],
    checklist: ["Verify expected outcome."],
    quality_delta: {
      before: {
        score: 40,
        band: "weak",
        missing: ["context"],
        suggestions: ["Add context."],
      },
      after: {
        score: 82,
        band: "strong",
        missing: [],
        suggestions: [],
      },
      score_delta: 42,
      resolved_gaps: ["context"],
      remaining_gaps: [],
    },
    warnings: [],
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      improvement_event_id: -1,
      prompt_improvement_count: -2,
    },
  }), {
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject non-finite score deltas", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(`{
    "provider": "local",
    "used_ai": false,
    "revised_prompt": "Improve this prompt by adding context and success criteria.",
    "rationale": ["Added context."],
    "checklist": ["Verify expected outcome."],
    "quality_delta": {
      "before": {
        "score": 40,
        "band": "weak",
        "missing": ["context"],
        "suggestions": ["Add context."]
      },
      "after": {
        "score": 82,
        "band": "strong",
        "missing": [],
        "suggestions": []
      },
      "score_delta": 1e999,
      "resolved_gaps": ["context"],
      "remaining_gaps": []
    },
    "warnings": [],
    "persistence": null
  }`, {
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
      assert.doesNotMatch(error.message, /Infinity|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject fractional score deltas", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    provider: "local",
    used_ai: false,
    revised_prompt: "Improve this prompt by adding context and success criteria.",
    rationale: ["Added context."],
    checklist: ["Verify expected outcome."],
    quality_delta: {
      before: {
        score: 40,
        band: "weak",
        missing: ["context"],
        suggestions: ["Add context."],
      },
      after: {
        score: 82,
        band: "strong",
        missing: [],
        suggestions: [],
      },
      score_delta: 42.5,
      resolved_gaps: ["context"],
      remaining_gaps: [],
    },
    warnings: [],
    persistence: null,
  }), {
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

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

function emptyScanStats(overrides = {}) {
  return {
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
    ...overrides,
  };
}

function emptyScanResult(overrides = {}) {
  return {
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: emptyScanStats(),
    prompts: [],
    returned_prompt_count: 0,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: null,
    warnings: [],
    ...overrides,
  };
}

function promptRecord(overrides = {}) {
  return {
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
      missing: ["context"],
      suggestions: ["Add context."],
    },
    ...overrides,
  };
}

function scanResultWithPrompt(promptOverrides = {}) {
  return emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 1,
      total_files: 1,
      total_words: 3,
      average_words: 3,
      average_quality: 42,
      weak_prompt_count: 1,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 42,
        weak_prompt_count: 1,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [promptRecord(promptOverrides)],
    returned_prompt_count: 1,
  });
}

function emptyScanPlan(overrides = {}) {
  return {
    generated_at: "2026-06-07T00:00:00Z",
    total_sources: 0,
    available_sources: 0,
    total_files: 0,
    total_bytes: 0,
    large_file_count: 0,
    largest_file_bytes: 0,
    sources: [],
    warnings: [],
    ...overrides,
  };
}

function importEventPayload(eventOverrides = {}) {
  return {
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    events: [{
      id: 1,
      generated_at: "2026-06-07T00:00:00Z",
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      batch_start_index: 0,
      batch_file_count: 0,
      batch_prompt_count: 0,
      processed_files: 0,
      total_files: 0,
      completed: true,
      warnings: [],
      ...eventOverrides,
    }],
    total_events: 1,
  };
}

function importBatchPayload(overrides = {}) {
  return {
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
      updated_at: "2026-06-07T00:00:00Z",
    },
    batch_start_index: 0,
    batch_file_count: 0,
    batch_prompt_count: 0,
    returned_prompt_count: 0,
    prompts: [],
    stats: emptyScanStats(),
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 0,
      inserted_prompt_count: 0,
      updated_prompt_count: 0,
      date_count: 0,
    },
    warnings: [],
    ...overrides,
  };
}

function improveResult(overrides = {}) {
  return {
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
    persistence: null,
    ...overrides,
  };
}

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

test("browser bridge import states reject blank database paths", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "   ",
    states: [],
    total_sources: 0,
    completed_sources: 0,
    total_files: 0,
    processed_files: 0,
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
      assert.doesNotMatch(error.message, /전체 소스|0개 파일|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import states reject blank source metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    states: [{
      source_id: "   ",
      source_label: "   ",
      root_path: "   ",
      total_files: 0,
      total_bytes: 0,
      next_file_index: 0,
      processed_files: 0,
      imported_prompt_count: 0,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    }],
    total_sources: 1,
    completed_sources: 1,
    total_files: 0,
    processed_files: 0,
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
      assert.doesNotMatch(error.message, /전체 소스|0개 파일|toLocaleString|RangeError|undefined/);
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

test("browser bridge import states reject aggregate counters that mismatch state rows", async (t) => {
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
      next_file_index: 5,
      processed_files: 5,
      imported_prompt_count: 3,
      completed: false,
      updated_at: "2026-06-07T00:00:00Z",
    }, {
      source_id: "claude",
      source_label: "Claude",
      root_path: "/tmp/claude",
      total_files: 4,
      total_bytes: 512,
      next_file_index: 4,
      processed_files: 4,
      imported_prompt_count: 2,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    }],
    total_sources: 2,
    completed_sources: 2,
    total_files: 14,
    processed_files: 9,
    imported_prompt_count: 5,
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
      assert.doesNotMatch(error.message, /2 \/ 2|9 \/ 14|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import states reject duplicate source ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    states: [{
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      total_files: 2,
      total_bytes: 200,
      next_file_index: 2,
      processed_files: 2,
      imported_prompt_count: 1,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    }, {
      source_id: "codex",
      source_label: "Codex duplicate",
      root_path: "/tmp/codex-duplicate",
      total_files: 3,
      total_bytes: 300,
      next_file_index: 3,
      processed_files: 3,
      imported_prompt_count: 1,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    }],
    total_sources: 2,
    completed_sources: 2,
    total_files: 5,
    processed_files: 5,
    imported_prompt_count: 2,
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
      assert.doesNotMatch(error.message, /Codex duplicate|2 \/ 2|5 \/ 5|2개 프롬프트|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import states reject row progress relation mismatches", async (t) => {
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
      next_file_index: 6,
      processed_files: 5,
      imported_prompt_count: 3,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    }],
    total_sources: 1,
    completed_sources: 1,
    total_files: 10,
    processed_files: 5,
    imported_prompt_count: 3,
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
      assert.doesNotMatch(error.message, /5 \/ 10|완료|6|toLocaleString|RangeError|undefined/);
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

test("browser bridge import events reject blank database paths", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "   ",
    events: [],
    total_events: 0,
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
      assert.doesNotMatch(error.message, /전체 이벤트|0|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import events reject duplicate event ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    events: [{
      id: 7,
      generated_at: "2026-06-07T00:00:00Z",
      source_id: "codex",
      source_label: "Codex",
      root_path: "/tmp/codex",
      batch_start_index: 0,
      batch_file_count: 2,
      batch_prompt_count: 1,
      processed_files: 2,
      total_files: 2,
      completed: true,
      warnings: [],
    }, {
      id: 7,
      generated_at: "2026-06-07T00:00:01Z",
      source_id: "claude",
      source_label: "Claude duplicate",
      root_path: "/tmp/claude",
      batch_start_index: 0,
      batch_file_count: 3,
      batch_prompt_count: 2,
      processed_files: 3,
      total_files: 3,
      completed: true,
      warnings: [],
    }],
    total_events: 2,
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
      assert.doesNotMatch(error.message, /Claude duplicate|전체 이벤트 2개|3개 파일|2개 프롬프트|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import events reject non-descending event ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    events: [{
      id: 3,
      generated_at: "2026-06-07T00:00:00Z",
      source_id: "codex",
      source_label: "Codex older",
      root_path: "/tmp/codex",
      batch_start_index: 0,
      batch_file_count: 1,
      batch_prompt_count: 1,
      processed_files: 1,
      total_files: 2,
      completed: false,
      warnings: [],
    }, {
      id: 9,
      generated_at: "2026-06-07T00:00:01Z",
      source_id: "claude",
      source_label: "Claude newer",
      root_path: "/tmp/claude",
      batch_start_index: 1,
      batch_file_count: 1,
      batch_prompt_count: 2,
      processed_files: 2,
      total_files: 2,
      completed: true,
      warnings: [],
    }],
    total_events: 2,
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
      assert.doesNotMatch(error.message, /Codex older|Claude newer|전체 이벤트 2개|2개 프롬프트|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import events reject blank source metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    events: [{
      id: 1,
      generated_at: "2026-06-07T00:00:00Z",
      source_id: "   ",
      source_label: "   ",
      root_path: "   ",
      batch_start_index: 0,
      batch_file_count: 0,
      batch_prompt_count: 0,
      processed_files: 0,
      total_files: 0,
      completed: true,
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
      assert.doesNotMatch(error.message, /전체 이벤트|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import events reject blank warnings", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(importEventPayload({
    warnings: ["   "],
  })), {
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
      assert.doesNotMatch(error.message, /전체 이벤트|Codex|경고 1개|toLocaleString|RangeError|undefined/);
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

test("browser bridge import events reject progress relation mismatches", async (t) => {
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
      batch_start_index: 2,
      batch_file_count: 3,
      batch_prompt_count: 1,
      processed_files: 4,
      total_files: 10,
      completed: true,
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
      assert.doesNotMatch(error.message, /4 \/ 10|완료|3개 파일|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import events reject total count below returned rows", async (t) => {
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
      batch_start_index: 0,
      batch_file_count: 1,
      batch_prompt_count: 2,
      processed_files: 1,
      total_files: 3,
      completed: false,
      warnings: [],
    }],
    total_events: 0,
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
      assert.doesNotMatch(error.message, /전체 이벤트|Codex|1 \/ 3|1개 파일|0|toLocaleString|RangeError|undefined/);
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

test("browser bridge stored facets reject blank database paths", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "   ",
    total_prompts: 0,
    sources: [],
    dates: [],
    workspaces: [],
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
      assert.doesNotMatch(error.message, /0개 저장됨|toLocaleString|RangeError|undefined/);
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

test("browser bridge stored facets reject counts beyond total prompts", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_prompts: 1,
    sources: [{ text: "Codex", count: 2 }],
    dates: [{ text: "2026-06-07", count: 1 }],
    workspaces: [{ text: "PromptVault", count: 1 }],
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
      assert.doesNotMatch(error.message, /1개 저장됨|Codex|count: 2|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge stored facets reject duplicate source values", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    database_path: "/tmp/promptvault.sqlite",
    total_prompts: 4,
    sources: [
      { text: "Codex", count: 2 },
      { text: "Codex", count: 2 },
    ],
    dates: [{ text: "2026-06-07", count: 4 }],
    workspaces: [{ text: "PromptVault", count: 4 }],
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
      assert.doesNotMatch(error.message, /4개 저장됨|Codex|2개|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan progress rejects blank run ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "   ",
    active: false,
    canceled: false,
    source_id: null,
    source_label: null,
    source_index: 0,
    source_count: 0,
    files_seen: 0,
    source_files_seen: 0,
    source_files_discovered: 0,
    source_file_count: null,
    prompts_found: 0,
    limit: null,
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
      assert.doesNotMatch(error.message, /스캔 진행|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan progress rejects mismatched run ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "other-scan-run",
    active: false,
    canceled: false,
    source_id: null,
    source_label: null,
    source_index: 0,
    source_count: 0,
    files_seen: 0,
    source_files_seen: 0,
    source_files_discovered: 0,
    source_file_count: null,
    prompts_found: 0,
    limit: null,
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
      assert.doesNotMatch(error.message, /other-scan-run|스캔 진행|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan progress rejects blank active source metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: true,
    canceled: false,
    source_id: "   ",
    source_label: "   ",
    source_index: 1,
    source_count: 1,
    files_seen: 1,
    source_files_seen: 1,
    source_files_discovered: 1,
    source_file_count: 1,
    prompts_found: 0,
    limit: 10,
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
      assert.doesNotMatch(error.message, /1 \/ 1|10|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan progress rejects partial source identity", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: true,
    canceled: false,
    source_id: "codex",
    source_label: null,
    source_index: 1,
    source_count: 2,
    files_seen: 1,
    source_files_seen: 1,
    source_files_discovered: 1,
    source_file_count: 1,
    prompts_found: 0,
    limit: 10,
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
      assert.doesNotMatch(error.message, /codex|소스 준비 중|1 \/ 1|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan progress rejects source identity without source position", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: true,
    canceled: false,
    source_id: "codex",
    source_label: "Codex",
    source_index: 0,
    source_count: 2,
    files_seen: 1,
    source_files_seen: 1,
    source_files_discovered: 1,
    source_file_count: 1,
    prompts_found: 0,
    limit: 10,
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
      assert.doesNotMatch(error.message, /Codex|소스 대기 중|1 \/ 1|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan progress rejects source-less counters", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: true,
    canceled: false,
    source_id: null,
    source_label: null,
    source_index: 0,
    source_count: 2,
    files_seen: 1,
    source_files_seen: 1,
    source_files_discovered: 1,
    source_file_count: 1,
    prompts_found: 1,
    limit: 10,
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
      assert.doesNotMatch(error.message, /소스 준비 중|1 \/ 1|1개 프롬프트|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan progress rejects source counters beyond aggregate files", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: true,
    canceled: false,
    source_id: "codex",
    source_label: "Codex",
    source_index: 1,
    source_count: 2,
    files_seen: 1,
    source_files_seen: 2,
    source_files_discovered: 2,
    source_file_count: 2,
    prompts_found: 0,
    limit: 10,
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
      assert.doesNotMatch(error.message, /Codex|2 \/ 2|10|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan progress rejects prompt counts beyond finite limits", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: true,
    canceled: false,
    source_id: "codex",
    source_label: "Codex",
    source_index: 1,
    source_count: 2,
    files_seen: 2,
    source_files_seen: 2,
    source_files_discovered: 2,
    source_file_count: 2,
    prompts_found: 2,
    limit: 1,
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
      assert.doesNotMatch(error.message, /Codex|2개 프롬프트|제한 1|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan progress rejects inactive snapshots with stale counters", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "scan-run-1",
    active: false,
    canceled: false,
    source_id: "codex",
    source_label: "Codex",
    source_index: 1,
    source_count: 2,
    files_seen: 5,
    source_files_seen: 5,
    source_files_discovered: 5,
    source_file_count: 5,
    prompts_found: 3,
    limit: 10,
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
      assert.doesNotMatch(error.message, /Codex|5 \/ 5|3개|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan results reject blank output paths", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: "   ",
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
    markdown_written: true,
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
      assert.doesNotMatch(error.message, /내보내기|미리보기|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject output paths when markdown was not written", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: "/tmp/promptvault.md",
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
      assert.doesNotMatch(error.message, /\/tmp\/promptvault\.md|내보내기|미리보기|toLocaleString|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject hidden markdown bodies", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    markdown: "# Hidden PromptVault export\n\nPrompt body should not be serialized.",
    markdown_included: false,
    markdown_written: false,
  })), {
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
      assert.doesNotMatch(error.message, /Hidden PromptVault export|Prompt body should not be serialized|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge stored prompt loads reject hidden markdown bodies", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    markdown: "# Hidden stored prompt export\n\nStored prompt body should stay omitted.",
    markdown_included: false,
    markdown_written: false,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => loadStoredPrompts(),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /Hidden stored prompt export|Stored prompt body should stay omitted|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject written markdown without output paths", async (t) => {
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
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: true,
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
      assert.doesNotMatch(error.message, /내보내기|미리보기|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank warnings", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    warnings: ["   "],
  })), {
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
      assert.doesNotMatch(error.message, /내보내기|미리보기|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank source notes", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_files: 1,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 0,
        average_quality: 0,
        weak_prompt_count: 0,
        status: "partial",
        notes: ["   "],
      }],
    }),
  })), {
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
      assert.doesNotMatch(error.message, /Codex|partial|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank source summary metadata", async (t) => {
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
      source_summaries: [{
        id: "   ",
        label: "   ",
        root_path: "   ",
        files_seen: 0,
        prompts_found: 0,
        average_quality: 0,
        weak_prompt_count: 0,
        status: "   ",
        notes: [],
      }],
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
      assert.doesNotMatch(error.message, /소스|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank prompt metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 0,
      average_words: 0,
      average_quality: 42,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 42,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "   ",
      source: "   ",
      session_id: "   ",
      path: "   ",
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "   ",
      word_count: 0,
      char_count: 3,
      hash: "   ",
      risk_flags: [],
      quality: {
        score: 42,
        band: "   ",
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
      assert.doesNotMatch(error.message, /1개 로드|알 수 없음|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank optional prompt metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(scanResultWithPrompt({
    timestamp: "   ",
    cwd: "   ",
  })), {
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
      assert.doesNotMatch(error.message, /시간 없음|작업공간 없음|선택 항목|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject missing nullable prompt metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(scanResultWithPrompt({
    timestamp: undefined,
    cwd: undefined,
  })), {
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
      assert.doesNotMatch(error.message, /시간 없음|작업공간 없음|선택 항목|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank risk flags", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(scanResultWithPrompt({
    risk_flags: ["   "],
  })), {
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
      assert.doesNotMatch(error.message, /알 수 없음|긴 토큰|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank prompt quality helper text", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(scanResultWithPrompt({
    quality: {
      score: 42,
      band: "weak",
      missing: ["   "],
      suggestions: ["   "],
    },
  })), {
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
      assert.doesNotMatch(error.message, /선택 항목|알 수 없음|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject duplicate prompt ids", async (t) => {
  const originalFetch = globalThis.fetch;
  const duplicatePrompt = promptRecord({ id: "prompt-duplicate" });
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 1,
      total_words: 6,
      average_words: 3,
      average_quality: 42,
      weak_prompt_count: 2,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 42,
        weak_prompt_count: 2,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [
      duplicatePrompt,
      promptRecord({
        id: "prompt-duplicate",
        session_id: "session-2",
        path: "/tmp/codex/other-history.jsonl",
        hash: "hash-2",
      }),
    ],
    returned_prompt_count: 2,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 2 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /prompt-duplicate|2개 로드|Improve this prompt|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan results reject empty prompt aggregates with word totals", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 0,
      total_files: 0,
      total_words: 3,
      average_words: 3,
      average_quality: 42.5,
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
      assert.doesNotMatch(error.message, /42\.5|3개 단어|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject impossible persistence aggregates", async (t) => {
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
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
        missing: [],
        suggestions: [],
      },
    }],
    returned_prompt_count: 1,
    prompts_truncated: false,
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 1,
      inserted_prompt_count: 1,
      updated_prompt_count: 1,
      date_count: 2,
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
      assert.doesNotMatch(error.message, /저장\s*1|신규\s*1|갱신\s*1|날짜\s*2|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank persistence database paths", async (t) => {
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
    preview_sort: "latest",
    markdown_included: false,
    markdown_written: false,
    persistence: {
      database_path: "   ",
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
    () => scanPrompts({ limit: 1 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /0개 저장|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject date buckets beyond aggregate prompts", async (t) => {
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
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }, {
        text: "2026-06-06",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
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
      assert.doesNotMatch(error.message, /2026-06-07\s+1|2026-06-06\s+1|2개 날짜|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject top word counts beyond aggregate words", async (t) => {
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
      weak_prompt_count: 0,
      top_words: [{
        text: "ghost",
        count: 999,
      }],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
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
      assert.doesNotMatch(error.message, /ghost|999|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject top phrase counts beyond aggregate words", async (t) => {
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
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [{
        text: "ghost phrase",
        count: 999,
      }],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
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
      assert.doesNotMatch(error.message, /ghost phrase|999|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject repeated prompt counts beyond aggregate prompts", async (t) => {
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
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [{
        text: "improve this prompt.",
        count: 999,
      }],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
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
      assert.doesNotMatch(error.message, /improve this prompt|999|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject quality gap counts beyond aggregate prompts", async (t) => {
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
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [{
        text: "context",
        count: 999,
      }],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
        missing: ["context"],
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
      assert.doesNotMatch(error.message, /context|맥락|999|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject blank frequency labels", async (t) => {
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
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [{
        text: "   ",
        count: 1,
      }],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
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
      assert.doesNotMatch(error.message, /toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject prompt char counts that mismatch text", async (t) => {
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
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 999,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
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
      assert.doesNotMatch(error.message, /999|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject prompt word counts that mismatch text", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 999,
      average_words: 999,
      average_quality: 42.5,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 999,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
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
      assert.doesNotMatch(error.message, /999개 단어|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject untruncated total word mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 1,
      total_files: 1,
      total_words: 4,
      average_words: 4,
      average_quality: 42,
      weak_prompt_count: 1,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 42,
        weak_prompt_count: 1,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [promptRecord()],
    returned_prompt_count: 1,
    prompts_truncated: false,
  })), {
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
      assert.doesNotMatch(error.message, /4개 단어|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject average word mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 1,
      total_words: 6,
      average_words: 4,
      average_quality: 42,
      weak_prompt_count: 2,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 42,
        weak_prompt_count: 2,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [
      promptRecord(),
      promptRecord({
        hash: "hash-2",
        id: "prompt-2",
        path: "/tmp/codex/history-2.jsonl",
        session_id: "session-2",
      }),
    ],
    returned_prompt_count: 2,
    prompts_truncated: false,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 2 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /4개 단어|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject untruncated average quality mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 1,
      total_words: 6,
      average_words: 3,
      average_quality: 90,
      weak_prompt_count: 2,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 42,
        weak_prompt_count: 2,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [
      promptRecord(),
      promptRecord({
        hash: "hash-2",
        id: "prompt-2",
        path: "/tmp/codex/history-2.jsonl",
        session_id: "session-2",
      }),
    ],
    returned_prompt_count: 2,
    prompts_truncated: false,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 2 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /품질 90|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject untruncated weak count mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 1,
      total_words: 6,
      average_words: 3,
      average_quality: 42,
      weak_prompt_count: 1,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 42,
        weak_prompt_count: 1,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [
      promptRecord(),
      promptRecord({
        hash: "hash-2",
        id: "prompt-2",
        path: "/tmp/codex/history-2.jsonl",
        session_id: "session-2",
      }),
    ],
    returned_prompt_count: 2,
    prompts_truncated: false,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 2 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /약함 1|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject untruncated source average quality mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 1,
      total_words: 6,
      average_words: 3,
      average_quality: 50,
      weak_prompt_count: 0,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 80,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [
      promptRecord({
        quality: {
          score: 20,
          band: "medium",
          missing: [],
          suggestions: [],
        },
      }),
      promptRecord({
        hash: "hash-2",
        id: "prompt-2",
        path: "/tmp/codex/history-2.jsonl",
        session_id: "session-2",
        quality: {
          score: 80,
          band: "medium",
          missing: [],
          suggestions: [],
        },
      }),
    ],
    returned_prompt_count: 2,
    prompts_truncated: false,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 2 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /품질 80|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject untruncated source prompt count mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 2,
      total_words: 6,
      average_words: 3,
      average_quality: 50,
      weak_prompt_count: 0,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 20,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }, {
        id: "claude",
        label: "Claude",
        root_path: "/tmp/claude",
        files_seen: 1,
        prompts_found: 0,
        average_quality: 80,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [
      promptRecord({
        quality: {
          score: 20,
          band: "medium",
          missing: [],
          suggestions: [],
        },
      }),
      promptRecord({
        hash: "hash-2",
        id: "prompt-2",
        source: "claude",
        path: "/tmp/claude/history-2.jsonl",
        session_id: "session-2",
        quality: {
          score: 80,
          band: "medium",
          missing: [],
          suggestions: [],
        },
      }),
    ],
    returned_prompt_count: 2,
    prompts_truncated: false,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 2 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /2개 프롬프트|Claude|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject untruncated source weak count mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 2,
      total_words: 6,
      average_words: 3,
      average_quality: 50,
      weak_prompt_count: 1,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 20,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }, {
        id: "claude",
        label: "Claude",
        root_path: "/tmp/claude",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 80,
        weak_prompt_count: 1,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [
      promptRecord({
        quality: {
          score: 20,
          band: "weak",
          missing: ["context"],
          suggestions: ["Add context."],
        },
      }),
      promptRecord({
        hash: "hash-2",
        id: "prompt-2",
        source: "claude",
        path: "/tmp/claude/history-2.jsonl",
        session_id: "session-2",
        quality: {
          score: 80,
          band: "medium",
          missing: [],
          suggestions: [],
        },
      }),
    ],
    returned_prompt_count: 2,
    prompts_truncated: false,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 2 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /약함 1|Claude|Improve this prompt|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan results reject duplicate source summary ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 2,
      total_words: 6,
      average_words: 3,
      average_quality: 50,
      weak_prompt_count: 0,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 20,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }, {
        id: "codex",
        label: "Codex duplicate",
        root_path: "/tmp/codex-duplicate",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 20,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
    }),
    prompts: [
      promptRecord({
        quality: {
          score: 20,
          band: "medium",
          missing: [],
          suggestions: [],
        },
      }),
      promptRecord({
        hash: "hash-2",
        id: "prompt-2",
        source: "claude",
        path: "/tmp/claude/history-2.jsonl",
        session_id: "session-2",
        quality: {
          score: 80,
          band: "medium",
          missing: [],
          suggestions: [],
        },
      }),
    ],
    returned_prompt_count: 2,
    prompts_truncated: false,
  })), {
    status: 200,
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    () => scanPrompts({ limit: 2 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /Codex duplicate|Claude|Improve this prompt|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan results reject source prompt totals that exceed aggregate prompts", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 2,
      total_words: 3,
      average_words: 3,
      average_quality: 42.5,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
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
      }, {
        id: "claude",
        label: "Claude",
        root_path: "/tmp/claude",
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
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "Improve this prompt.",
      word_count: 3,
      char_count: 20,
      hash: "hash-1",
      risk_flags: [],
      quality: {
        score: 42,
        band: "medium",
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
      assert.doesNotMatch(error.message, /2\s*\/\s*1|2개 프롬프트|Codex|Claude|toLocaleString|RangeError|undefined/);
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

test("browser bridge stored prompt loads reject missing persistence snapshots", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult()), {
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
      assert.doesNotMatch(error.message, /database|persistence|null|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge stored prompt loads reject scan export response state", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanResult({
    output_path: "/tmp/promptvault.md",
    markdown: "# PromptVault export\n\nStored prompt details should not be attached.",
    markdown_included: true,
    markdown_written: true,
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 0,
      inserted_prompt_count: 0,
      updated_prompt_count: 0,
      date_count: 0,
    },
  })), {
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
      assert.doesNotMatch(error.message, /promptvault\.md|PromptVault export|Stored prompt details|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge stored prompt loads reject blank prompt metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    output_path: null,
    markdown: "",
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 0,
      average_words: 0,
      average_quality: 42,
      weak_prompt_count: 0,
      top_words: [],
      top_phrases: [],
      repeated_prompts: [],
      top_quality_gaps: [],
      prompts_by_date: [{
        text: "2026-06-07",
        count: 1,
      }],
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 1,
        average_quality: 42,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
    },
    prompts: [{
      id: "   ",
      source: "   ",
      session_id: "   ",
      path: "   ",
      timestamp: "2026-06-07T00:00:00Z",
      cwd: null,
      text: "   ",
      word_count: 0,
      char_count: 3,
      hash: "   ",
      risk_flags: [],
      quality: {
        score: 42,
        band: "   ",
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
    () => loadStoredPrompts({ limit: 1 }),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 응답 형식이 올바르지 않습니다/);
      assert.doesNotMatch(error.message, /1개 로드|알 수 없음|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan plans reject blank source metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    total_sources: 1,
    available_sources: 1,
    total_files: 0,
    total_bytes: 0,
    large_file_count: 0,
    largest_file_bytes: 0,
    sources: [{
      id: "   ",
      label: "   ",
      root_path: "   ",
      status: "   ",
      file_count: 0,
      byte_count: 0,
      large_file_count: 0,
      largest_file_bytes: 0,
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
      assert.doesNotMatch(error.message, /1 \/ 1|0개 파일|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan plans reject invalid source modified timestamps", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanPlan({
    total_sources: 1,
    available_sources: 1,
    total_files: 1,
    total_bytes: 128,
    largest_file_bytes: 128,
    sources: [{
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 1,
      byte_count: 128,
      large_file_count: 0,
      largest_file_bytes: 128,
      newest_modified_at: "   ",
      notes: [],
    }],
  })), {
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
      assert.doesNotMatch(error.message, /Codex|1개 파일|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan plans reject missing nullable source metadata", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanPlan({
    total_sources: 1,
    available_sources: 1,
    total_files: 1,
    total_bytes: 128,
    largest_file_bytes: 128,
    sources: [{
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 1,
      byte_count: 128,
      large_file_count: 0,
      largest_file_bytes: 128,
      notes: [],
    }],
  })), {
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
      assert.doesNotMatch(error.message, /Codex|\/tmp\/codex|1개 파일|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan plans reject blank warnings", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanPlan({
    warnings: ["   "],
  })), {
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
      assert.doesNotMatch(error.message, /0개 파일|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan plans reject blank source notes", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanPlan({
    total_sources: 1,
    available_sources: 1,
    sources: [{
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 0,
      byte_count: 0,
      large_file_count: 0,
      largest_file_bytes: 0,
      newest_modified_at: null,
      notes: ["   "],
    }],
  })), {
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
      assert.doesNotMatch(error.message, /Codex|0개 파일|toLocaleString|RangeError|undefined/);
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

test("browser bridge scan plans reject impossible source size counters", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    total_sources: 2,
    available_sources: 2,
    total_files: 3,
    total_bytes: 200,
    large_file_count: 2,
    largest_file_bytes: 200,
    sources: [{
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 1,
      byte_count: 100,
      large_file_count: 2,
      largest_file_bytes: 200,
      newest_modified_at: null,
      notes: [],
    }, {
      id: "claude",
      label: "Claude",
      root_path: "/tmp/claude",
      status: "ok",
      file_count: 2,
      byte_count: 100,
      large_file_count: 0,
      largest_file_bytes: 100,
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
      assert.doesNotMatch(error.message, /Codex|Claude|200 B|2 \/ 1|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan plans reject duplicate source ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(emptyScanPlan({
    total_sources: 2,
    available_sources: 2,
    total_files: 3,
    total_bytes: 300,
    large_file_count: 0,
    largest_file_bytes: 200,
    sources: [{
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 1,
      byte_count: 100,
      large_file_count: 0,
      largest_file_bytes: 100,
      newest_modified_at: null,
      notes: [],
    }, {
      id: "codex",
      label: "Codex duplicate",
      root_path: "/tmp/codex-duplicate",
      status: "ok",
      file_count: 2,
      byte_count: 200,
      large_file_count: 0,
      largest_file_bytes: 200,
      newest_modified_at: null,
      notes: [],
    }],
  })), {
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
      assert.doesNotMatch(error.message, /Codex duplicate|3개 파일|300 B|toLocaleString|RangeError|undefined/);
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

test("browser bridge cancel scan results reject blank run ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "   ",
    canceled: true,
  }), {
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

test("browser bridge cancel scan results reject mismatched run ids", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    run_id: "other-scan-run",
    canceled: true,
  }), {
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
      assert.doesNotMatch(error.message, /other-scan-run|toLocaleString|TypeError|undefined/);
      return true;
    },
  );
});

test("browser bridge scan plans reject aggregate counters that mismatch source rows", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    total_sources: 1,
    available_sources: 1,
    total_files: 5,
    total_bytes: 500,
    large_file_count: 0,
    largest_file_bytes: 500,
    sources: [{
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 5,
      byte_count: 500,
      large_file_count: 0,
      largest_file_bytes: 500,
      newest_modified_at: null,
      notes: [],
    }, {
      id: "claude",
      label: "Claude",
      root_path: "/tmp/claude",
      status: "missing",
      file_count: 2,
      byte_count: 200,
      large_file_count: 1,
      largest_file_bytes: 200,
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
      assert.doesNotMatch(error.message, /1 \/ 1|5|500|Codex|Claude|toLocaleString|RangeError|undefined/);
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

test("browser bridge import batches reject blank warnings", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(importBatchPayload({
    warnings: ["   "],
  })), {
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
      assert.doesNotMatch(error.message, /Codex|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import batches reject invalid source modified timestamps", async (t) => {
  const originalFetch = globalThis.fetch;
  const payload = importBatchPayload();
  globalThis.fetch = async () => new Response(JSON.stringify({
    ...payload,
    source: {
      ...payload.source,
      newest_modified_at: "not-a-date",
    },
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
      assert.doesNotMatch(error.message, /Codex|toLocaleString|RangeError|undefined/);
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

test("browser bridge import batches reject blank persistence database paths", async (t) => {
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
      updated_at: "2026-06-07T00:00:00Z",
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
      database_path: "   ",
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
      assert.doesNotMatch(error.message, /0개 저장|Codex|toLocaleString|RangeError|undefined/);
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

test("browser bridge import batches reject returned counts that mismatch prompts", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    generated_at: "2026-06-07T00:00:00Z",
    source: {
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 1,
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
      total_files: 1,
      total_bytes: 1024,
      next_file_index: 1,
      processed_files: 1,
      imported_prompt_count: 1,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    },
    batch_start_index: 0,
    batch_file_count: 1,
    batch_prompt_count: 1,
    returned_prompt_count: 2,
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
    stats: {
      total_prompts: 1,
      total_files: 1,
      total_words: 3,
      average_words: 3,
      average_quality: 42,
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
        average_quality: 42,
        weak_prompt_count: 1,
        status: "ok",
        notes: [],
      }],
    },
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 1,
      inserted_prompt_count: 1,
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
      assert.doesNotMatch(error.message, /2개|2 \/ 1|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import batches reject duplicate prompt ids", async (t) => {
  const originalFetch = globalThis.fetch;
  const duplicatePrompt = promptRecord({ id: "prompt-duplicate" });
  globalThis.fetch = async () => new Response(JSON.stringify(importBatchPayload({
    source: {
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 1,
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
      total_files: 1,
      total_bytes: 1024,
      next_file_index: 1,
      processed_files: 1,
      imported_prompt_count: 2,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    },
    batch_start_index: 0,
    batch_file_count: 1,
    batch_prompt_count: 2,
    returned_prompt_count: 2,
    prompts: [
      duplicatePrompt,
      promptRecord({
        id: "prompt-duplicate",
        session_id: "session-2",
        path: "/tmp/codex/other-history.jsonl",
        hash: "hash-2",
      }),
    ],
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 1,
      total_words: 6,
      average_words: 3,
      average_quality: 42,
      weak_prompt_count: 2,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 42,
        weak_prompt_count: 2,
        status: "ok",
        notes: [],
      }],
    }),
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 2,
      inserted_prompt_count: 2,
      updated_prompt_count: 0,
      date_count: 0,
    },
  })), {
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
      assert.doesNotMatch(error.message, /prompt-duplicate|Improve this prompt|Codex|2개|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import batches reject complete prompt aggregate mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(importBatchPayload({
    source: {
      id: "codex",
      label: "Codex",
      root_path: "/tmp/codex",
      status: "ok",
      file_count: 1,
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
      total_files: 1,
      total_bytes: 1024,
      next_file_index: 1,
      processed_files: 1,
      imported_prompt_count: 2,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    },
    batch_start_index: 0,
    batch_file_count: 1,
    batch_prompt_count: 2,
    returned_prompt_count: 2,
    prompts: [
      promptRecord(),
      promptRecord({
        id: "prompt-2",
        session_id: "session-2",
        path: "/tmp/codex/other-history.jsonl",
        hash: "hash-2",
      }),
    ],
    stats: emptyScanStats({
      total_prompts: 2,
      total_files: 1,
      total_words: 8,
      average_words: 4,
      average_quality: 42,
      weak_prompt_count: 2,
      source_summaries: [{
        id: "codex",
        label: "Codex",
        root_path: "/tmp/codex",
        files_seen: 1,
        prompts_found: 2,
        average_quality: 42,
        weak_prompt_count: 2,
        status: "ok",
        notes: [],
      }],
    }),
    persistence: {
      database_path: "/tmp/promptvault.sqlite",
      stored_prompt_count: 2,
      inserted_prompt_count: 2,
      updated_prompt_count: 0,
      date_count: 0,
    },
  })), {
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
      assert.doesNotMatch(error.message, /8개 단어|Improve this prompt|Codex|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge import batches reject file windows beyond source totals", async (t) => {
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
      next_file_index: 10,
      processed_files: 10,
      imported_prompt_count: 0,
      completed: true,
      updated_at: "2026-06-07T00:00:00Z",
    },
    batch_start_index: 9,
    batch_file_count: 2,
    batch_prompt_count: 0,
    returned_prompt_count: 0,
    prompts: [],
    stats: {
      total_prompts: 0,
      total_files: 1,
      total_words: 0,
      average_words: 0,
      average_quality: 0,
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
        prompts_found: 0,
        average_quality: 0,
        weak_prompt_count: 0,
        status: "ok",
        notes: [],
      }],
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
      assert.doesNotMatch(error.message, /11|2개 파일|toLocaleString|RangeError|undefined/);
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

test("browser bridge improvements reject blank provider and revised prompt", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    provider: "   ",
    used_ai: false,
    revised_prompt: "   ",
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
      assert.doesNotMatch(error.message, /local\/OpenAI\/GLM|추천|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject blank rationale and checklist items", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    provider: "local",
    used_ai: false,
    revised_prompt: "Improve this prompt by adding context and success criteria.",
    rationale: ["   "],
    checklist: ["Verify expected outcome.", "   "],
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
      assert.doesNotMatch(error.message, /Added context|Verify expected outcome|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject blank warnings", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(improveResult({
    warnings: ["   "],
  })), {
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
      assert.doesNotMatch(error.message, /추천|경고|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject blank quality delta helper text", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(improveResult({
    quality_delta: {
      before: {
        score: 40,
        band: "weak",
        missing: ["   "],
        suggestions: ["   "],
      },
      after: {
        score: 82,
        band: "strong",
        missing: ["   "],
        suggestions: ["   "],
      },
      score_delta: 42,
      resolved_gaps: ["   "],
      remaining_gaps: ["   "],
    },
  })), {
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
      assert.doesNotMatch(error.message, /알 수 없음|해결됨|남음|추천|toLocaleString|RangeError|undefined/);
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

test("browser bridge improvements reject blank persistence database paths", async (t) => {
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
      database_path: "   ",
      improvement_event_id: 1,
      prompt_improvement_count: 1,
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
      assert.doesNotMatch(error.message, /추천 이력 #1|이 프롬프트 1회|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject blank quality bands", async (t) => {
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
        band: "   ",
        missing: ["context"],
        suggestions: ["Add context."],
      },
      after: {
        score: 82,
        band: "   ",
        missing: [],
        suggestions: [],
      },
      score_delta: 42,
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
      assert.doesNotMatch(error.message, /알 수 없음|추천|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject zero persistence identifiers", async (t) => {
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
      improvement_event_id: 0,
      prompt_improvement_count: 0,
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
      assert.doesNotMatch(error.message, /추천 이력 #0|이 프롬프트 0회|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject score delta mismatches", async (t) => {
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
      score_delta: -42,
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
      assert.doesNotMatch(error.message, /-42|Improve this prompt by adding context|추천|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject remaining gap mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    provider: "local",
    used_ai: false,
    revised_prompt: "Improve this prompt by adding context while preserving success criteria.",
    rationale: ["Added context."],
    checklist: ["Verify expected outcome."],
    quality_delta: {
      before: {
        score: 40,
        band: "weak",
        missing: ["context", "success criteria"],
        suggestions: ["Add context.", "Define success criteria."],
      },
      after: {
        score: 70,
        band: "medium",
        missing: ["success criteria"],
        suggestions: ["Define success criteria."],
      },
      score_delta: 30,
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
      assert.doesNotMatch(error.message, /success criteria|Improve this prompt by adding context|추천|toLocaleString|RangeError|undefined/);
      return true;
    },
  );
});

test("browser bridge improvements reject resolved gap mismatches", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    provider: "local",
    used_ai: false,
    revised_prompt: "Improve this prompt by adding context while preserving success criteria.",
    rationale: ["Added context."],
    checklist: ["Verify expected outcome."],
    quality_delta: {
      before: {
        score: 40,
        band: "weak",
        missing: ["context", "success criteria"],
        suggestions: ["Add context.", "Define success criteria."],
      },
      after: {
        score: 70,
        band: "medium",
        missing: ["success criteria"],
        suggestions: ["Define success criteria."],
      },
      score_delta: 30,
      resolved_gaps: ["context", "success criteria"],
      remaining_gaps: ["success criteria"],
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
      assert.doesNotMatch(error.message, /success criteria|Improve this prompt by adding context|추천|toLocaleString|RangeError|undefined/);
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

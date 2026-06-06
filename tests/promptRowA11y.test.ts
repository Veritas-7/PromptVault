import assert from "node:assert/strict";
import test from "node:test";
import { promptRowAriaLabel, selectedPromptMetaLabel } from "../src/promptRowA11y.ts";
import type { PromptRecord } from "../src/types.ts";

function promptRecord(overrides: Partial<PromptRecord> = {}): PromptRecord {
  return {
    id: "prompt-1",
    source: "Codex",
    session_id: "session-1",
    path: "/tmp/session.jsonl",
    timestamp: "2026-06-06T12:00:00Z",
    cwd: "/Users/wj",
    text: "Return exactly OK",
    word_count: 3,
    char_count: 17,
    hash: "abc123",
    risk_flags: [],
    quality: {
      score: 36,
      band: "weak",
      missing: [],
      suggestions: [],
    },
    ...overrides,
  };
}

test("prompt row labels distinguish duplicate prompt text by list position", () => {
  const first = promptRowAriaLabel(promptRecord(), 0, 2);
  const second = promptRowAriaLabel(promptRecord({ id: "prompt-2" }), 1, 2);

  assert.notEqual(first, second);
  assert.match(first, /^Prompt 1 of 2:/);
  assert.match(second, /^Prompt 2 of 2:/);
  assert.match(first, /Return exactly OK$/);
});

test("prompt row labels compact whitespace and include quality metadata", () => {
  assert.equal(
    promptRowAriaLabel(promptRecord({ text: "  Improve\n\nthis\tprompt  ", word_count: 3 }), 0, 1),
    "Prompt 1 of 1: Codex, 2026-06-06T12:00:00Z, 3 words, quality 36 weak, Improve this prompt",
  );
});

test("prompt row labels avoid unbounded prompt text", () => {
  const label = promptRowAriaLabel(promptRecord({ text: "x ".repeat(200), word_count: 200 }), 0, 1);

  assert.ok(label.endsWith("..."));
  assert.ok(label.length < 230);
});

test("prompt row labels handle missing timestamps and empty prompts", () => {
  assert.equal(
    promptRowAriaLabel(promptRecord({ timestamp: null, text: "   ", word_count: 0 }), 0, 1),
    "Prompt 1 of 1: Codex, unknown time, 0 words, quality 36 weak, empty prompt",
  );
});

test("selected prompt metadata label separates visual chips", () => {
  assert.equal(
    selectedPromptMetaLabel(promptRecord()),
    "Selected prompt metadata: Codex, 2026-06-06T12:00:00Z, /Users/wj, quality 36 weak",
  );
});

test("selected prompt metadata label handles missing values", () => {
  assert.equal(
    selectedPromptMetaLabel(promptRecord({ cwd: null, timestamp: null })),
    "Selected prompt metadata: Codex, unknown time, unknown workspace, quality 36 weak",
  );
});

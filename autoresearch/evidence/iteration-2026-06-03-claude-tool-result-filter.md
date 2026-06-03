# AutoResearch Iteration: Claude Tool-Result Filter

Date: 2026-06-03

## Change

- Added a focused Rust regression test for Claude project JSONL user-role messages containing `type=tool_result` blocks.
- Updated the shared `text_from_value` array extractor to skip `tool_result` items before reading string `content`.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-claude-tool-result-filter.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-claude-tool-result-filter.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test parse_claude_project_jsonl_skips_tool_result_blocks` failed with 2 records instead of 1.
- GREEN: `cargo test parse_claude_project_jsonl_skips_tool_result_blocks` passed.
- Full gate: `npm run check` passed.

## Result

Tool output from Claude project logs is no longer counted as user-authored prompt text, reducing noise in frequency, quality, and repair views.

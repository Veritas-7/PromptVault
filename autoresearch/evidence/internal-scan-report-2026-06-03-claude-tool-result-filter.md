# Internal Scan Report: Claude Tool-Result Filter

Generated: 2026-06-03T20:47:45+0900

## Local Evidence

Claude project JSONL files under `/Users/example/.claude/projects` include `message.role=user` records whose content array contains `type=tool_result` items. Some of those tool result blocks carry string `content`, which the shared extractor previously treated as prompt text.

## RED

Command:

```bash
cargo test parse_claude_project_jsonl_skips_tool_result_blocks
```

Result: FAIL as expected. The focused test collected 2 records instead of the expected 1.

## GREEN

Command:

```bash
cargo test parse_claude_project_jsonl_skips_tool_result_blocks
```

Result: PASS after `text_from_value` ignored `type=tool_result` array items.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 36 Rust library tests, 13 CLI tests, doc-tests, and strict clippy.

## Commit

Code commit: `712a6d20d6e914974d8c344ceedd0b66561994b7`
